import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "../config/supabase.js";
import { addRegistrationCounts } from "../services/event.service.js";
import { haversineKm } from "../utils/events.js";
import { env } from "../config/env.js";

let aiClient;

function getAI() {
  if (!env.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  aiClient ||= new GoogleGenAI({
    apiKey: env.geminiApiKey,
  });

  return aiClient;
}

function parseJson(text) {
  const cleaned = String(text || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

function isRateLimitError(error) {
  const message = String(
    error?.message || error?.error?.message || error || "",
  ).toLowerCase();

  const status =
    error?.status || error?.statusCode || error?.code || error?.error?.code;

  return (
    status === 429 ||
    message.includes("429") ||
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    message.includes("quota exceeded") ||
    message.includes("resource exhausted")
  );
}

// ============================================================
// PARSE EVENT
// ============================================================

export async function parseEvent(req, res, next) {
  try {
    const prompt = String(req.body?.prompt || "").trim();

    if (!prompt) {
      return res.status(400).json({
        error: "Event description is required.",
      });
    }

    const response = await getAI().models.generateContent({
      model: env.geminiModel,

      contents: `
Extract event information from the user's description.

Return ONLY valid JSON with exactly these fields:

{
  "title": "",
  "description": "",
  "category": "Other",
  "event_date": "",
  "start_time": "",
  "end_time": "",
  "location": "",
  "latitude": null,
  "longitude": null,
  "capacity": 100
}

Rules:
- event_date must be YYYY-MM-DD
- start_time must be HH:MM in 24-hour format
- end_time must be HH:MM in 24-hour format
- missing date => ""
- missing time => reasonable defaults
- missing capacity => 100
- category must be one of:
  Technology,
  Business,
  Education,
  Entertainment,
  Sports,
  Health,
  Community,
  Other
- Do not invent important facts.

User description:
${prompt}
`,

      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = parseJson(response.text);

    return res.json(parsed);
  } catch (error) {
    console.error("[AI] parse:", error);

    if (isRateLimitError(error)) {
      return res.status(429).json({
        error:
          "AI service is temporarily rate limited. Please wait a moment and try again.",
        code: "AI_RATE_LIMITED",
      });
    }

    return next(error);
  }
}

// ============================================================
// MODERATE EVENT
// ============================================================

export async function moderateEvent(req, res, next) {
  try {
    const prompt = String(req.body?.prompt || "").trim();

    if (!prompt) {
      return res.status(400).json({
        error: "Event description is required.",
      });
    }

    const response = await getAI().models.generateContent({
      model: env.geminiModel,

      contents: `
You moderate events for:

- spam
- scams
- misleading claims
- malicious URLs
- impossible details
- obvious test data

Return ONLY valid JSON:

{
  "is_spam": false,
  "risk_score": 0.0,
  "reasons": []
}

Rules:
- risk_score must be between 0 and 1
- normal legitimate events should have low risk
- do not flag ordinary commercial events

Original prompt:
${prompt}

Extracted data:
${JSON.stringify(req.body?.extractedData || {})}
`,

      config: {
        responseMimeType: "application/json",
      },
    });

    let result;

    try {
      result = parseJson(response.text);
    } catch {
      result = {
        is_spam: false,
        risk_score: 0,
        reasons: [],
      };
    }

    result.is_spam = Boolean(result.is_spam);

    result.risk_score = Math.max(
      0,
      Math.min(1, Number(result.risk_score) || 0),
    );

    result.reasons = Array.isArray(result.reasons)
      ? result.reasons.map(String)
      : [];

    return res.json(result);
  } catch (error) {
    console.error("[AI] moderation:", error);

    // Moderation is optional.
    // If Gemini is rate limited, don't block
    // the event review process.
    if (isRateLimitError(error)) {
      return res.json({
        is_spam: false,
        risk_score: 0,
        reasons: [],
        moderation_unavailable: true,
      });
    }

    return next(error);
  }
}

// ============================================================
// RECOMMENDATIONS
// ============================================================

export async function recommendations(req, res, next) {
  try {
    const userId = req.user?.id;

    const latitude = Number.isFinite(Number(req.query.latitude))
      ? Number(req.query.latitude)
      : null;

    const longitude = Number.isFinite(Number(req.query.longitude))
      ? Number(req.query.longitude)
      : null;

    let categories = [];

    if (userId) {
      const { data: registrations, error } = await supabaseAdmin
        .from("registrations")
        .select("event_id")
        .eq("user_id", userId);

      if (error) throw error;

      const ids = (registrations || []).map((r) => r.event_id);

      if (ids.length) {
        const { data: attended, error: attendedError } = await supabaseAdmin
          .from("events")
          .select("category")
          .in("id", ids);

        if (attendedError) {
          throw attendedError;
        }

        const counts = new Map();

        for (const row of attended || []) {
          counts.set(row.category, (counts.get(row.category) || 0) + 1);
        }

        categories = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category]) => category);
      }
    }

    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("status", "published")
      .gte("event_date", new Date().toISOString());

    if (error) throw error;

    let events = data || [];

    if (categories.length) {
      const preferred = events.filter((event) =>
        categories.includes(event.category),
      );

      if (preferred.length) {
        events = preferred;
      }
    }

    if (latitude !== null && longitude !== null) {
      events = events
        .filter(
          (event) =>
            Number.isFinite(Number(event.latitude)) &&
            Number.isFinite(Number(event.longitude)),
        )
        .map((event) => ({
          ...event,
          distance_km: haversineKm(
            latitude,
            longitude,
            Number(event.latitude),
            Number(event.longitude),
          ),
        }))
        .sort(
          (a, b) =>
            a.distance_km - b.distance_km ||
            (b.registration_count || 0) - (a.registration_count || 0),
        );
    }

    events = await addRegistrationCounts(events);

    if (latitude !== null && longitude !== null) {
      events.sort(
        (a, b) =>
          a.distance_km - b.distance_km ||
          (b.registration_count || 0) - (a.registration_count || 0),
      );
    } else {
      events.sort(
        (a, b) =>
          (b.registration_count || 0) - (a.registration_count || 0) ||
          new Date(a.event_date) - new Date(b.event_date),
      );
    }

    return res.json({
      events: events.slice(0, 12),
    });
  } catch (error) {
    return next(error);
  }
}
