import { supabaseAdmin } from "../config/supabase.js";

function bearerToken(req) {
  const value = req.headers.authorization || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : null;
}

export function optionalAuth(req, _res, next) {
  const token = bearerToken(req);
  if (!token) return next();

  supabaseAdmin.auth.getUser(token)
    .then(async ({ data, error }) => {
      if (!error && data?.user) {
        req.user = data.user;
        req.accessToken = token;
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, email, name, full_name, location, avatar_url, role")
          .eq("id", data.user.id)
          .maybeSingle();
        req.profile = profile || null;
      }
      next();
    })
    .catch(() => next());
}

export async function requireAuth(req, res, next) {
  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: "Authentication required." });

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired access token." });
    }

    req.user = data.user;
    req.accessToken = token;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, name, full_name, location, avatar_url, role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    req.profile = profile || null;
    next();
  } catch (error) {
    next(error);
  }
}
