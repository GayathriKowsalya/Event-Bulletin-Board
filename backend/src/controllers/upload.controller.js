import crypto from "node:crypto";
import { supabaseAdmin } from "../config/supabase.js";
import { env } from "../config/env.js";

const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded. Use form field 'file'." });

    const extension = ext[req.file.mimetype];
    if (!extension) return res.status(400).json({ error: "Unsupported image type." });

    const path = `event-banners/${req.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabaseAdmin.storage.from(env.storageBucket).upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabaseAdmin.storage.from(env.storageBucket).getPublicUrl(path);
    res.status(201).json({ url: data.publicUrl, path });
  } catch (error) { next(error); }
}
