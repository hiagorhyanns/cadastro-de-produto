import { handleGenerateSimpleSEO } from "../../server";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-gemini-api-key");
    return res.status(200).end();
  }
  return handleGenerateSimpleSEO(req, res);
}
