import { supabaseAdmin } from "../config/supabase.js";
import { sortEvents, withRegistrationCount } from "../utils/events.js";

export async function addRegistrationCounts(events) {
  if (!events.length) return [];

  const ids = events.map((event) => event.id);

  const { data, error } = await supabaseAdmin
    .from("registrations")
    .select("event_id")
    .in("event_id", ids);

  if (error) throw error;

  const counts = new Map();

  for (const row of data || []) {
    counts.set(row.event_id, (counts.get(row.event_id) || 0) + 1);
  }

  return withRegistrationCount(events, counts);
}

export async function getPublishedEvents({
  category,
  sortBy,
  filter,
  query,
} = {}) {
  let request = supabaseAdmin
    .from("events")
    .select("*")
    .eq("status", "published");

  if (category && category !== "All") {
    request = request.eq("category", category);
  }

  if (query) {
    const safe = String(query).replace(/[%_]/g, (c) => `\\${c}`);

    request = request.or(
      `title.ilike.%${safe}%,description.ilike.%${safe}%,location.ilike.%${safe}%,category.ilike.%${safe}%`,
    );
  }

  // Hide events only after their END time.
  // Upcoming and currently ongoing events remain visible.
  const now = new Date().toISOString();

  request = request.gte("event_end_date", now);

  // Events happening within the next 7 days.
  if (filter === "happeningSoon") {
    const until = new Date(Date.now() + 7 * 86400000).toISOString();

    request = request.gte("event_date", now).lte("event_date", until);
  }

  const { data, error } = await request;

  if (error) throw error;

  const withCounts = await addRegistrationCounts(data || []);

  return sortEvents(withCounts, sortBy);
}
