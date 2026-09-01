import { supabaseAuth, supabaseAdmin } from "../config/supabase.js";

export async function adminLogin(req, res, next) {
  try {
    const email = String(req.body.email || req.body.username || "").trim();
    const password = String(req.body.password || "");
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error || !data?.session || !data?.user) return res.status(401).json({ error: "Invalid admin credentials." });

    const { data: profile, error: pe } = await supabaseAdmin.from("profiles").select("id,role,name,full_name,email").eq("id", data.user.id).maybeSingle();
    if (pe) throw pe;
    if (profile?.role !== "admin") return res.status(403).json({ error: "This account is not an admin." });

    res.json({
      success: true,
      message: "Admin login successful.",
      user: { id: data.user.id, email: data.user.email, role: "admin" },
      token: data.session.access_token,
    });
  } catch (error) { next(error); }
}
