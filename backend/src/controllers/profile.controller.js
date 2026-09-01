import { supabaseAdmin } from "../config/supabase.js";
import { addRegistrationCounts } from "../services/event.service.js";

function mapProfile(profile) {
  if (!profile) return null;
  return {
    ...profile,
    name: profile.name || profile.full_name || null,
    full_name: profile.full_name || profile.name || null,
    avatar: profile.avatar_url || null,
    avatar_url: profile.avatar_url || null,
    location: profile.location || null,
  };
}

async function ensureProfile(user) {
  const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: created, error: createError } = await supabaseAdmin
    .from("profiles")
    .insert({ id: user.id, email: user.email || null, name: user.user_metadata?.name || null, full_name: user.user_metadata?.full_name || user.user_metadata?.name || null })
    .select("*")
    .single();

  if (createError) throw createError;
  return created;
}

export async function getProfile(req, res, next) {
  try {
    const profile = await ensureProfile(req.user);
    res.json({ profile: mapProfile(profile) });
  } catch (error) { next(error); }
}

export async function updateProfile(req, res, next) {
  try {
    const updates = {};
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      updates.name = name;
      updates.full_name = name;
    }
    if (req.body.location !== undefined) updates.location = String(req.body.location).trim();
    if (req.body.avatar !== undefined) updates.avatar_url = req.body.avatar || null;
    if (req.body.avatar_url !== undefined) updates.avatar_url = req.body.avatar_url || null;

    if (!Object.keys(updates).length) return res.status(400).json({ error: "No profile fields to update." });

    const { data, error } = await supabaseAdmin.from("profiles").update(updates).eq("id", req.user.id).select("*").single();
    if (error) throw error;
    res.json({ profile: mapProfile(data) });
  } catch (error) { next(error); }
}

export async function getProfileEvents(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin.from("events").select("*").eq("created_by", req.user.id).order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ events: await addRegistrationCounts(data || []) });
  } catch (error) { next(error); }
}

export async function getProfileRsvps(req, res, next) {
  try {
    const { data: registrations, error } = await supabaseAdmin.from("registrations").select("event_id").eq("user_id", req.user.id);
    if (error) throw error;

    const ids = (registrations || []).map((r) => r.event_id);
    if (!ids.length) return res.json({ events: [] });

    const { data: events, error: eventError } = await supabaseAdmin.from("events").select("*").in("id", ids).order("event_date", { ascending: true });
    if (eventError) throw eventError;

    res.json({ events: await addRegistrationCounts(events || []) });
  } catch (error) { next(error); }
}
