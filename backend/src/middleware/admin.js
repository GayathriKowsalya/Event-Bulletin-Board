export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Authentication required." });
  if (req.profile?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}
