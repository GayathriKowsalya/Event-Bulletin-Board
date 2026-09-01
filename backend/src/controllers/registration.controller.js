import { supabaseAdmin } from "../config/supabase.js";
import { addRegistrationCounts } from "../services/event.service.js";

async function getPublishedEvent(id) {
  const { data, error } = await supabaseAdmin.from("events").select("*").eq("id", id).eq("status", "published").maybeSingle();
  if (error) throw error;
  return data;
}

export async function checkRegistration(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin.from("registrations").select("*").eq("event_id", req.params.id).eq("user_id", req.user.id).maybeSingle();
    if (error) throw error;
    res.json({ registered: Boolean(data), registration: data || undefined });
  } catch (error) { next(error); }
}

export async function registerForEvent(req, res, next) {
  try {
    const event = await getPublishedEvent(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });

    const { count, error: countError } = await supabaseAdmin.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", event.id);
    if (countError) throw countError;
    if ((count || 0) >= event.capacity) return res.status(409).json({ error: "This event is full." });

    const { data, error } = await supabaseAdmin.from("registrations").insert({ event_id: event.id, user_id: req.user.id }).select("*").single();
    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "You are already registered." });
      throw error;
    }
    res.status(201).json({ registration: data });
  } catch (error) { next(error); }
}

export async function rsvp(req, res, next) {
  try {
    const event = await getPublishedEvent(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });

    const { data: existing, error: existingError } = await supabaseAdmin.from("registrations").select("*").eq("event_id", event.id).eq("user_id", req.user.id).maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      const [withCount] = await addRegistrationCounts([event]);
      return res.json({ registration: existing, attending: true, rsvp_count: withCount.registration_count });
    }

    const { count, error: countError } = await supabaseAdmin.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", event.id);
    if (countError) throw countError;
    if ((count || 0) >= event.capacity) return res.status(409).json({ error: "This event is full." });

    const { data: registration, error } = await supabaseAdmin.from("registrations").insert({ event_id: event.id, user_id: req.user.id }).select("*").single();
    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "You are already attending." });
      throw error;
    }

    const [withCount] = await addRegistrationCounts([event]);
    res.status(201).json({ registration, attending: true, rsvp_count: withCount.registration_count });
  } catch (error) { next(error); }
}

export async function unregister(req, res, next) {
  try {
    const { error } = await supabaseAdmin.from("registrations").delete().eq("event_id", req.params.id).eq("user_id", req.user.id);
    if (error) throw error;

    const { data: event } = await supabaseAdmin.from("events").select("*").eq("id", req.params.id).maybeSingle();
    const [withCount] = event ? await addRegistrationCounts([event]) : [{ registration_count: 0 }];
    res.json({ attending: false, rsvp_count: withCount.registration_count || 0 });
  } catch (error) { next(error); }
}
