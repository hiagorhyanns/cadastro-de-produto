import app from "../server";

export default function handler(req: any, res: any) {
  // Reconstruct path for Vercel Serverless environment
  if (req.query && req.query.path) {
    const segments = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    req.url = `/api/${segments}`;
  } else if (!req.url.startsWith("/api/")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return app(req, res);
}

