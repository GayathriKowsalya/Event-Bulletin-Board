export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, _req, res, _next) {
  console.error("[API ERROR]", err);

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File size exceeds the upload limit." });
  }

  const status = Number(err?.statusCode || err?.status || 500);
  res.status(status).json({ error: err?.message || "Internal server error." });
}
