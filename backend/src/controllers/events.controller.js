import { supabaseAdmin } from "../config/supabase.js";
import {
  addRegistrationCounts,
  getPublishedEvents,
} from "../services/event.service.js";
import { haversineKm } from "../utils/events.js";

const CATEGORIES = new Set([
  // Current application categories
  "Technology",
  "Business",
  "Education",
  "Entertainment",
  "Sports",
  "Health",
  "Community",
  "Other",

  // Legacy/seed categories
  "Music",
  "Food",
  "Arts",
  "Yard Sale",
]);

function validateEventInput(body) {
  const required = [
    "title",
    "description",
    "category",
    "event_date",
    "event_end_date",
    "location",
    "capacity",
  ];

  for (const key of required) {
    if (
      body[key] === undefined ||
      body[key] === null ||
      String(body[key]).trim() === ""
    ) {
      return `${key} is required.`;
    }
  }

  if (!CATEGORIES.has(String(body.category).trim())) {
    return "Invalid category.";
  }

  const capacity = Number(body.capacity);

  if (!Number.isInteger(capacity) || capacity <= 0) {
    return "capacity must be a positive integer.";
  }

  const start = new Date(body.event_date);
  const end = new Date(body.event_end_date);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Invalid event date.";
  }

  if (end <= start) {
    return "event_end_date must be after event_date.";
  }

  if (start < new Date()) {
    return "Event start date cannot be in the past.";
  }

  return null;
}

function numericOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n) ? n : null;
}

/* ============================================================
   LIST EVENTS
   ============================================================ */

export async function listEvents(req, res, next) {
  try {
    const events = await getPublishedEvents({
      category: req.query.category,
      sortBy: req.query.sortBy,
      filter: req.query.filter,
    });

    res.json({ events });
  } catch (error) {
    next(error);
  }
}

/* ============================================================
   SEARCH EVENTS
   ============================================================ */

export async function searchEvents(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.json({ events: [] });
    }

    const events = await getPublishedEvents({
      query: q,
      sortBy: req.query.sortBy,
    });

    res.json({ events });
  } catch (error) {
    next(error);
  }
}

/* ============================================================
   NEARBY EVENTS
   ============================================================ */

export async function nearbyEvents(req, res, next) {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    const radius = Math.min(Number(req.query.radius || 50), 200);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(radius) ||
      radius <= 0
    ) {
      return res.status(400).json({
        error: "Invalid location or radius.",
      });
    }

    /*
      IMPORTANT:
      Only return published AND currently active events.

      event_end_date >= now
      means ended events disappear immediately.
    */

    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("status", "published")
      .gte("event_end_date", now);

    if (error) {
      throw error;
    }

    const nearby = (data || [])
      .filter((event) => {
        const eventLat = Number(event.latitude);
        const eventLng = Number(event.longitude);

        return Number.isFinite(eventLat) && Number.isFinite(eventLng);
      })
      .map((event) => {
        const distance = haversineKm(
          latitude,
          longitude,
          Number(event.latitude),
          Number(event.longitude),
        );

        return {
          ...event,
          distance_km: distance,
        };
      })
      .filter((event) => event.distance_km <= radius)
      .sort((a, b) => a.distance_km - b.distance_km);

    res.json({
      events: await addRegistrationCounts(nearby),
    });
  } catch (error) {
    next(error);
  }
}

/* ============================================================
   GET SINGLE EVENT
   ============================================================ */

export async function getEvent(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        error: "Event not found.",
      });
    }

    const isOwner = req.user?.id === data.created_by;

    const isAdmin = req.profile?.role === "admin";

    /*
      Non-published events can only be viewed
      by their owner or admin.
    */

    if (data.status !== "published" && !isOwner && !isAdmin) {
      return res.status(404).json({
        error: "Event not found.",
      });
    }

    const [event] = await addRegistrationCounts([data]);

    res.json({ event });
  } catch (error) {
    next(error);
  }
}

/* ============================================================
   CREATE EVENT
   ============================================================ */

export async function createEvent(req, res, next) {
  try {
    const validationError = validateEventInput(req.body);

    if (validationError) {
      return res.status(400).json({
        error: validationError,
      });
    }

    /*
      ADMIN:
      Event is published immediately.

      NORMAL USER:
      Event goes to pending and requires
      admin approval.
    */

    const isAdmin = req.profile?.role === "admin";

    const eventStatus = isAdmin ? "published" : "pending";

    const payload = {
      title: String(req.body.title).trim(),

      description: String(req.body.description).trim(),

      category: String(req.body.category).trim(),

      event_date: new Date(req.body.event_date).toISOString(),

      event_end_date: new Date(req.body.event_end_date).toISOString(),

      location: String(req.body.location).trim(),

      latitude: numericOrNull(req.body.latitude),

      longitude: numericOrNull(req.body.longitude),

      capacity: Number(req.body.capacity),

      image_url: req.body.image_url || null,

      status: eventStatus,

      created_by: req.user.id,
    };

    const { data, error } = await supabaseAdmin
      .from("events")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      event: {
        ...data,
        registration_count: 0,
      },

      message: isAdmin
        ? "Event published successfully."
        : "Event submitted and is waiting for admin approval.",
    });
  } catch (error) {
    next(error);
  }
}

/* ============================================================
   MY EVENTS
   ============================================================ */

export async function getMyEvents(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("created_by", req.user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    res.json({
      events: await addRegistrationCounts(data || []),
    });
  } catch (error) {
    next(error);
  }
}

/* ============================================================
   UPDATE EVENT
   ============================================================ */

export async function updateEvent(req, res, next) {
  try {
    const { data: existing, error: findError } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!existing) {
      return res.status(404).json({
        error: "Event not found.",
      });
    }

    const isAdmin = req.profile?.role === "admin";

    /*
      Only the event owner or admin
      can edit the event.
    */

    if (existing.created_by !== req.user.id && !isAdmin) {
      return res.status(403).json({
        error: "You cannot edit this event.",
      });
    }

    const nextData = {};

    const allowed = [
      "title",
      "description",
      "category",
      "event_date",
      "event_end_date",
      "location",
      "latitude",
      "longitude",
      "capacity",
      "image_url",
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        nextData[key] = req.body[key];
      }
    }

    if (nextData.title !== undefined) {
      nextData.title = String(nextData.title).trim();
    }

    if (nextData.description !== undefined) {
      nextData.description = String(nextData.description).trim();
    }

    if (nextData.location !== undefined) {
      nextData.location = String(nextData.location).trim();
    }

    if (
      nextData.category !== undefined &&
      !CATEGORIES.has(String(nextData.category).trim())
    ) {
      return res.status(400).json({
        error: "Invalid category.",
      });
    }

    if (nextData.capacity !== undefined) {
      nextData.capacity = Number(nextData.capacity);

      if (!Number.isInteger(nextData.capacity) || nextData.capacity <= 0) {
        return res.status(400).json({
          error: "Invalid capacity.",
        });
      }
    }

    if (nextData.latitude !== undefined) {
      nextData.latitude = numericOrNull(nextData.latitude);
    }

    if (nextData.longitude !== undefined) {
      nextData.longitude = numericOrNull(nextData.longitude);
    }

    if (nextData.event_date) {
      const parsedStart = new Date(nextData.event_date);

      if (Number.isNaN(parsedStart.getTime())) {
        return res.status(400).json({
          error: "Invalid event date.",
        });
      }

      nextData.event_date = parsedStart.toISOString();
    }

    if (nextData.event_end_date) {
      const parsedEnd = new Date(nextData.event_end_date);

      if (Number.isNaN(parsedEnd.getTime())) {
        return res.status(400).json({
          error: "Invalid event end date.",
        });
      }

      nextData.event_end_date = parsedEnd.toISOString();
    }

    const start = new Date(nextData.event_date || existing.event_date);

    const end = new Date(nextData.event_end_date || existing.event_end_date);

    if (end <= start) {
      return res.status(400).json({
        error: "Event end date must be after event date.",
      });
    }

    /*
      Only prevent past events when
      a NORMAL USER edits.

      Admin can edit existing events.
    */

    if (start < new Date() && !isAdmin) {
      return res.status(400).json({
        error: "Event start date cannot be in the past.",
      });
    }

    /*
      ADMIN EDIT:
      Remains published.

      NORMAL USER EDIT:
      Goes back to pending approval.
    */

    if (!isAdmin) {
      nextData.status = "pending";

      nextData.approved_by = null;

      nextData.approved_at = null;

      nextData.rejection_reason = null;
    } else {
      // Admin edits remain published
      nextData.status = "published";
    }

    const { data, error } = await supabaseAdmin
      .from("events")
      .update(nextData)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    const [event] = await addRegistrationCounts([data]);

    res.json({ event });
  } catch (error) {
    next(error);
  }
}

/* ============================================================
   DELETE EVENT
   ============================================================ */

export async function deleteEvent(req, res, next) {
  try {
    const { data: existing, error: findError } = await supabaseAdmin
      .from("events")
      .select("id, created_by")
      .eq("id", req.params.id)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!existing) {
      return res.status(404).json({
        error: "Event not found.",
      });
    }

    if (existing.created_by !== req.user.id && req.profile?.role !== "admin") {
      return res.status(403).json({
        error: "You cannot delete this event.",
      });
    }

    const { error } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", existing.id);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
