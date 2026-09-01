export function withRegistrationCount(events, counts) {
  return events.map((event) => ({
    ...event,
    registration_count: counts.get(event.id) || 0,
  }));
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortEvents(events, sortBy = "soonest") {
  const copy = [...events];
  if (sortBy === "latest") {
    return copy.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
  }
  if (sortBy === "popular") {
    return copy.sort((a, b) => (b.registration_count || 0) - (a.registration_count || 0));
  }
  return copy.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
}
