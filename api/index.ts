import app from "../server";

export default function handler(req: any, res: any) {
  // Reconstruct path for Vercel Serverless environment if rewritten
  if (req.url === "/" || req.url === "/api" || req.url === "" || req.url?.startsWith("/?")) {
    const xMatched = req.headers && (req.headers["x-matched-path"] || req.headers["x-forwarded-url"]);
    if (xMatched && typeof xMatched === "string" && xMatched.startsWith("/api/")) {
      req.url = xMatched;
    } else if (req.query && req.query.path) {
      const segments = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
      req.url = `/api/${segments}`;
    }
  }
  return app(req, res);
}

