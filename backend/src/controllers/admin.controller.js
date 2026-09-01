import { supabaseAdmin } from "../config/supabase.js";
import { addRegistrationCounts } from "../services/event.service.js";

async function listEventsByStatus(status) {
  let query = supabaseAdmin.from("events").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return addRegistrationCounts(data || []);
}

export async function dashboard(req, res, next) {
  try {
    const [events, profiles, registrations, pending] = await Promise.all([
      supabaseAdmin.from("events").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("registrations").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("events").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    for (const result of [events, profiles, registrations, pending]) if (result.error) throw result.error;
    res.json({ stats: {
      total_events: events.count || 0,
      total_users: profiles.count || 0,
      total_registrations: registrations.count || 0,
      pending_events: pending.count || 0,
    }});
  } catch (error) { next(error); }
}

export async function listAdminEvents(req, res, next) {
  try { res.json({ events: await listEventsByStatus(req.query.status || null) }); }
  catch (error) { next(error); }
}

export async function listPendingEvents(req, res, next) {
  try { res.json({ events: await listEventsByStatus("pending") }); }
  catch (error) { next(error); }
}

export async function approveEvent(req, res, next) {
  try {
    const { data: event, error: findError } = await supabaseAdmin.from("events").select("*").eq("id", req.params.id).maybeSingle();
    if (findError) throw findError;
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (event.status !== "pending") return res.status(409).json({ error: `Only pending events can be approved. Current status: ${event.status}.` });

    const { data, error } = await supabaseAdmin.from("events").update({
      status: "published", approved_by: req.user.id, approved_at: new Date().toISOString(), rejection_reason: null,
    }).eq("id", event.id).select("*").single();
    if (error) throw error;

    const [updated] = await addRegistrationCounts([data]);
    res.json({ event: updated });
  } catch (error) { next(error); }
}

export async function rejectEvent(req, res, next) {
  try {
    const reason = String(req.body.reason || "").trim();
    if (!reason) return res.status(400).json({ error: "Rejection reason is required." });

    const { data: event, error: findError } = await supabaseAdmin.from("events").select("*").eq("id", req.params.id).maybeSingle();
    if (findError) throw findError;
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (event.status !== "pending") return res.status(409).json({ error: `Only pending events can be rejected. Current status: ${event.status}.` });

    const { data, error } = await supabaseAdmin.from("events").update({
      status: "rejected", approved_by: null, approved_at: null, rejection_reason: reason,
    }).eq("id", event.id).select("*").single();
    if (error) throw error;

    const [updated] = await addRegistrationCounts([data]);
    res.json({ event: updated });
  } catch (error) { next(error); }
}

export async function listUsers(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ users: data || [] });
  } catch (error) { next(error); }
}

export async function listRegistrations(req, res, next) {
  try {
    const { data: registrations, error } = await supabaseAdmin.from("registrations").select("*").order("created_at", { ascending: false });
    if (error) throw error;

    const userIds = [...new Set((registrations || []).map((r) => r.user_id))];
    const eventIds = [...new Set((registrations || []).map((r) => r.event_id))];

    const [{ data: profiles, error: pe }, { data: events, error: ee }] = await Promise.all([
      userIds.length ? supabaseAdmin.from("profiles").select("id,name,full_name,email,avatar_url").in("id", userIds) : { data: [], error: null },
      eventIds.length ? supabaseAdmin.from("events").select("id,title,event_date,status").in("id", eventIds) : { data: [], error: null },
    ]);
    if (pe) throw pe;
    if (ee) throw ee;

    const pm = new Map((profiles || []).map((p) => [p.id, p]));
    const em = new Map((events || []).map((e) => [e.id, e]));
    res.json({ registrations: (registrations || []).map((r) => ({ ...r, profile: pm.get(r.user_id) || null, event: em.get(r.event_id) || null })) });
  } catch (error) { next(error); }
}

export async function listEventRegistrations(req, res, next) {
  try {
    const { data: registrations, error } = await supabaseAdmin.from("registrations").select("*").eq("event_id", req.params.id).order("created_at", { ascending: false });
    if (error) throw error;

    const ids = [...new Set((registrations || []).map((r) => r.user_id))];
    const { data: profiles, error: pe } = ids.length
      ? await supabaseAdmin.from("profiles").select("id,name,full_name,email,avatar_url").in("id", ids)
      : { data: [], error: null };
    if (pe) throw pe;

    const pm = new Map((profiles || []).map((p) => [p.id, p]));
    res.json({ registrations: (registrations || []).map((r) => ({ ...r, profile: pm.get(r.user_id) || null })) });
  } catch (error) { next(error); }
}
