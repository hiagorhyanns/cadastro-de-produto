export interface ProductData {
  image: string; // base64
  mimeType: string;
  altura: string;
  largura: string;
  profundidade: string;
  peso: string;
  descricao: string;
  mode?: 'principal' | 'ambientada' | 'beneficios' | 'publicitaria' | 'medidas' | 'outros' | 'componentes' | 'cor';
  imageTecnico?: string; // base64
  mimeTypeTecnico?: string;
  detalhesTecnicos?: string;
  filename?: string;
}

export interface GenerationResult {
  images: {
    id: number;
    title: string;
    description: string;
    url: string;
    type: string;
  }[];
  seo: string[];
  commercial: {
    problem: string;
    solution: string;
    context: string;
    benefit: string;
  };
  crossSell: {
    name: string;
    description: string;
  }[];
  improvements: string[];
  quotaExceeded?: boolean;
}

export interface ValidationResult {
  isCompatible: boolean;
  reason?: string;
}

export interface RewriteResult {
  formattedDesc: string;
  seoParagraph: string;
  typeDescription: string;
  summary: {
    problem: string;
    solution: string;
    benefits: string;
    target: string;
  };
  commercial: {
    problem: string;
    solution: string;
    context: string;
    benefit: string;
  };
  crossSell: {
    name: string;
    description: string;
  }[];
  tips: string[];
  foundWords: string[];
  wordCounts: { [key: string]: number };
  seoKeywords: string[];
}

export interface RewriteInput {
  originalText: string;
  forbiddenWords: string[];
  productName?: string;
  model?: string;
  brand?: string;
  voltage?: string;
  differentials?: string;
  altura?: string;
  largura?: string;
  profundidade?: string;
  peso?: string;
  additionalSpecs?: string;
}

export interface SEOInput {
  name: string;
  model: string;
  voltage: string;
  brand: string;
  differentials?: string;
  currentTitle: string;
}

export interface SEOResult {
  competitorKeywords: string[];
  highlightKeywords: string[];
  googleMeliTitle: string;
  acimaqTitle: string;
  improvements: string[];
  suggestions: string[];
  intentKeywords: string[];
}

async function safeParseJSONResponse(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err: any) {
    if (text.trim().startsWith("<") || text.toLowerCase().includes("<!doctype html")) {
      throw new Error("Resposta inválida do servidor (página HTML recebida). Isso geralmente acontece quando o servidor está reiniciando ou sob manutenção na AI Studio. Aguarde 10 segundos e tente novamente.");
    }
    throw new Error(`Erro ao interpretar resposta do servidor: ${err?.message || "Conteúdo não é um JSON válido."}`);
  }
}

async function safeErrData(res: Response): Promise<any> {
  try {
    const text = await res.text();
    return JSON.parse(text);
  } catch (e) {
    return {};
  }
}

export async function validateProductFidelity(data: ProductData): Promise<ValidationResult> {
  try {
    const res = await fetch("/api/gemini/validateProductFidelity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data })
    });
    
    if (!res.ok) {
      return { isCompatible: true };
    }
    
    return await safeParseJSONResponse(res);
  } catch (error: any) {
    console.error("Erro na validação de fidelidade (ignorado para não bloquear geração):", error);
    return { isCompatible: true };
  }
}

export async function generateProductContent(data: ProductData): Promise<GenerationResult> {
  try {
    const res = await fetch("/api/gemini/generateProductContent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data })
    });

    if (!res.ok) {
      const errData = await safeErrData(res);
      if (errData?.error === "quota" || res.status === 429) {
        throw new Error("Limite de geração atingido ou billing/API key não configurado corretamente. Verifique a cota do projeto Gemini/Google Cloud.");
      }
      throw new Error(errData?.message || `HTTP error ${res.status}`);
    }

    return await safeParseJSONResponse(res);
  } catch (error: any) {
    console.error("Erro na geração do produto:", error);
    if (error?.message?.includes("Limite de geração") || error?.message?.includes("cota") || error?.message?.includes("quota") || error?.message?.includes("QUOTA_EXCEEDED")) {
      throw new Error("Limite de geração atingido ou billing/API key não configurado corretamente. Verifique a cota do projeto Gemini/Google Cloud.");
    }
    throw error;
  }
}

export async function rewriteDescription(input: RewriteInput): Promise<RewriteResult> {
  try {
    const res = await fetch("/api/gemini/rewriteDescription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    if (!res.ok) {
      const errData = await safeErrData(res);
      if (errData?.error === "quota" || res.status === 429) {
        throw new Error("Limite de geração atingido ou billing/API key não configurado corretamente. Verifique a cota do projeto Gemini/Google Cloud.");
      }
      throw new Error(errData?.message || `HTTP error ${res.status}`);
    }

    return await safeParseJSONResponse(res);
  } catch (error: any) {
    console.error("Erro ao reescrever descrição:", error);
    if (error?.message?.includes("Limite de geração") || error?.message?.includes("cota") || error?.message?.includes("quota") || error?.message?.includes("QUOTA_EXCEEDED")) {
      throw new Error("Limite de geração atingido ou billing/API key não configurado corretamente. Verifique a cota do projeto Gemini/Google Cloud.");
    }
    throw error;
  }
}

export async function generateSEOTitle(input: SEOInput): Promise<SEOResult> {
  try {
    const res = await fetch("/api/gemini/generateSEOTitle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    if (!res.ok) {
      const errData = await safeErrData(res);
      if (errData?.error === "quota" || res.status === 429) {
        throw new Error("Limite de geração atingido ou billing/API key não configurado corretamente. Verifique a cota do projeto Gemini/Google Cloud.");
      }
      throw new Error(errData?.message || `HTTP error ${res.status}`);
    }

    return await safeParseJSONResponse(res);
  } catch (error: any) {
    console.error("Erro ao otimizar SEO:", error);
    if (error?.message?.includes("Limite de geração") || error?.message?.includes("cota") || error?.message?.includes("quota") || error?.message?.includes("QUOTA_EXCEEDED")) {
      throw new Error("Limite de geração atingido ou billing/API key não configurado corretamente. Verifique a cota do projeto Gemini/Google Cloud.");
    }
    throw error;
  }
}

export interface SimpleSEOInput {
  originalText: string;
  forbiddenWords: string[];
  brand?: string;
  model?: string;
  differentials?: string;
}

export interface SimpleSEOResult {
  seoParagraph: string;
  foundWords: string[];
  wordCounts: { [key: string]: number };
}

export async function generateSimpleSEO(input: SimpleSEOInput): Promise<SimpleSEOResult> {
  try {
    const res = await fetch("/api/gemini/generateSimpleSEO", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    if (!res.ok) {
      const errData = await safeErrData(res);
      if (errData?.error === "quota" || res.status === 429) {
        throw new Error("Limite de geração atingido ou billing/API key não configurado corretamente. Verifique a cota do projeto Gemini/Google Cloud.");
      }
      throw new Error(errData?.message || `HTTP error ${res.status}`);
    }

    return await safeParseJSONResponse(res);
  } catch (error: any) {
    console.error("Erro ao gerar descrição SEO simples:", error);
    if (error?.message?.includes("Limite de geração") || error?.message?.includes("cota") || error?.message?.includes("quota") || error?.message?.includes("QUOTA_EXCEEDED")) {
      throw new Error("Limite de geração atingido ou billing/API key não configurado corretamente. Verifique a cota do projeto Gemini/Google Cloud.");
    }
    throw error;
  }
}

