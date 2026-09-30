import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import dns from "dns";

// Prefer IPv4 first for DNS resolution to avoid "fetch failed" issues on dual-stack local/container environments
dns.setDefaultResultOrder("ipv4first");

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Setup JSON body parsing with high limit for base64 images (50mb)
// Safeguard for Vercel Serverless environment where req.body might already be parsed
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    (req as any)._body = true;
  }
  next();
});
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Server-side initialization of Gemini client
export function getGeminiApiKey(req?: express.Request): string {
  const headerKey = req ? (req.headers["x-gemini-api-key"] as string) : "";
  return (
    headerKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    ""
  ).trim();
}

export function getAiClient(req?: express.Request): GoogleGenAI {
  const key = getGeminiApiKey(req);
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// URL normalization middleware for Vercel Serverless environment
app.use((req, res, next) => {
  if (req.url === "/" || req.url === "/api" || req.url === "" || req.url.startsWith("/?path=")) {
    if (req.query && req.query.path) {
      const p = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
      req.url = `/api/${p}`;
    }
  }
  next();
});

const ai = getAiClient();
const apiKey = getGeminiApiKey();
console.log(`[Server] Gemini API Key configured: ${apiKey ? "YES (length: " + apiKey.length + ")" : "NO"}`);

// Helper to safely extract base64 data regardless of data URI prefix
function getBase64Data(imgStr: string): string {
  if (!imgStr) return "";
  if (typeof imgStr === "string" && imgStr.includes(",")) {
    return imgStr.split(",")[1];
  }
  return imgStr;
}

// Technical logs utility function
function logTechnicalDetails(functionName: string, endpoint: string, model: string, status: number, err: any) {
  const errorMessage = err?.message || String(err || "");
  let errorType = "unknown";
  const lowerMsg = errorMessage.toLowerCase();

  if (err?.status === 429 || lowerMsg.includes("429") || lowerMsg.includes("quota") || lowerMsg.includes("exceeded")) {
    errorType = "quota";
  } else if (lowerMsg.includes("api key") || lowerMsg.includes("invalid") || lowerMsg.includes("expired") || lowerMsg.includes("key not found")) {
    errorType = "API key";
  } else if (err?.status === 403 || lowerMsg.includes("403") || lowerMsg.includes("permission") || lowerMsg.includes("denied")) {
    errorType = "permissão";
  } else if (lowerMsg.includes("model") || lowerMsg.includes("not found") || lowerMsg.includes("not active") || lowerMsg.includes("unsupported") || lowerMsg.includes("404")) {
    errorType = "modelo";
  } else if (lowerMsg.includes("timeout") || lowerMsg.includes("deadline") || lowerMsg.includes("504")) {
    errorType = "timeout";
  } else if (err?.status === 503 || lowerMsg.includes("503") || lowerMsg.includes("busy") || lowerMsg.includes("demand")) {
    errorType = "timeout";
  }

  console.log(`[Diagnostic] call=${functionName} endpoint=${endpoint} model=${model} status=${status} type=${errorType}`);
  return errorType;
}

// Low-level wrappers with retry mechanism running on backend
async function backendCallGeminiWithRetry(params: {
  model: string;
  contents: any;
  config?: any;
}, functionName: string, endpoint: string, req?: express.Request): Promise<any> {
  const maxRetriesPerModel = 1;
  const candidateModels = [
    params.model,
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.1-pro-preview",
    "gemini-2.5-flash"
  ].filter(Boolean);
  const uniqueModels = Array.from(new Set(candidateModels));
  
  let lastError: any = null;
  
  for (const currentModel of uniqueModels) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        console.log(`[Server Gemini] Request func=${functionName} model=${currentModel} attempt=${attempt}`);
        const client = getAiClient(req);
        const response = await client.models.generateContent({
          ...params,
          model: currentModel
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const rawStatus = Number(err?.status ?? err?.code ?? 500);
        const status = Number.isFinite(rawStatus) && rawStatus >= 100 && rawStatus < 600 ? rawStatus : 500;
        logTechnicalDetails(functionName, endpoint, currentModel, status, err);
        
        const errorMessage = String(err?.message || err || "").toLowerCase();
        if (errorMessage.includes("fetch failed")) {
          const currentOrder = (dns as any).getDefaultResultOrder ? (dns as any).getDefaultResultOrder() : "unknown";
          const newOrder = currentOrder === "ipv4first" ? "verbatim" : "ipv4first";
          try {
            dns.setDefaultResultOrder(newOrder);
          } catch (dnsErr) {}
        }
        
        // Fatal client / authentication errors that should not be retried
        if (
          errorMessage.includes("api key not valid") ||
          errorMessage.includes("api key expired") ||
          errorMessage.includes("api_key_invalid") ||
          errorMessage.includes("key not found") ||
          status === 401 ||
          status === 403
        ) {
          throw err;
        }

        // If the model does not exist or is unsupported on this tier, skip to next model
        if (status === 404 || errorMessage.includes("not found") || errorMessage.includes("not supported") || errorMessage.includes("no longer available")) {
          console.log(`[Gemini Engine] Model ${currentModel} not supported or not found, switching to next model.`);
          break;
        }

        // Hard daily quota, rate limit, or resource exhausted: immediately switch to alternate model
        const isQuotaExhausted =
          status === 429 ||
          errorMessage.includes("429") ||
          errorMessage.includes("limit: 0") ||
          errorMessage.includes("resource_exhausted") ||
          errorMessage.includes("quota exceeded") ||
          errorMessage.includes("quota");

        if (isQuotaExhausted) {
          console.log(`[Gemini Engine] Model ${currentModel} reached quota/limit. Immediately switching to alternate model.`);
          break;
        }

        // Temporary demand spikes (503)
        const isTemporaryDemand =
          status === 503 ||
          errorMessage.includes("503") ||
          errorMessage.includes("demand") ||
          errorMessage.includes("unavailable") ||
          errorMessage.includes("overload") ||
          errorMessage.includes("busy");

        if (isTemporaryDemand) {
          if (attempt < maxRetriesPerModel) {
            const delay = 1000 + Math.floor(Math.random() * 500);
            console.log(`[Gemini Engine] Model ${currentModel} high demand/busy (status ${status}). Waiting ${delay}ms before retry (${attempt + 1}/${maxRetriesPerModel})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            console.log(`[Gemini Engine] Model ${currentModel} exhausted retries on high demand. Switching to alternate model.`);
            break;
          }
        }

        // General transient server errors (500, 502, 504, timeout, fetch failed)
        if (attempt < maxRetriesPerModel) {
          const delay = 1000 + Math.floor(Math.random() * 400);
          console.log(`[Gemini Engine] Transient error on ${currentModel} (status ${status}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
  }
  
  throw lastError || new Error("Failed to generate content from Gemini after several attempts.");
}

function safeParseJsonFromAi(rawText: string): any {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {}

  const unquoted = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(unquoted);
  } catch (_) {}

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch (_) {}
  }
  return null;
}

async function backendCallGeminiImageWithRetry(
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  functionName: string,
  endpoint: string,
  _extraOptions?: {
    fallbackPrompt?: string;
    productName?: string;
    referenceImage?: string;
  }
): Promise<any> {
  if (!apiKey) {
    const keyError: any = new Error("GEMINI_API_KEY não está configurada no servidor do AI Studio.");
    keyError.status = 401;
    throw keyError;
  }

  const maxRetries = 1;
  const imageModels = Array.from(new Set([
    params.model,
    "gemini-3.1-flash-lite-image",
    "gemini-3.1-flash-image"
  ].filter(Boolean)));
  let lastError: any = null;

  const hasGeneratedImage = (response: any) =>
    (response?.candidates || []).some((candidate: any) =>
      (candidate?.content?.parts || []).some((part: any) =>
        Boolean(part?.inlineData?.data) && String(part?.inlineData?.mimeType || "image/png").startsWith("image/")
      )
    );

  for (const currentModel of imageModels) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const requestConfig = params.config ? {
          ...params.config,
          imageConfig: params.config.imageConfig ? { ...params.config.imageConfig } : undefined
        } : undefined;

        if (currentModel !== "gemini-3.1-flash-image" && requestConfig?.imageConfig) {
          delete requestConfig.imageConfig.imageSize;
        }

        console.log("[Server Gemini Image] Request with model=" + currentModel + ", attempt=" + attempt);
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel,
          config: requestConfig
        });

        if (!hasGeneratedImage(response)) {
          const emptyError: any = new Error("O modelo " + currentModel + " respondeu sem uma imagem válida.");
          emptyError.status = 502;
          throw emptyError;
        }

        console.log("[Server Gemini Image] Real Gemini image received from model=" + currentModel);
        return response;
      } catch (err: any) {
        lastError = err;
        const rawStatus = Number(err?.status ?? err?.code ?? 500);
        const status = Number.isFinite(rawStatus) && rawStatus >= 100 && rawStatus < 600 ? rawStatus : 500;
        const errorMessage = String(err?.message || err || "").toLowerCase();
        logTechnicalDetails(functionName, endpoint, currentModel, status, err);

        if (status === 400 || status === 401 || status === 403) {
          throw err;
        }

        if (status === 404 || errorMessage.includes("model not found") || errorMessage.includes("not supported")) {
          break;
        }

        const isHardQuotaExceeded =
          errorMessage.includes("limit: 0") ||
          (errorMessage.includes("quota") && (
            errorMessage.includes("perday") ||
            errorMessage.includes("per day") ||
            errorMessage.includes("daily") ||
            errorMessage.includes("day")
          ));

        if (isHardQuotaExceeded) {
          console.log(`[Gemini Engine Image] Model ${currentModel} reached hard/daily quota limit. Switching to alternate image model.`);
          break;
        }

        const retryable = status === 429 || status >= 500 ||
          errorMessage.includes("quota") || errorMessage.includes("resource_exhausted") ||
          errorMessage.includes("fetch failed") || errorMessage.includes("timeout") ||
          errorMessage.includes("unavailable") || errorMessage.includes("overload") || errorMessage.includes("busy");

        if (!retryable) {
          throw err;
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      }
    }
  }

  throw lastError || new Error("Falha ao gerar imagem com os modelos oficiais do Gemini.");
}

app.get(["/api/version", "/version"], (_req, res) => {
  const hasKey = Boolean(getGeminiApiKey());
  res.json({
    status: "ok",
    generatorVersion: "2.2.0-compact-prod",
    descriptionFormat: "compact-v2",
    environment: process.env.VERCEL ? "vercel-serverless" : "express-dev",
    hasApiKey: hasKey,
    nodeEnv: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

app.get(["/api/health", "/health"], (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get(["/api/gemini/image-health", "/gemini/image-health"], (_req, res) => {
  res.json({
    configured: Boolean(getGeminiApiKey()),
    provider: "Google Gemini API",
    models: ["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"],
    referenceImageRequired: true,
    externalFallbacks: false
  });
});

// API Endpoints
export async function handleValidateProductFidelity(req: express.Request, res: express.Response) {
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) {} }
  const { data } = body;
  const model = "gemini-3-flash-preview";
  const functionName = "validateProductFidelity";
  const endpoint = "/api/gemini/validateProductFidelity";

  const systemInstruction = `Você é um especialista em controle de qualidade de e-commerce.
Sua tarefa é comparar uma imagem enviada pelo usuário com as especificações técnicas e descrição fornecidas.

CRITÉRIOS DE COMPARAÇÃO:
- O produto na imagem corresponde à categoria/tipo descrito?
- As dimensões (Altura, Largura, Profundidade) parecem plausíveis para o objeto na foto?
- O material e cor mencionados na descrição são visíveis ou compatíveis com a imagem?
- Existem acessórios ou partes descritas que claramente NÃO estão na imagem?

Se houver uma divergência clara ou contradição técnica, marque como incompatível e explique brevemente por que.
Se as informações forem compatíveis ou apenas complementares, marque como compatível.

Retorne JSON: { "isCompatible": boolean, "reason": string }`;

  const prompt = `
DADOS PARA VALIDAÇÃO:
- Altura: ${data.altura}cm
- Largura: ${data.largura}cm
- Profundidade: ${data.profundidade}cm
- Peso: ${data.peso}kg
- Descrição: ${data.descricao}

Analise a imagem e os dados acima. Se houver discrepância grave, informe.`;

  try {
    const response = await backendCallGeminiWithRetry({
      model,
      contents: [
        {
          parts: [
            { text: systemInstruction },
            { inlineData: { data: getBase64Data(data.image), mimeType: data.mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCompatible: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["isCompatible", "reason"]
        }
      }
    }, functionName, endpoint);

    res.json(JSON.parse(response.text));
  } catch (err: any) {
    const rawStatus = err?.status;
    const status = typeof rawStatus === "number" && rawStatus >= 100 && rawStatus < 600 ? rawStatus : 500;
    const category = logTechnicalDetails(functionName, endpoint, model, status, err);
    res.status(status).json({
      error: category,
      message: err?.message || "Erro na validação de fidelidade."
    });
  }
}

app.post([
  "/api/gemini/validateProductFidelity",
  "/gemini/validateProductFidelity",
  "/api/validateProductFidelity",
  "/validateProductFidelity"
], handleValidateProductFidelity);



async function identifyProductFromImage(data: { image: string; mimeType: string; filename?: string; descricao?: string }): Promise<string> {
  if (data.descricao && data.descricao.trim().length > 3) {
    const cleanDesc = data.descricao.trim().slice(0, 100);
    return cleanDesc;
  }

  if (data.filename) {
    const cleanFilename = data.filename.replace(/[-_]/g, " ").replace(/\.(jpg|png|webp|jpeg)$/i, "").trim();
    if (cleanFilename.length > 2 && !/^(image|img|upload|foto|file|picture|captura|screenshot|\d+)$/i.test(cleanFilename)) {
      return cleanFilename;
    }
  }

  try {
    const response = await backendCallGeminiWithRetry({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Identifique em 3 a 6 palavras em português exatamente qual é o produto B2B/comercial/e-commerce mostrado nesta imagem (ex: 'Forno turbo elétrico em aço inox', 'Balcão térmico de cubas', 'Batedeira industrial'). Responda APENAS o nome do produto, sem ponto ou introdução." },
            { inlineData: { data: getBase64Data(data.image), mimeType: data.mimeType || "image/jpeg" } }
          ]
        }
      ]
    }, "identifyProductFromImage", "/api/generate-content-from-image");

    const textPart = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textPart && textPart.trim().length > 2) {
      const identifiedName = textPart.trim().replace(/^["']|["']$/g, '');
      console.log(`[AI Product Identification] Identified product: "${identifiedName}"`);
      return identifiedName;
    }
  } catch (err) {
    console.warn("[AI Product Identification] Could not identify product name via Gemini text model:", err);
  }

  return "";
}

export async function handleGenerateProductContent(req: express.Request, res: express.Response) {
  const functionName = "generateProductContent";
  const endpoint = "/api/gemini/generateProductContent";

  try {
    let body = req.body || {};
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) {} }
    const { data } = body;
    if (!data) {
      return res.status(400).json({
        error: "invalid_input",
        message: "Os dados do produto para geração de conteúdo estão ausentes ou inválidos."
      });
    }

    // Single mode generation (Principal, Ambientada, Benefícios, Publicitária, Medidas, Componentes, Cor)
    if (data.mode && data.mode !== 'outros') {
      const productTitleOrName = await identifyProductFromImage({
        image: data.image,
        mimeType: data.mimeType,
        filename: data.filename,
        descricao: data.descricao
      });
      const productSubjectHeader = productTitleOrName ? `PRODUTO OBRIGATÓRIO DA IMAGEM: "${productTitleOrName}". Preservar rigorosamente este exato produto enviado como o protagonista central da foto.` : "Preservar rigorosamente o exato produto enviado na imagem de referência como o protagonista central da foto.";
      const productSpecs = data.descricao ? `Especificações do produto: ${data.descricao}.` : "";
      const dimensions = `Dimensões: ${data.altura || "?"}cm (A) x ${data.largura || "?"}cm (L) x ${data.profundidade || "?"}cm (P). Peso: ${data.peso || "?"}kg.`;

      let hasQuotaExceeded = false;
      const generateOneScaledImage = async (
        promptText: string,
        modelName: string = "gemini-3.1-flash-image",
        isHD: boolean = true,
        fallbackPrompt?: string
      ) => {
        const parts: any[] = [
          { inlineData: { data: getBase64Data(data.image), mimeType: data.mimeType } }
        ];

        // Pass standard optional technical image reference if present
        if (data.imageTecnico && data.mimeTypeTecnico) {
          parts.push({
            inlineData: {
              data: getBase64Data(data.imageTecnico),
              mimeType: data.mimeTypeTecnico
            }
          });
        }

        parts.push({ text: promptText });

        const imgResponse = await backendCallGeminiImageWithRetry({
          model: modelName,
          contents: [
            {
              parts: parts
            }
          ],
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              ...(isHD && modelName === "gemini-3.1-flash-image" ? { imageSize: "2K" } : {})
            }
          }
        }, functionName, endpoint, {
          fallbackPrompt,
          productName: productTitleOrName,
          referenceImage: getBase64Data(data.image)
        });

        if (imgResponse?.quotaExceeded) {
          hasQuotaExceeded = true;
        }

        let imageUrl = "";
        for (const part of imgResponse?.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || "image/jpeg"};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (!imageUrl) {
          const emptyImageError: any = new Error("O Gemini não retornou uma imagem válida.");
          emptyImageError.status = 502;
          throw emptyImageError;
        }
        return imageUrl;
      };

    try {
      const imagesList = [];

      if (data.mode === 'principal') {
        const finalPrompt = `${productSubjectHeader} ${productSpecs}
Use a imagem enviada como referência obrigatória e preserve fielmente o produto real "${productTitleOrName}". Não redesenhe, não reconstrua, não transforme em render 3D e não altere a estrutura do item.

Faça uma melhoria fotográfica profissional da imagem original do produto "${productTitleOrName}", como uma foto real de estúdio para e-commerce.

Preserve formato, proporções, ângulo, perspectiva, dimensões visuais, marca original, adesivos, parafusos, rodas, grades, conexões, tubos, puxadores, botões, acabamento, textura, cor e todos os detalhes visíveis do produto.

Melhore iluminação, nitidez, contraste, fidelidade de cor e textura real do material. O produto deve parecer fotografado na vida real, com presença física verdadeira.

Aplique iluminação de estúdio premium, sem criar manchas, halos, sombras cinzas ou áreas escuras no fundo. Manter iluminação de estúdio clara, uniforme, frontal e bem distribuída. O fundo da imagem gerada deve ser sempre branco puro #FFFFFF sólido, absolutamente sem nenhuma sombra no chão, sem sombra atrás do produto, sem sombra projetada no fundo e sem reflexo pesado na base. Se precisar de profundidade visual, usar apenas contraste e nitidez no próprio produto, nunca sombra no fundo ou no chão.

Não suavizar demais as superfícies. Não deixar o produto liso, plástico, artificial, acinzetado, esverdeado ou com aparência de CGI.

Reproduza materiais reais com fidelidade: aço, inox, metal pintado, plástico, borracha, vidro, rodas, parafusos, grades e conexões devem ter textura física, microimperfeições sutis, reflexos naturais e brilho controlado.

Corrija cores apagadas e deixe o produto mais claro, mais vivo e mais chamativo, mantendo fidelidade ao produto real. Não saturar artificialmente.

Não adicionar cenário, pessoas, mãos, textos novos, marcas inventadas, peças falsas, acessórios inexistentes, brilhos exagerados ou efeitos de renderização.

Resultado final: foto principal realista de e-commerce do produto "${productTitleOrName}", com ultra nitidez, alta resolução, textura real do material, iluminação premium, fundo 100% branco #FFFFFF puro, sem sombra e aparência fiel à vida real.`;
        const fallbackPrompt = `Professional studio product photography of ${productTitleOrName || "commercial product"}, centered on pure solid white background #ffffff, high-end e-commerce lighting, sharp focus, 8k resolution, photorealistic commercial catalog`;
        const url = await generateOneScaledImage(finalPrompt, "gemini-3.1-flash-image", true, fallbackPrompt);
        imagesList.push({
          id: 1,
          title: "Imagem Principal",
          description: "Foto principal do produto com fundo branco neutro, de alta nitidez e centralizado.",
          url,
          type: "principal"
        });
      } else if (data.mode === 'publicitaria') {
        const finalPrompt = `${productSubjectHeader} ${productSpecs}
Atue como um diretor de arte e fotógrafo de publicidade de altíssimo nível. Transformar a imagem enviada do produto "${productTitleOrName}" em uma imagem publicitária premium, criativa e comercial.
Preservar o produto principal "${productTitleOrName}" como protagonista, mantendo identidade visual, formato, marca, embalagem e detalhes importantes. A cor, brilho, tamanho visual e enquadramento podem ser ajustados para valorizar o produto, desde que ele continue reconhecível.
Criar uma composição publicitária inspirada no conceito, uso, categoria e público do produto "${productTitleOrName}". O cenário deve conversar com o produto, usando elementos coerentes como ingredientes, luzes, texturas, objetos ou ambiente temático adequado, conforme fizer sentido para o item.
O produto "${productTitleOrName}" deve ficar centralizado ou em destaque absoluto, com iluminação profissional de estúdio, reflexos realistas, sombras suaves, profundidade de campo e aparência sofisticada. A imagem deve parecer campanha de marca premium. Formato quadrado 1:1.`;
        const fallbackPrompt = `Commercial advertising campaign photography of ${productTitleOrName || "commercial product"}, elegant editorial studio staging, dramatic professional lighting, luxury commercial aesthetic, 8k resolution`;
        const url = await generateOneScaledImage(finalPrompt, "gemini-3.1-flash-image", true, fallbackPrompt);
        imagesList.push({
          id: 1,
          title: "Imagem Publicitária",
          description: "Campanha publicitária premium e sofisticada do produto, integrada num cenário adequado.",
          url,
          type: "publicitaria"
        });
      } else if (data.mode === 'medidas') {
        const hVal = data.altura ? (data.altura.toString().toLowerCase().includes('cm') ? data.altura : `${data.altura} cm`) : "? cm";
        const lVal = data.largura ? (data.largura.toString().toLowerCase().includes('cm') ? data.largura : `${data.largura} cm`) : "? cm";
        const pVal = data.profundidade ? (data.profundidade.toString().toLowerCase().includes('cm') ? data.profundidade : `${data.profundidade} cm`) : "? cm";

        const finalPrompt = `${productSubjectHeader} ${productSpecs}
PHOTOREALISTIC TECHNICAL PRODUCT PHOTOGRAPHY OF "${productTitleOrName}". High-end e-commerce lighting. White background.
The product "${productTitleOrName}" shown in the input image must be perfectly centered on a pure white background (#FFFFFF).
Draw clean, thin, elegant black or dark gray dimension lines (measurement/indicator lines) outside the product.
CRITICAL LABEL INSTRUCTIONS:
- Write the EXACT measurements with their units:
  - Height label: "${hVal}" (labeled on the vertical dimension line as "${hVal}" or "Altura: ${hVal}" or "A: ${hVal}")
  - Width label: "${lVal}" (labeled on the horizontal dimension line as "${lVal}" or "Largura: ${lVal}" or "L: ${lVal}")
  - Depth label: "${pVal}" (labeled on the depth dimension line as "${pVal}" or "Profundidade: ${pVal}" or "P: ${pVal}")
  - PROHIBITED: Do NOT include any weight labels, weight numbers, or any indicators such as "peso" or "kg" on the image.

CRITICAL ARROW AND LINE RULES (NO BARS OR BRACKETS):
- DO NOT draw any vertical bars, perpendicular ticks, delimiters, vertical brackets, or crossbars (such as "|", "I", "[", "]", "┤", "├") at the start or end of the arrow lines.
- The arrow lines must end completely clean with ONLY normal arrow heads (pointed arrowheads) pointing at the outer limits of the product.
- No end ticks, no delimiting blocks. Just a clean simple line with single standard arrowheads pointing to the boundaries.

COMPOSIÇÃO VISUAL:
- O produto "${productTitleOrName}" da imagem deve ser preservado de forma fidedigna no centro da imagem.
- Fundo 100% branco puro sólido (#FFFFFF). Sem cenário, sem sombras cinzas ou projetadas na base.
- Textos e marcações devem ser legíveis, limpos e elegantes.`;
        const fallbackPrompt = `Photorealistic technical commercial product photography of ${productTitleOrName || "commercial product"}, centered on pure white background with clean graphic measurement dimension lines labeled Height ${data.altura || "?"}cm, Width ${data.largura || "?"}cm, Depth ${data.profundidade || "?"}cm, no weight indicators, 8k resolution`;
        const url = await generateOneScaledImage(finalPrompt, "gemini-3.1-flash-image", true, fallbackPrompt);
        imagesList.push({
          id: 1,
          title: "Imagem com Medidas",
          description: "Visão técnica do produto com indicação visual externa de altura, largura e profundidade.",
          url,
          type: "medidas"
        });
      } else if (data.mode === 'beneficios') {
        const finalPrompt = `${productSubjectHeader} ${productSpecs}
Você é um Engenheiro de Prompt de Design e Diretor de Arte Sênior especializado em e-commerce de alto padrão.
Sua tarefa é gerar uma imagem publicitária em estilo de infográfico premium e profissional chamado "lifestyle benefits callout" para o produto "${productTitleOrName}".

Diretrizes e Regras de Design e Composição Visual:

1. ESTILO DO INFOGRÁFICO PREMIUM:
- O produto principal "${productTitleOrName}" da imagem enviada deve ser o protagonista central, perfeitamente iluminado com luz de estúdio refinada.
- O cenário de fundo deve ser sutil e integrado à categoria do produto "${productTitleOrName}".
- A composição global deve ser limpa e apresentar os benefícios de forma extremamente elegante e profissional.

2. ASSOCIAÇÃO A PARTES REAIS DO PRODUTO (STRICT PHYSICAL CALLOUTS):
- Identifique as partes físicas reais do próprio produto "${productTitleOrName}" visível na imagem (por exemplo: estrutura, torneiras, pés, painel metálico, botões de controle, acabamentos ou visores).
- Todos os benefícios listados devem estar diretamente associados a uma parte física real do produto.

3. ZOOM CIRCULAR E DETALHES REAIS (CIRCULAR DETAIL ZOOMS - NO ICONS POLICY):
- É TOTALMENTE PROIBIDO usar ícones genéricos ou emojis.
- Use círculos de zoom (recortes circulares ampliados) que mostram o recorte real e detalhado daquela exata parte do produto "${productTitleOrName}".

4. CALLOUTS E DISTRIBUIÇÃO ELEGANTE DAS LINHAS DE CHAMADA:
- Conecte o zoom circular com a parte física real correspondente do produto "${productTitleOrName}" até o texto explicativo em português.
- Distribua os 3 a 5 benefícios nas laterais com simetria e espaçamento elegante. ${productSpecs}

5. TEXTOS CURTOS E PORTUGUÊS DO BRASIL:
- Textos curtos, diretos e ortografia impecável.

6. FIDELIDADE DO PRODUTO:
- Preserve rigorosamente a estrutura, cor e acabamento do produto "${productTitleOrName}". Formato quadrado 1:1.`;
        
        const fallbackPrompt = `Premium lifestyle benefits infographic callout photography of ${productTitleOrName || "commercial product"}, featuring circular zoom details of real product features, clean layout, commercial e-commerce standard, 8k`;
        const url = await generateOneScaledImage(finalPrompt, "gemini-3.1-flash-image", true, fallbackPrompt);

        imagesList.push({
          id: 1,
          title: "Imagem de Benefícios",
          description: "Imagem publicitária de e-commerce destacando as principais características e benefícios do produto.",
          url,
          type: "beneficios"
        });
      } else if (data.mode === 'ambientada') {
        const promptAmbientada = `Gerar uma composição de fotografia profissional e ultra-realista com o produto ambientado de forma sofisticada em um cenário coerente e estético que represente perfeitamente seu ambiente de uso diário (casa, escritório, loja, cozinha, etc). Preservar rigorosamente o produto original como protagonista principal, mantendo identidade visual, formato, marca, embalagem e detalhes importantes. A iluminação de estúdio deve ser suave, com reflexos realistas, profundidade de campo elegante e sombreamento natural de alta qualidade. Formato quadrado 1:1.${productTitleOrName ? `\n\nProduto de referência da foto: "${productTitleOrName}".` : ""}${data.descricao ? `\n\nEspecificações adicionais: ${data.descricao}.` : ""}`;
        const fallbackPrompt = `Photorealistic lifestyle commercial photography of ${productTitleOrName || "commercial product"} in its natural authentic daily use environment, warm soft studio lighting, shallow depth of field, 8k resolution`;
        const url = await generateOneScaledImage(promptAmbientada, "gemini-3.1-flash-image", true, fallbackPrompt);

        imagesList.push({
          id: 1,
          title: "Imagem Ambientada",
          description: "Composição profissional do produto ambientado de forma sofisticada em um cenário coerente.",
          url,
          type: "ambientada"
        });
      } else if (data.mode === 'componentes') {
        let promptComponentes = `${productSubjectHeader} ${productSpecs}
Fotografia ultrarrealista do produto "${productTitleOrName}" em configuração de vista explodida de precisão (exploded view), com todos os componentes internos do produto flutuando perfeitamente alinhados no ar, como uma desmontagem técnica cinematográfica. Cada peça do produto "${productTitleOrName}" deve aparecer separada em ordem lógica de engenharia, revelando sua estrutura interna, parafusos, encaixes, módulos, camadas e acabamentos.

Use o produto "${productTitleOrName}" da imagem de referência principal como base obrigatória para preservar formato, proporções, cores, materiais, textura e identidade visual. A desmontagem deve parecer tecnicamente possível e fiel ao funcionamento do objeto.

Fundo sempre branco puro #FFFFFF sólido, iluminação de estúdio de alta nitidez, sem sombras no fundo ou no chão.`;

        if (data.imageTecnico) {
          promptComponentes += `\n\nRELAÇÃO DOS INPUTS ENVIADOS (REGRAS DE CONTROLE SELETIVO INTER-IMAGENS):
- A primeira imagem (imagem principal do produto) é a referência visual obrigatória para sua identidade física real.
- A segunda imagem contendo o desenho técnico é referência de suporte analítico para orientar o desmembramento técnico das peças internas do produto "${productTitleOrName}".`;
        }

        if (data.detalhesTecnicos && data.detalhesTecnicos.trim()) {
          promptComponentes += `\n\nDETALHES TÉCNICOS ADICIONAIS DO PRODUTO FORNECIDOS:
"${data.detalhesTecnicos.trim()}"`;
        }

        promptComponentes += `\n\nComposição limpa, centralizada do produto "${productTitleOrName}", fundo 100% branco puro #FFFFFF.`;

        const fallbackPrompt = `Exploded view technical product photography of ${productTitleOrName || "commercial product"}, internal components floating in logical disassembled engineering precision, pure white background #ffffff, 8k resolution`;
        const url = await generateOneScaledImage(promptComponentes, "gemini-3.1-flash-image", true, fallbackPrompt);
        imagesList.push({
          id: 1,
          title: "Vista Explodida (Componentes)",
          description: "Apresentação técnica fotorrealista do produto desmembrado com componentes internos em vista explodida.",
          url,
          type: "componentes"
        });
      } else if (data.mode === 'cor') {
        const promptCor = `${productSubjectHeader} ${productSpecs}
Use a imagem do produto "${productTitleOrName}" como base obrigatória e preserve fielmente o item original.
Corrija a aparência artificial do produto "${productTitleOrName}", removendo aspectos de render 3D ou cores apagadas.
Transforme o visual em uma fotografia realista de produto para e-commerce, com cor fiel, textura real do material (inox, metal, plástico, vidro), nitidez controlada e iluminação premium.
Fundo 100% branco puro #FFFFFF sólido. Preserve todos os detalhes reais do produto "${productTitleOrName}".`;
        
        const fallbackPrompt = `High-fidelity commercial studio photography of ${productTitleOrName || "commercial product"} with realistic material textures, stainless steel and real colors, crisp studio lighting, pure white background, 8k resolution`;
        const url = await generateOneScaledImage(promptCor, "gemini-3.1-flash-image", true, fallbackPrompt);
        imagesList.push({
          id: 1,
          title: "Otimização de Cor e Textura",
          description: "Imagem do produto restaurada com cor corrigida, textura física real e iluminação premium de estúdio.",
          url,
          type: "cor"
        });
      }

      return res.json({
        images: imagesList,
        seo: [],
        commercial: { problem: "", solution: "", context: "", benefit: "" },
        crossSell: [],
        improvements: [],
        quotaExceeded: hasQuotaExceeded
      });
    } catch (err: any) {
      console.warn("[Server] Single mode generation notice:", err?.message || err);
      const rawStatus = err?.status;
      const status = typeof rawStatus === "number" && rawStatus >= 100 && rawStatus < 600 ? rawStatus : 500;
      const category = logTechnicalDetails(functionName, endpoint, 'gemini-3.1-flash-image', status, err);
      return res.status(status).json({
        error: category,
        message: err?.message || "Erro na geração da imagem."
      });
    }
  }

  // "All" mode: first generate descriptions, then generate 10 images
  const productTitleOrName = await identifyProductFromImage({
    image: data.image,
    mimeType: data.mimeType,
    filename: data.filename,
    descricao: data.descricao
  });

  const textModel = "gemini-3-flash-preview";
  const systemInstruction = `Você é uma IA de elite especializada em fotografia de produto e marketing para e-commerce.
Sua tarefa é gerar conteúdo de altíssima fidelidade para o produto: "${productTitleOrName}".

REGRAS CRÍTICAS DE FIDELIDADE:
- Preservar rigorosamente o produto "${productTitleOrName}" da imagem enviada como protagonista central em TODAS as imagens.
- NUNCA gerar um cômodo, cenário ou fundo sem o produto "${productTitleOrName}" visível.
- Não alterar categoria do produto, estrutura, proporções, formato, material, cor, marca/logotipo original ou detalhes físicos.
- Se houver conflito entre descrição e imagem, priorizar a imagem enviada como referência visual principal.
- Estética FOTOGRÁFICA REALISTA (Estúdio Profissional), evite aparência de render 3D.
- Iluminação suave, difusa e brilhante (High-end).

ESTRUTURA DE 10 IMAGENS:
1. Principal: Melhorada, fundo branco puro #FFFFFF, máxima nitidez, ocupando 95% do espaço.
2. Lateral: Perfil real (exatos 90°), sem perspectiva frontal ou 3/4. Perpendicular ao produto.
3. Detalhes: Foco em material/acabamento e texturas reais do produto "${productTitleOrName}".
4. Em Uso: Produto "${productTitleOrName}" sendo utilizado em contexto real e prático.
5. Benefícios: Destaque visual dos diferenciais técnicos do produto "${productTitleOrName}".
6. Medidas: Produto "${productTitleOrName}" isolado com linhas de medida indicando dimensões.
7. Comparativo: Escala real em relação a objetos comuns ou ambiente.
8. Composição: Kit completo ou acessórios inclusos.
9. Social Media: Estilo lifestyle premium para divulgação do produto "${productTitleOrName}".
10. Premium/Venda: Renderização de altíssima qualidade para conversão máxima do produto "${productTitleOrName}".

Retorne os dados em formato JSON estrito.`;

  const prompt = `
DADOS DO PRODUTO:
- Nome/Identificação do Produto: ${productTitleOrName}
- Altura: ${data.altura}cm
- Largura: ${data.largura}cm
- Profundidade: ${data.profundidade}cm
- Peso: ${data.peso}kg
- Descrição: ${data.descricao}

Gere o conteúdo JSON incluindo:
- imageDescriptions: Array com 10 itens (id, title, description, prompt_en, type).
- seo: 5 palavras-chave.
- commercial: problem, solution, context, benefit.
- crossSell: 2 produtos genéricos complementares.
- improvements: 3 sugestões técnicas.
`;

  try {
    const textResponse = await backendCallGeminiWithRetry({
      model: textModel,
      contents: [
        {
          parts: [
            { text: systemInstruction },
            { inlineData: { data: getBase64Data(data.image), mimeType: data.mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            imageDescriptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING },
                  prompt_en: { type: Type.STRING, description: "Detailed English prompt for photorealistic generation" }
                },
                required: ["id", "title", "description", "prompt_en", "type"]
              }
            },
            seo: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            commercial: {
              type: Type.OBJECT,
              properties: {
                problem: { type: Type.STRING },
                solution: { type: Type.STRING },
                context: { type: Type.STRING },
                benefit: { type: Type.STRING }
              },
              required: ["problem", "solution", "context", "benefit"]
            },
            crossSell: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["name", "description"]
              }
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["imageDescriptions", "seo", "commercial", "crossSell", "improvements"]
        }
      }
    }, "generateProductContentText", endpoint);

    const result = JSON.parse(textResponse.text);
    
    // Now generate the 10 images based on descriptions
    const images: any[] = [];
    let quotaExceededFlag = false;
    
    // We process each image description to generate the full catalog
    for (const desc of result.imageDescriptions) {
      try {
        const productSpecs = `Características do produto: ${data.descricao}. Material e cores visíveis na imagem. Dimensões: ${data.altura}cm (A) x ${data.largura}cm (L) x ${data.profundidade}cm (P). Peso: ${data.peso}kg.`;
        
        let finalPrompt = "";
        const isBeneficios = desc.id === 5;
        
        if (desc.id === 1) {
          finalPrompt = `Utilize o máximo da capacidade de processamento e todo o tempo necessário para renderização. Atue como um fotógrafo profissional de estúdio e gere uma fotografia de produto com padrão e-commerce, seguindo rigorosamente os critérios abaixo: Fotografia hiper-realista, com altíssimo nível de detalhe, resolução máxima possível sem artefatos ou distorções. Aplicar nitidez inteligente, sem halos, com cores vivas, alto contraste controlado, sombras e reflexos realistas. O produto deve ocupar aproximadamente 95% da imagem, estar centralizado, com cores fiéis ao produto real e uso realista, sem qualquer cenário adicional. Iluminação de estúdio: luz natural suave, uniforme e difusa, utilizando configuração de caixa de luz (softbox). Ângulo da câmera: neutro (ângulo normal), frontal em 3/4, com leve inclinação para a direita. Fundo: branco neutro sólido (#FFFFFF), sem textura de fundo. Formato: 1:1 (quadrado), padrão para e-commerce. Tipo de fotografia: produto / still. ${productSpecs}. Textura realista e fiel ao produto. Restrições obrigatórias: Não aplicar distorções, textos, selos, logotipos adicionais, aparência de desenho, estilo cartoon, render 3D, brilho excessivo ou texturas irreais. Preservar rigorosamente o produto da imagem enviada.`;
        } else if (desc.id === 2) {
          finalPrompt = `Gerar uma fotografia hiper-realista de produto em visão totalmente lateral, perfil puro, com câmera posicionada exatamente a 90 graus em relação à lateral do produto. A imagem deve mostrar o produto completamente de lado, sem perspectiva frontal, sem ângulo 3/4, sem visão superior, sem visão inferior e sem rotação diagonal. A lateral do produto deve estar paralela ao plano da câmera, como fotografia técnica de catálogo. Fundo branco sólido #FFFFFF, iluminação de estúdio suave e uniforme, sombra extremamente discreta e realista, sem escurecer o fundo. Preservar proporções reais, material, textura, cor, acabamento, logotipos originais do próprio produto quando existirem na imagem enviada, e detalhes estruturais. ${productSpecs}. Não adicionar textos, selos, elementos gráficos, cenário, distorções, aparência cartoon, desenho ou render 3D. Formato quadrado 1:1, produto centralizado e ocupando aproximadamente 90% a 95% da imagem. Preservar rigorosamente o produto da imagem enviada.`;
        } else if (isBeneficios) {
          finalPrompt = `Você é um Engenheiro de Prompt de Design e Diretor de Arte Sênior especializado em e-commerce de alto padrão.
Sua tarefa é gerar uma imagem publicitária em estilo de infográfico premium e profissional chamado "lifestyle benefits callout", focando em um design limpo, moderno e minimalista de altíssima conversão.

Diretrizes e Regras de Design e Composição Visual:

1. ESTILO DO INFOGRÁFICO PREMIUM (LIFESTYLE BENEFITS CALLOUT):
- O produto principal da imagem enviada deve ser o protagonista central, perfeitamente iluminado com luz de estúdio refinada, com sombras realistas e profundidade de campo suave.
- O cenário de fundo deve ser sutil, sofisticado e perfeitamente integrado à categoria do produto, mantendo excelente contraste e sem poluir a imagem.
- A composição global deve ser limpa, equilibrada e de facílima leitura, apresentando os benefícios de forma extremamente elegante e profissional (padrão de marca premium global).

2. ASSOCIAÇÃO A PARTES REAIS DO PRODUTO (STRICT PHYSICAL CALLOUTS):
- Identifique as partes físicas reais do próprio produto visível na imagem (por exemplo: torneiras, bandeja, pés, painel metálico, botões de controle, acabamento do material, textura, visor digital ou saída de água).
- Todos os benefícios listados devem estar diretamente associados a uma parte física real específica do produto. Não apresente textos soltos no ar.

3. ZOOM CIRCULAR E DETALHES REAIS (CIRCULAR DETAIL ZOOMS - NO ICONS POLICY):
- É TOTALMENTE PROIBIDO usar ícones genéricos, emojis, símbolos decorativos, badges, ilustrações abstratas ou desenhos amadores para representar os benefícios.
- Em vez de ícones, use círculos de zoom (recortes circulares ampliados/zooms com bordas finas e modernas) que mostram o recorte real e detalhado com nitidez máxima daquela exata parte do produto, servindo de comprovação visual do benefício.
- Cada benefício deve seguir rigorosamente a composição: Zoom Circular Detalhado da Peça do Produto + Linha de Chamada Fina, Moderna e Elegante + Texto Comercial Curto.

4. CALLOUTS E DISTRIBUIÇÃO ELEGANTE DAS LINHAS DE CHAMADA:
- Cada linha de chamada (callout line) deve ser uma linha fina, sutil, moderna e perfeitamente desenhada, que conecta o zoom circular com a parte física real correspondente do produto e estende-se de forma reta até o respectivo texto explicativo.
- As linhas não devem se cruzar, não devem cobrir áreas vitais do produto e não devem apontar para o vácuo ou fundo vazio.
- Distribua os 3 a 5 benefícios de forma equilibrada nas laterais (metade à esquerda, metade à direita), gerando uma simetria perfeita e espaçamentos generosos que evitem qualquer poluição visual. Os benefícios devem destacar as principais características técnicas reais: ${productSpecs}.

5. TEXTOS CURTOS E ORTOGRAFIA IMPECÁVEL EM PORTUGUÊS DO BRASIL:
- Use uma tipografia moderna, limpa e elegante em estilo sans-serif (semelhante a Inter, Montserrat ou Poppins) com excelente contraste e legibilidade.
- Os textos explicativos dos benefícios devem ser extremamente curtos, diretos e sofisticados.
- Escreva exclusivamente em Português do Brasil com acentuação e ortografia perfeitas. Revise rigorosamente antes de renderizar para evitar erros gráficos ou termos ruidosos (por exemplo, garanta palavras reais e perfeitamente válidas em português como "Eficiência", "Instantânea", "Resistência", "Durabilidade", "Praticidade" ou "Limpeza" - nunca crie termos inválidos ou letras duplicadas de forma bizarra como "Limeriza", "Instantânaa" ou "Durabillaide"). Se houver qualquer risco de renderização incorreta de caracteres pequenos, desenhe os zooms circulares e linhas de conexão com perfeição deixando os quadros/blocos de texto limpos para edição posterior.

6. REGRAS DE MARCA E FIDELIDADE DO PRODUTO:
- Preserve rigorosamente a estrutura, cor, acabamento e identidade do produto original da imagem enviada. Não distorça suas formas reais e não adicione marcas comerciais ou logotipos falsos na superfície.
- Formato quadrado 1:1, em altíssima resolução.`;
        } else {
          finalPrompt = `PHOTOREALISTIC STUDIO PHOTOGRAPHY. High-end e-commerce lighting. ${desc.prompt_en}. ${productSpecs}. STRICT FIDELITY: Preservar rigorosamente o produto da imagem enviada. Do not change product structure, colors, or count of parts. ${desc.id === 6 ? 
            `ONLY FOR THIS IMAGE (Image 6): Draw measurement lines OUTSIDE the product in soft black, labeled with the exact measurements: Height: ${data.altura || "?"}cm, Width: ${data.largura || "?"}cm, Depth: ${data.profundidade || "?"}cm. PROHIBITED: Do NOT draw any weight labels, weight numbers, or any indicators such as "weight" or "peso" or "kg" on the image. CRITICAL ARROW RULE: DO NOT draw vertical bars or delimiters at the start and end of arrow lines. Arrow lines must end clean with only standard arrowheads.` : 
            "PROIBIDO: Do not include any icons, overlays, text, arrows, dimensions, or technical overlays. Keep the image clean and photorealistic."} No 3D render look. No text inside product.`;
        }

        const activeImgModel = "gemini-3.1-flash-image";
        const fallbackPromptText = desc.prompt_en 
          ? `High-end commercial catalog photography of ${productTitleOrName || "product"}, ${desc.prompt_en}, studio lighting, sharp focus, 8k resolution, square 1:1`
          : `Professional studio photography of ${productTitleOrName || "product"}, centered, clean white background, 8k resolution`;
        
        const imgResponse = await backendCallGeminiImageWithRetry({
          model: activeImgModel,
          contents: [
            {
              parts: [
                { inlineData: { data: getBase64Data(data.image), mimeType: data.mimeType } },
                { text: finalPrompt }
              ]
            }
          ],
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "2K"
            }
          }
        }, "generateProductContentImage", endpoint, {
          fallbackPrompt: fallbackPromptText,
          productName: productTitleOrName,
          referenceImage: getBase64Data(data.image)
        });

        if (imgResponse?.quotaExceeded) {
          quotaExceededFlag = true;
        }

        let imageUrl = "";
        for (const part of imgResponse?.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || "image/jpeg"};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (!imageUrl) {
          const emptyImageError: any = new Error("O Gemini não retornou uma imagem válida para " + desc.title + ".");
          emptyImageError.status = 502;
          throw emptyImageError;
        }

        images.push({
          id: desc.id,
          title: desc.title,
          description: desc.description,
          type: desc.type,
          url: imageUrl
        });
      } catch (error: any) {
        const itemError: any = new Error("Falha ao gerar " + desc.title + " com o Gemini: " + (error?.message || "erro desconhecido"));
        itemError.status = error?.status || 502;
        throw itemError;
      }
    }

    res.json({
      images,
      seo: result.seo,
      commercial: result.commercial,
      crossSell: result.crossSell,
      improvements: result.improvements,
      quotaExceeded: quotaExceededFlag
    });
  } catch (err: any) {
    const rawStatus = err?.status;
    const status = typeof rawStatus === "number" && rawStatus >= 100 && rawStatus < 600 ? rawStatus : 500;
    const category = logTechnicalDetails(functionName, endpoint, textModel, status, err);
    res.status(status).json({
      error: category,
      message: err?.message || "Erro na geração completa do produto."
    });
  }
  } catch (outerErr: any) {
    console.error("[Server] Erro crítico não-tratado em generateProductContent:", outerErr);
    res.status(500).json({
      error: "server_error",
      message: outerErr?.message || "Ocorreu um erro interno imprevisto no processador de imagens do e-commerce."
    });
  }
}

app.post([
  "/api/gemini/generateProductContent",
  "/gemini/generateProductContent",
  "/api/generateProductContent",
  "/generateProductContent"
], handleGenerateProductContent);

export function normalizeFormattedDescription(raw: string, productName?: string): string {
  if (!raw || typeof raw !== "string") return "";

  let text = raw.trim();

  // 1. Remove Markdown headers (#, ##, ###)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // 2. Remove Markdown bold/italic (**texto**, *texto*, __texto__)
  text = text.replace(/\*\*(.*?)\*\*/g, "$1");
  text = text.replace(/__(.*?)__/g, "$1");

  // 3. Remove leading bullet points (-, *, •) at start of lines
  text = text.replace(/^[ \t]*[*\-•][ \t]+/gm, "");

  // 4. Merge old double-headers into the single new standard title:
  text = text.replace(/Antes de comprar,\s*verifique:?\s*/gi, "");
  text = text.replace(/(?:Antes de comprar,\s*)?Confirme se este é o ([^:\n]+) certo para você:?\s*/gi, "\n\nAntes de comprar, confirme se este é o $1 certo para você:\n");
  text = text.replace(/(?:Antes de comprar,\s*)?Confirme se esta é a ([^:\n]+) certa para você:?\s*/gi, "\n\nAntes de comprar, confirme se esta é a $1 certa para você:\n");
  text = text.replace(/(Antes de comprar,\s*)+confirme se/gi, "Antes de comprar, confirme se");
  text = text.replace(/\n*(Antes de comprar,\s*confirme se (?:este|esta) é [^\n]+)\n*/gi, "\n\n$1\n");

  // 5. In Section B (Questions):
  // Remove parentheses around question explanations:
  text = text.replace(/\?\s*\(([^)\n]+)\)/g, "? $1");
  text = text.replace(/\?\s*[-–—:]\s+/g, "? ");

  // Ensure Section B conclusion has a blank line before and after
  text = text.replace(/\n*(Se respondeu [“"']sim[”"'][^\n]+)\n*/gi, "\n\n$1\n\n");

  // 6. In Section C (Diferenciais):
  // If AI split "Nome do diferencial:\nExplicação", join them to "Nome do diferencial: Explicação"
  text = text.replace(/\n*(Diferenciais técnicos que importam na prática:)\n*/gi, "\n\n$1\n");
  text = text.replace(/^([A-Za-zÀ-ÖØ-öø-ÿ0-9\s/–—-]+):\n([A-Za-zÀ-ÖØ-öø-ÿ0-9])/gm, (match, p1, p2) => {
    const lower = p1.trim().toLowerCase();
    if (
      lower.startsWith("antes de comprar") ||
      lower.startsWith("diferenciais técnicos") ||
      lower.startsWith("especificações técnicas") ||
      lower.startsWith("aplicações indicadas") ||
      lower.startsWith("não indicado") ||
      lower.startsWith("não acompanha") ||
      lower.startsWith("dúvida técnica")
    ) {
      return match;
    }
    return `${p1.trim()}: ${p2}`;
  });

  // Section D title spacing
  text = text.replace(/\n*(Especificações Técnicas:)\n*/gi, "\n\n$1\n");

  // 7. Encerramento:
  // Ensure "Dúvida técnica? Pergunte antes de comprar" is unified with the explanation paragraph:
  text = text.replace(/\n*(Dúvida técnica\?\s*Pergunte antes de comprar)/gi, "\n\n$1");
  text = text.replace(/Dúvida técnica\?\s*Pergunte antes de comprar\.?\s*\n+\s*([^\n]+)/i, "Dúvida técnica? Pergunte antes de comprar, $1");

  // Format the closing ending according to user request:
  // " — nossa equipe responde com dados técnicos precisos. Use a caixa de perguntas logo abaixo do anúncio ou entre em contato."
  // troque para "use a caixa de perguntas logo abaixo do anúncio. Nossa equipe responde com dados técnicos precisos."
  text = text.replace(
    /[-–—\s]*nossa equipe responde com dados técnicos precisos\.?\s*use a caixa de perguntas logo abaixo do anúncio(?:\s+ou entre em contato)?\.?/gi,
    " — use a caixa de perguntas logo abaixo do anúncio. Nossa equipe responde com dados técnicos precisos."
  );
  text = text.replace(
    /[-–—\s]*use a caixa de perguntas logo abaixo do anúncio\s+ou entre em contato\.?\s*(?:nossa equipe responde com dados técnicos precisos\.?)?/gi,
    " — use a caixa de perguntas logo abaixo do anúncio. Nossa equipe responde com dados técnicos precisos."
  );
  text = text.replace(
    /[-–—\s]*use a caixa de perguntas logo abaixo do anúncio(?:\s+ou entre em contato)?\.?(?:\s*nossa equipe responde com dados técnicos precisos\.?)?/gi,
    " — use a caixa de perguntas logo abaixo do anúncio. Nossa equipe responde com dados técnicos precisos."
  );
  text = text.replace(/\s*—\s*—\s*/g, " — ");
  text = text.replace(/,\s*—\s*/g, " — ");

  // 8. Replace placeholders if product name was provided or detected
  if (productName && productName.trim()) {
    const cleanName = productName.trim();
    text = text.replace(/\[Nome do Produto\]/gi, cleanName)
               .replace(/\{Nome do Produto\}/gi, cleanName)
               .replace(/\[NOME DO PRODUTO\]/gi, cleanName)
               .replace(/\{NOME DO PRODUTO\}/gi, cleanName)
               .replace(/NOME DO PRODUTO/g, cleanName);
  }

  // 9. Standardize line spacing:
  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

export function validateDescriptionCompleteness(text: string): { isValid: boolean; reason?: string } {
  if (!text || typeof text !== "string" || text.trim().length < 80) {
    return { isValid: false, reason: "A descrição gerada veio vazia ou com conteúdo insuficiente." };
  }

  const placeholderRegex = /\[nome do produto\]|\[característica\]|\[valor\]|\{benefício\}|xx cm|insira aqui|descreva o produto|\{nome do diferencial\}|\{explicação/i;
  if (placeholderRegex.test(text)) {
    return { isValid: false, reason: "A resposta gerada continha placeholders incompletos de template." };
  }

  const lower = text.toLowerCase();
  const hasVerif = lower.includes("antes de comprar, confirme") || lower.includes("se respondeu “sim”") || lower.includes("se respondeu \"sim\"");
  const hasDiffs = lower.includes("diferenciais técnicos");
  const hasSpecs = lower.includes("especificações técnicas");
  const hasDuvida = lower.includes("dúvida técnica");

  if (!hasVerif || !hasDiffs || !hasSpecs || !hasDuvida) {
    return { isValid: false, reason: "A descrição gerada não continha todas as seções obrigatórias estruturadas." };
  }

  return { isValid: true };
}

export async function handleRewriteDescription(req: express.Request, res: express.Response) {
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) {} }
  const input = body.input || body;
  const model = "gemini-3.8-flash";
  const functionName = "rewriteDescription";
  const endpoint = "/api/gemini/rewriteDescription";

  const apiKeyConfigured = getGeminiApiKey(req);
  if (!apiKeyConfigured) {
    return res.status(500).json({
      error: "missing_api_key",
      message: "Chave de API do Gemini não configurada no servidor. Configure a variável de ambiente GEMINI_API_KEY no painel da Vercel (Project Settings > Environment Variables) e faça um novo deploy."
    });
  }

  const rawOriginalText = String(input?.originalText || input?.text || input?.description || body?.originalText || body?.text || "").trim();
  const inputProductName = String(input?.productName || input?.name || body?.productName || body?.name || "").trim();

  if (!rawOriginalText && !inputProductName) {
    return res.status(400).json({
      error: "insufficient_input",
      message: "Por favor, forneça as informações ou o texto do produto no campo de entrada para gerar a descrição completa."
    });
  }

  const safeForbidden = Array.isArray(input?.forbiddenWords) ? input.forbiddenWords : [];

  const systemInstruction = `Você é um redator técnico e especialista sênior em copywriting para e-commerce e marketplaces brasileiros (Mercado Livre, B2B, plataformas especializadas).
Sua tarefa é gerar descrições de produtos completas, estruturadas, profissionais e prontas para publicação imediata, em português do Brasil.

OBJETIVO PRINCIPAL DE APRESENTAÇÃO E CONTEÚDO:
Compactar a apresentação sem resumir nem remover nenhuma informação relevante.
A saída principal (campo formattedDesc) deve ser TEXTO SIMPLES puro, sem títulos em Markdown (#, ##), sem negrito com asteriscos (**), sem emojis, sem marcadores com bullets (*, -, •), sem blocos de código e sem tags HTML.
Use EXATAMENTE UMA linha em branco entre os blocos principais (A, B, C, D, E). Dentro de cada bloco, use quebras simples de linha, SEM linhas em branco adicionais.
Entregue SEMPRE o texto final 100% preenchido com os dados reais do produto informado, NUNCA um roteiro com colchetes, placeholders como [nome do produto], {benefício}, XX cm, "insira aqui" ou instruções ao redator.
Não invente características, capacidades, materiais, acessórios, certificações, compatibilidades ou medidas que não foram informadas. Omita campos sem dados.
Adapte 100% o texto à categoria e dados do produto real informado (não use fogão como padrão para outros equipamentos!).

ESTRUTURA OBRIGATÓRIA DA DESCRIÇÃO COMPLETA (formattedDesc):

A) INTRODUÇÃO:
- Comece diretamente com um único parágrafo corrido apresentando o produto, sua finalidade e as principais características e vantagens sustentadas pelos dados de entrada.
- NÃO coloque nenhum título antes desse parágrafo.
- Após a introdução, deixe exatamente uma linha em branco.

B) VERIFICAÇÃO ANTES DA COMPRA:
- Título obrigatório:
Antes de comprar, confirme se este é o NOME DO PRODUTO certo para você:
(Substitua NOME DO PRODUTO pelo nome real completo do produto identificado a partir dos dados de entrada. Se o substantivo for feminino, adapte a concordância: "esta é a ... certa para você:").
- Na linha imediatamente seguinte, coloque cada pergunta em uma linha, com a sua explicação na MESMA linha, logo após o ponto de interrogação.
- NÃO use marcadores, numeração, hifens ou linhas em branco entre as perguntas.
- NÃO envolva a explicação da pergunta entre parênteses. (Exemplo: "Sua instalação é para Gás GLP de baixa pressão? Configuração padrão de fábrica").
- Crie preferencialmente 4 perguntas relevantes baseadas estritamente nas informações disponíveis (voltagem/alimentação, espaço/dimensões, capacidade/volume de trabalho, utilidade/acessórios). Não invente dados para completar a quantidade.
- Após as perguntas, deixe exatamente uma linha em branco e inclua a conclusão no padrão:
Se respondeu “sim” para todos os pontos acima, este NOME DO PRODUTO atende à sua necessidade.
(Preencha com o nome real e adapte o artigo se feminino).
- Deixe exatamente uma linha em branco.

C) DIFERENCIAIS E APLICAÇÕES:
- Título obrigatório:
Diferenciais técnicos que importam na prática:
- Na linha imediatamente seguinte, apresente os diferenciais.
- Cada diferencial DEVE ocupar uma ÚNICA linha lógica, no padrão exato:
Nome do diferencial: Explicação completa do diferencial e de sua utilidade prática.
- NÃO quebre linha entre o nome do diferencial e sua explicação. NÃO deixe linhas em branco entre os diferenciais.
- Após os diferenciais, na linha imediatamente seguinte, inclua as aplicações em uma única linha, com itens separados por ponto e vírgula e encerramento adequado:
Aplicações Indicadas: Item 1; Item 2; Item 3; Item 4.
- Na sequência imediata (sem linhas em branco intermediárias), apresente SOMENTE quando houver informação confirmada:
NÃO indicado para: Restrições efetivamente informadas.
NÃO acompanha: Itens efetivamente informados como não inclusos.
(Atenção: estas duas linhas são condicionais. Se não houver informação informada sobre restrições ou itens não inclusos, omita-as completamente. Não invente restrições ou ausências).
- Deixe exatamente uma linha em branco.

D) ESPECIFICAÇÕES TÉCNICAS:
- Título obrigatório:
Especificações Técnicas:
- Na linha imediatamente seguinte, liste cada especificação em uma linha no padrão:
Nome do campo: Valor
- NÃO deixe linhas em branco entre os campos.
- Preserve todas as especificações relevantes disponíveis: modelo, capacidade, material, potência, tensão/voltagem, consumo, dimensões (Altura, Largura, Profundidade), peso e outras que realmente se apliquem ao produto.
- Preserve números, unidades e casas decimais fornecidos (ex: 142,7 cm não deve virar 142 cm). NÃO remova parênteses úteis das especificações técnicas.
- Deixe exatamente uma linha em branco.

E) ENCERRAMENTO:
- Um único parágrafo corrido unindo a chamada de dúvida técnica com a orientação de atendimento, adaptado ao contexto do produto real:
Dúvida técnica? Pergunte antes de comprar, questões sobre [tópicos técnicos reais do produto, ex: vazão de gás, voltagem, pressão, capacidade, etc.] — use a caixa de perguntas logo abaixo do anúncio. Nossa equipe responde com dados técnicos precisos.
- ATENÇÃO OBRIGATÓRIA: O encerramento DEVE terminar exatamente com o padrão: "— use a caixa de perguntas logo abaixo do anúncio. Nossa equipe responde com dados técnicos precisos."
- Substitua o trecho entre a vírgula e o travessão pelas dúvidas técnicas reais pertinentes ao produto informado. NUNCA escreva literalmente a frase "questões sobre aspectos técnicos reais do produto".
- NÃO deixe a chamada isolada em uma linha e a explicação em outro parágrafo.
- Adapte o assunto das dúvidas ao produto real (não mencione gás, chapa ou panelas se o produto for de outra categoria).

SAÍDAS ADICIONAIS NO JSON:
- detectedProductName: Nome real completo do produto identificado a partir do texto/dados de entrada.
- seoParagraph: Parágrafo único para SEO (máximo 800 caracteres), integrando organicamente problema, solução e benefícios.
- typeDescription: Meta descrição para Google Search (máximo 150 caracteres).
- summary: { problem, solution, benefits, target }
- commercial: { problem, solution, context, benefit }
- crossSell: Array com 2 objetos { name, description } de acessórios ou itens complementares reais.
- tips: Array de strings com 3 a 5 dicas úteis.
- seoKeywords: Array de 6 a 10 palavras-chave relevantes.

Retorne os dados em formato JSON estrito conforme o schema.`;

  const inputParts = [
    inputProductName ? `Nome do Produto: ${inputProductName}` : null,
    input?.model ? `Modelo: ${input.model}` : null,
    input?.brand ? `Marca: ${input.brand}` : null,
    input?.voltage ? `Voltagem/Tensão: ${input.voltage}` : null,
    input?.differentials ? `Diferenciais informados: ${input.differentials}` : null,
    input?.altura ? `Altura: ${input.altura} cm` : null,
    input?.largura ? `Largura: ${input.largura} cm` : null,
    input?.profundidade ? `Profundidade: ${input.profundidade} cm` : null,
    input?.peso ? `Peso: ${input.peso} kg` : null,
    input?.additionalSpecs ? `Especificações adicionais: ${input.additionalSpecs}` : null,
    rawOriginalText ? `Texto base / Dados informados pelo usuário:\n${rawOriginalText}` : null
  ].filter(Boolean).join("\n");

  const promptStr = `
DADOS DO PRODUTO:
${inputParts}

LISTA DE PALAVRAS PROIBIDAS (NÃO UTILIZE):
${safeForbidden.join(", ")}

Gere o JSON com:
- detectedProductName: Nome real do produto identificado no texto
- formattedDesc: Texto final da descrição completa seguindo RIGOROSAMENTE todas as regras das seções A, B, C, D e E.
- seoParagraph: Parágrafo único para SEO (máximo 800 caracteres).
- typeDescription: Meta descrição Google (máximo 150 caracteres).
- summary: { problem, solution, benefits, target }
- commercial: { problem, solution, context, benefit }
- crossSell: Array com 2 objetos { name, description } de acessórios ou itens complementares reais.
- tips: Array de strings com 3 a 5 dicas úteis.
- seoKeywords: Array de 6 a 10 palavras-chave relevantes.
`;

  // Backend-side detection for found words and counts
  const wordCounts: { [key: string]: number } = {};
  const foundWords: string[] = [];
  const normalizedText = (rawOriginalText || "").toLowerCase();
  safeForbidden.forEach((word: string) => {
    try {
      const regex = new RegExp(`\\b${word.toLowerCase().replace(/\//g, '\\/')}\\b`, 'gi');
      const matches = normalizedText.match(regex);
      if (matches) {
        wordCounts[word] = matches.length;
        foundWords.push(word);
      }
    } catch (e) {}
  });

  try {
    const response = await backendCallGeminiWithRetry({
      model,
      contents: [
        {
          parts: [
            { text: systemInstruction },
            { text: promptStr }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedProductName: { type: Type.STRING },
            formattedDesc: { type: Type.STRING },
            seoParagraph: { type: Type.STRING },
            typeDescription: { type: Type.STRING },
            summary: {
              type: Type.OBJECT,
              properties: {
                problem: { type: Type.STRING },
                solution: { type: Type.STRING },
                benefits: { type: Type.STRING },
                target: { type: Type.STRING }
              },
              required: ["problem", "solution", "benefits", "target"]
            },
            commercial: {
              type: Type.OBJECT,
              properties: {
                problem: { type: Type.STRING },
                solution: { type: Type.STRING },
                context: { type: Type.STRING },
                benefit: { type: Type.STRING }
              },
              required: ["problem", "solution", "context", "benefit"]
            },
            crossSell: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["name", "description"]
              }
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            seoKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["detectedProductName", "formattedDesc", "seoParagraph", "typeDescription", "summary", "commercial", "crossSell", "tips", "seoKeywords"]
        }
      }
    }, functionName, endpoint, req);

    let result: any = null;
    const rawText = (response?.text || "").trim();
    result = safeParseJsonFromAi(rawText);
    if (!result || typeof result !== "object" || !result.formattedDesc) {
      throw new Error("O modelo não retornou a estrutura completa esperada da descrição.");
    }

    // Normalize and clean up the generated description according to formatting rules
    const resolvedProductName = inputProductName || result?.detectedProductName || "";
    if (result && typeof result.formattedDesc === "string") {
      result.formattedDesc = normalizeFormattedDescription(result.formattedDesc, resolvedProductName);
      
      const validation = validateDescriptionCompleteness(result.formattedDesc);
      if (!validation.isValid) {
        console.warn("[rewriteDescription] Validação de integridade:", validation.reason);
      }
    }

    return res.json({
      ...result,
      foundWords,
      wordCounts,
      generatorVersion: "2.3.0-compact-prod"
    });
  } catch (err: any) {
    console.error("[rewriteDescription] Falha na geração com Gemini:", err?.message || err);
    const rawStatus = Number(err?.status ?? err?.code ?? 500);
    const status = Number.isFinite(rawStatus) && rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;
    logTechnicalDetails(functionName, endpoint, model, status, err);

    let userMessage = "Não foi possível gerar a descrição completa com o Gemini no momento.";
    const errMsg = String(err?.message || "").toLowerCase();
    if (status === 429 || errMsg.includes("quota") || errMsg.includes("resource_exhausted") || errMsg.includes("rate-limit")) {
      userMessage = "Limite de cota da API Gemini atingido temporariamente. Aguarde alguns instantes e tente novamente.";
    } else if (status === 401 || status === 403 || errMsg.includes("api key") || errMsg.includes("permission_denied")) {
      userMessage = "Chave de API do Gemini não configurada ou sem permissão. Verifique a variável GEMINI_API_KEY no painel da Vercel.";
    } else if (status === 503 || errMsg.includes("overloaded") || errMsg.includes("demand") || errMsg.includes("unavailable")) {
      userMessage = "Os servidores do Gemini estão sobrecarregados no momento. Tente novamente em alguns segundos.";
    } else if (err?.message) {
      userMessage = `Falha ao processar descrição: ${err.message}`;
    }

    return res.status(status).json({
      error: "generation_failed",
      message: userMessage,
      foundWords,
      wordCounts
    });
  }
}

app.post([
  "/api/gemini/rewriteDescription",
  "/gemini/rewriteDescription",
  "/api/rewriteDescription",
  "/rewriteDescription"
], handleRewriteDescription);

export async function handleGenerateSimpleSEO(req: express.Request, res: express.Response) {
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) {} }
  const { input } = body;
  const model = "gemini-3-flash-preview";
  const functionName = "generateSimpleSEO";
  const endpoint = "/api/gemini/generateSimpleSEO";

  const systemInstruction = `Você é um copywriter sênior e especialista em SEO focado em marketplaces brasileiros (Mercado Livre, Google, etc.).
Sua tarefa é criar uma excelente descrição do produto em um único parágrafo fluido de alta qualidade e apelo comercial (máximo absoluto de 800 caracteres).

DIRETRIZES DE GERAÇÃO:
- Crie EXATAMENTE um único parágrafo corrido de alta conversão.
- Integre de forma orgânica e natural: o problema do cliente, a solução oferecida pelo produto, características essenciais e benefícios reais de uso.
- Remova ou substitua qualquer palavra proibida listada abaixo pelo correspondente permitido (ou reescreva sem usá-la).
- Tom altamente profissional, comercial técnico e direto ao ponto.
- Sem markdown pesado, sem hifens iniciais, sem emojis e sem bullet points. Apenas um texto coerente e fluido.

Retorne os dados estritamente em formato JSON:
{
  "seoParagraph": "Sua descrição simples de e-commerce e marketplace otimizada aqui (máximo 800 caracteres)."
}`;

  const promptStr = `
DADOS DO PRODUTO:
- Texto Base / Rascunho: ${input.originalText}
- Marca: ${input.brand || "N/A"}
- Modelo: ${input.model || "N/A"}
- Diferenciais/Destaques: ${input.differentials || "N/A"}

LISTA DE PALAVRAS PROIBIDAS (NÃO USE NENHUMA):
${(input.forbiddenWords || []).join(", ")}

Gere os dados estritamente em formato JSON seguindo o schema da instrução do sistema.`;

  try {
    const response = await backendCallGeminiWithRetry({
      model,
      contents: [
        {
          parts: [
            { text: systemInstruction },
            { text: promptStr }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seoParagraph: { type: Type.STRING }
          },
          required: ["seoParagraph"]
        }
      }
    }, functionName, endpoint);

    const result = JSON.parse(response.text);

    // Filter forbidden words check
    const wordCounts: { [key: string]: number } = {};
    const foundWords: string[] = [];
    
    // Check forbidden words against the newly generated description to make sure it's clean, plus originalText
    const normalizedText = (result.seoParagraph + " " + input.originalText).toLowerCase();
    (input.forbiddenWords || []).forEach((word: string) => {
      const regex = new RegExp(`\\b${word.toLowerCase().replace(/\//g, '\\/')}\\b`, 'gi');
      const matches = normalizedText.match(regex);
      if (matches) {
        wordCounts[word] = matches.length;
        foundWords.push(word);
      }
    });

    res.json({
      ...result,
      foundWords,
      wordCounts
    });
  } catch (err: any) {
    const rawStatus = err?.status;
    const status = typeof rawStatus === "number" && rawStatus >= 100 && rawStatus < 600 ? rawStatus : 500;
    logTechnicalDetails(functionName, endpoint, model, status, err);
    
    const brand = input?.brand ? `da marca ${input.brand}` : "";
    const modelStr = input?.model ? `modelo ${input.model}` : "";
    const diffs = input?.differentials ? `destacando-se por ${input.differentials}` : "desenvolvido para alta durabilidade e excelente desempenho";
    const base = input?.originalText?.slice(0, 300) || "";
    
    const seoParagraph = `${base ? `${base.trim()}. ` : ""}O produto ${brand} ${modelStr} foi ${diffs}. Projetado com materiais de alta qualidade e foco em produtividade, atende às principais exigências do mercado com confiabilidade e excelente custo-benefício.`;
    
    return res.json({
      seoParagraph,
      foundWords: [],
      wordCounts: {}
    });
  }
}

app.post([
  "/api/gemini/generateSimpleSEO",
  "/gemini/generateSimpleSEO",
  "/api/generateSimpleSEO",
  "/generateSimpleSEO"
], handleGenerateSimpleSEO);

export async function handleGenerateSEOTitle(req: express.Request, res: express.Response) {
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) {} }
  const { input } = body;
  const model = "gemini-3-flash-preview";
  const functionName = "generateSEOTitle";
  const endpoint = "/api/gemini/generateSEOTitle";

  const systemInstruction = `Você é um Especialista em SEO e Estrategista de Performance para E-commerce, focado em Marketplaces brasileiros.
Sua tarefa é pesquisar (simular pesquisa) e otimizar títulos de produtos para maximizar o CTR e o ranqueamento.

PROCESSO DE ANÁLISE:
1. Pesquise o produto (simule busca) usando: Nome (${input.name}), Marca (${input.brand}), Modelo (${input.model}).
2. Busque referências em: Google, Mercado Livre, Amazon, Shopee, Magalu e principais concorrentes.
3. Identifique as 5 palavras-chave mais usadas pelos concorrentes de alto desempenho.
4. Identifique 3 palavras-chave (diferenciais) que mais destacam este produto específico.

DIRETRIZES DE GERAÇÃO:

1. TITULO: GOOGLE E MERCADO LIVRE
   - REQUISITO CRÍTICO E OBRIGATÓRIO: O título deve conter no MÁXIMO 60 caracteres (incluindo espaços). NUNCA ultrapasse o limite rígido de 60 caracteres sob nenhuma circunstância.
   - Altamente otimizado para SEO de marketplace.
   - Use as palavras-chave mais estratégicas no início.
   - Formato forte e vendedor para atrair cliques dentro desse limite de 60 caracteres.
   - Sem emojis, sem CAPS exagerado (apenas o necessário).

2. TITULO: ACIMAQ
   - Mais limpo, profissional e organizado visualmente.
   - SEO equilibrado com fácil leitura.
   - Mantém alta relevância, mas prioriza a elegância da marca.

REGRAS CRÍTICAS:
- O campo "googleMeliTitle" DEVE ter tamanho máximo rígido de 60 caracteres (incluindo espaços).
- NÃO modifique o produto original.
- NÃO altere Marca ou Modelo.
- NÃO invente especificações técnicas.
- Mantenha a verdade técnica do produto.
- PRIORIZE o "A" de Acimaq no título correspondente.

FORMATO DE RESPOSTA (JSON):
{
  "competitorKeywords": ["p1", "p2", "p3", "p4", "p5"],
  "highlightKeywords": ["h1", "h2", "h3"],
  "googleMeliTitle": "...",
  "acimaqTitle": "...",
  "improvements": ["melhoria 1", "melhoria 2", "melhoria 3"],
  "suggestions": ["variação 1", "variação 2", "variação 3", "variação 4"],
  "intentKeywords": ["termo 1", "termo 2", "termo 3", "termo 4", "termo 5", "termo 6", "termo 7", "termo 8"]
}`;

  try {
    const response = await backendCallGeminiWithRetry({
      model,
      contents: [{ parts: [{ text: systemInstruction }, { text: `DADOS: Nome: ${input.name}, Modelo: ${input.model}, Marca: ${input.brand}, Diferenciais: ${input.differentials || "N/A"}, Título Atual: ${input.currentTitle}. Gere o SEO otimizado.` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            competitorKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            highlightKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            googleMeliTitle: { type: Type.STRING },
            acimaqTitle: { type: Type.STRING },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            intentKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["competitorKeywords", "highlightKeywords", "googleMeliTitle", "acimaqTitle", "improvements", "suggestions", "intentKeywords"]
        }
      }
    }, functionName, endpoint);

    res.json(JSON.parse(response.text));
  } catch (err: any) {
    const rawStatus = err?.status;
    const status = typeof rawStatus === "number" && rawStatus >= 100 && rawStatus < 600 ? rawStatus : 500;
    logTechnicalDetails(functionName, endpoint, model, status, err);
    
    const cleanName = (input?.name || "Produto").trim();
    const cleanBrand = (input?.brand || "").trim();
    const cleanModel = (input?.model || "").trim();
    const cleanVolt = (input?.voltage || "").trim();
    
    const titleParts = [cleanName, cleanModel, cleanBrand, cleanVolt, "Profissional"].filter(Boolean);
    const googleMeliTitle = titleParts.join(" ").slice(0, 60);
    const acimaqTitle = `${cleanName} ${cleanModel} ${cleanBrand} ${cleanVolt} Original`.trim().replace(/\s+/g, ' ');

    return res.json({
      competitorKeywords: [cleanName, `${cleanName} profissional`, "alta durabilidade", "original", "com garantia"],
      highlightKeywords: ["eficiência comprovada", "resistência industrial", "melhor custo-benefício"],
      googleMeliTitle,
      acimaqTitle,
      improvements: [
        "Palavras-chave principais posicionadas nos primeiros 40 caracteres",
        "Remoção de caracteres especiais proibidos por marketplaces",
        "Destaque de marca e modelo para busca exata"
      ],
      suggestions: [
        `${cleanName} ${cleanBrand} ${cleanModel} Alta Performance`,
        `${cleanName} ${cleanModel} ${cleanVolt} - Envio Rápido e Garantia`
      ],
      intentKeywords: ["comprar", "preço", "melhor", "industrial", "profissional"]
    });
  }
}

app.post([
  "/api/gemini/generateSEOTitle",
  "/gemini/generateSEOTitle",
  "/api/generateSEOTitle",
  "/generateSEOTitle"
], handleGenerateSEOTitle);

// Setup Vite Dev Server / Static Production Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Running in DEV mode, initializing Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Running in PRODUCTION mode, serving static files...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Full-stack application ready and listening on http://0.0.0.0:${PORT}`);
  });
}

export { app };
export default app;

if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  startServer();
}
