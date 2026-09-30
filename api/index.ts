import app from "../server";

export default function handler(req: any, res: any) {
  // Reconstruct path for Vercel Serverless environment if rewritten
  if (req.query && req.query.path) {
    const segments = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    req.url = `/api/${segments}`;
  } else {
    const xForwarded = req.headers && (req.headers["x-forwarded-uri"] || req.headers["x-invoke-path"]);
    if (xForwarded && typeof xForwarded === "string" && xForwarded.startsWith("/api/")) {
      req.url = xForwarded;
    } else if (!req.url.startsWith("/api/") && req.url !== "/" && req.url !== "") {
      req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }
  }
  return app(req, res);
}

