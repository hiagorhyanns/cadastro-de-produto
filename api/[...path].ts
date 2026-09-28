import app from "../server";

export default function handler(req: any, res: any) {
  // Reconstruct path for Vercel Serverless environment
  if (req.query && req.query.path) {
    const segments = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    req.url = `/api/${segments}`;
  } else if (req.headers && req.headers["x-matched-path"]) {
    req.url = String(req.headers["x-matched-path"]);
  }
  return app(req, res);
}

