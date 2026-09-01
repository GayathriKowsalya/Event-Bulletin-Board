"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { CreateEventForm } from "./CreateEventForm";
import {
  API_URL,
  CreateEventInput,
  getAuthHeaders,
} from "@/lib/api";

interface CreateEventAIProps {
  onSuccess: (eventId: string) => void;
  onCancel: () => void;
}

interface ParsedEvent {
  title?: string;
  description?: string;
  category?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  capacity?: number;
}

interface ModerationResult {
  is_spam: boolean;
  risk_score: number;
  reasons: string[];
}

function parseEventFallback(prompt: string): ParsedEvent {
  const text = prompt.trim();
  const lower = text.toLowerCase();

  const categories = [
    "Technology", "Business", "Education", "Entertainment",
    "Sports", "Health", "Community", "Music", "Food",
    "Arts", "Yard Sale", "Other",
  ];

  const category =
    categories.find((item) => lower.includes(item.toLowerCase())) ||
    (/(marketing|business|sales|entrepreneur|startup|finance|seo|advertis)/i.test(text)
      ? "Business"
      : /(python|coding|software|developer|tech|ai|machine learning)/i.test(text)
        ? "Technology"
        : "Other");

  const capacityMatch = text.match(/(?:capacity|up to|for)\s*(?:of\s*)?(\d{1,6})\s*(?:people|persons|attendees|participants)?/i);
  const capacity = capacityMatch ? Number(capacityMatch[1]) : 100;

  const dateMatch = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  let eventDate = "";
  if (dateMatch) {
    eventDate = `${dateMatch[1]}-${String(dateMatch[2]).padStart(2, "0")}-${String(dateMatch[3]).padStart(2, "0")}`;
  } else {
    const monthNames = "january|february|march|april|may|june|july|august|september|october|november|december";
    const namedDate = text.match(new RegExp(`\\b(\\d{1,2})\\s+(${monthNames})\\s+(20\\d{2})\\b`, "i"));
    if (namedDate) {
      const month = new Date(`${namedDate[2]} 1, ${namedDate[3]}`).getMonth() + 1;
      eventDate = `${namedDate[3]}-${String(month).padStart(2, "0")}-${String(namedDate[1]).padStart(2, "0")}`;
    }
  }

  const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i);
  let startTime = "10:00";
  if (timeMatch) {
    let hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2] || 0);
    const meridiem = timeMatch[3].toUpperCase();
    if (meridiem === "PM" && hour < 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    startTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const endTime = (() => {
    if (!timeMatch) return "12:00";
    const [h, m] = startTime.split(":").map(Number);
    const endHour = Math.min(23, h + 2);
    return `${String(endHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  })();

  const locationMatch = text.match(/(?:at|in|venue|location)\s+([^,.]+(?:,\s*[^,.]+)?)/i);
  const location = locationMatch ? locationMatch[1].trim() : "";

  const title = text.split(/[.!?]/)[0].trim().slice(0, 120) || "New Event";

  return {
    title,
    description: text,
    category,
    event_date: eventDate,
    start_time: startTime,
    end_time: endTime,
    location,
    latitude: null,
    longitude: null,
    capacity,
  };
}

function toCreateEventInput(parsed: ParsedEvent): CreateEventInput {
  return {
    title: parsed.title || "",
    description: parsed.description || "",
    category: parsed.category || "Other",
    event_date: parsed.event_date ? `${parsed.event_date}T${parsed.start_time || "10:00"}` : "",
    event_end_date: parsed.event_date ? `${parsed.event_date}T${parsed.end_time || "12:00"}` : "",
    location: parsed.location || "",
    latitude: typeof parsed.latitude === "number" ? parsed.latitude : null,
    longitude: typeof parsed.longitude === "number" ? parsed.longitude : null,
    capacity: typeof parsed.capacity === "number" ? parsed.capacity : 100,
    image_url: null,
  };
}

export function CreateEventAI({
  onSuccess,
  onCancel,
}: CreateEventAIProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"prompt" | "review">("prompt");

  const [extractedData, setExtractedData] =
    useState<CreateEventInput | null>(null);

  const [spamWarning, setSpamWarning] =
    useState<ModerationResult | null>(null);

  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe your event first.");
      return;
    }

    setLoading(true);
    setError("");
    setSpamWarning(null);

    try {
      // Get Supabase authentication token
      const headers = await getAuthHeaders();

      // =====================================================
      // 1. PARSE EVENT
      // =====================================================

      console.log("[AI] Parsing event...");

      const parseRes = await fetch(
        `${API_URL}/api/ai/events/parse`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            prompt: prompt.trim(),
          }),
        }
      );

      const parseData = await parseRes
        .json()
        .catch(() => ({}));

      if (!parseRes.ok) {
        console.error(
          "[AI] Parse error:",
          parseRes.status,
          parseData
        );

        if (parseRes.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        if (parseRes.status === 429) {
          console.warn("[AI] Parse rate limited; using local fallback parser.");
          const fallback = parseEventFallback(prompt.trim());
          setExtractedData(toCreateEventInput(fallback));
          setStep("review");
          return;
        }

        throw new Error(
          parseData.error ||
            parseData.message ||
            "Failed to parse event. Please try again."
        );
      }

      const parsed: ParsedEvent =
        parseData.event ||
        parseData.data ||
        parseData;

      console.log(
        "[AI] Event parsed successfully:",
        parsed
      );

      // =====================================================
      // FORMAT EVENT DATA
      // =====================================================

      const formattedData = toCreateEventInput(parsed);

      setExtractedData(formattedData);

      // =====================================================
      // 2. MODERATION
      // =====================================================

      console.log("[AI] Moderating event...");

      const moderationRes = await fetch(
        `${API_URL}/api/ai/events/moderate`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            prompt: prompt.trim(),
            extractedData: parsed,
          }),
        }
      );

      const moderationData = await moderationRes
        .json()
        .catch(() => ({}));

      if (moderationRes.ok) {
        const moderation: ModerationResult =
          moderationData.moderation ||
          moderationData.data ||
          moderationData;

        console.log(
          "[AI] Moderation result:",
          moderation
        );

        if (
          typeof moderation.risk_score === "number" &&
          moderation.risk_score > 0.4
        ) {
          setSpamWarning(moderation);
        }
      } else {
        // Moderation should not block event creation
        // if the AI service is temporarily unavailable.
        console.warn(
          "[AI] Moderation unavailable:",
          moderationRes.status
        );
      }

      // =====================================================
      // SHOW REVIEW FORM
      // =====================================================

      setStep("review");
    } catch (err) {
      console.error("[AI] Error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REVIEW STEP
  // =========================================================

  if (step === "review" && extractedData) {
    return (
      <div className="space-y-4">
        <div className="bg-green-900/20 text-green-400 p-3 rounded border border-green-900/50 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />

          <span>
            Here's what AI understood. Please review
            and edit before publishing.
          </span>
        </div>

        {spamWarning && (
          <div className="bg-orange-900/20 text-orange-400 p-3 rounded border border-orange-900/50 text-sm">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle className="w-4 h-4" />

              <span>
                This event may contain suspicious
                information.
              </span>
            </div>

            {spamWarning.reasons?.length > 0 && (
              <ul className="list-disc list-inside">
                {spamWarning.reasons.map(
                  (reason, index) => (
                    <li key={index}>{reason}</li>
                  )
                )}
              </ul>
            )}

            <p className="mt-2 text-xs">
              You can edit the details below to fix
              any issues.
            </p>
          </div>
        )}

        <CreateEventForm
          onSuccess={onSuccess}
          onCancel={onCancel}
          initialData={extractedData}
        />
      </div>
    );
  }

  // =========================================================
  // PROMPT STEP
  // =========================================================

  return (
    <div className="space-y-4 text-white">
      {error && (
        <div className="p-3 bg-red-900/20 text-red-500 text-sm rounded-md border border-red-900">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-gray-400">
          Describe your event naturally, and AI will
          fill out the form for you.
        </p>

        <Textarea
          placeholder="I am organizing a Python workshop at PSG College in Coimbatore on September 12 at 10 AM. It is for beginners and can host up to 100 people."
          className="bg-[#18181b] border-[#27272a] text-white min-h-[150px]"
          value={prompt}
          onChange={(e) =>
            setPrompt(e.target.value)
          }
          disabled={loading}
        />
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white"
          disabled={loading}
          onClick={() => {
            setError("");
            setSpamWarning(null);

            setExtractedData({
              title: "",
              description: "",
              category: "",
              event_date: "",
              event_end_date: "",
              location: "",
              capacity: 100,
              latitude: null,
              longitude: null,
              image_url: null,
            });

            setStep("review");
          }}
        >
          Skip AI
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="bg-transparent border-[#27272a] text-white hover:bg-[#27272a]"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Event
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}