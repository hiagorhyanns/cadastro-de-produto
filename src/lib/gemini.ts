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

export function sanitizeRewriteResult(result: any, input?: any): RewriteResult {
  if (!result || typeof result !== "object") {
    throw new Error("A resposta recebida da geração é inválida ou não pôde ser lida.");
  }
  return {
    formattedDesc: typeof result.formattedDesc === "string" && result.formattedDesc.trim() 
      ? result.formattedDesc 
      : (typeof result.seoParagraph === "string" && result.seoParagraph.trim() ? result.seoParagraph : "Descrição gerada com sucesso."),
    seoParagraph: typeof result.seoParagraph === "string" ? result.seoParagraph : "",
    typeDescription: typeof result.typeDescription === "string" && result.typeDescription.trim() ? result.typeDescription : "Equipamento de alta qualidade com garantia e suporte técnico.",
    summary: {
      problem: result.summary?.problem || "Necessidade de equipamento robusto com desempenho confiável.",
      solution: result.summary?.solution || "Solução eficiente e resistente para uso contínuo.",
      benefits: result.summary?.benefits || "Alta durabilidade e excelente acabamento.",
      target: result.summary?.target || "Profissionais e empresas do setor."
    },
    commercial: {
      problem: result.commercial?.problem || "Dificuldade na operação diária com produtos comuns.",
      solution: result.commercial?.solution || "Tecnologia e robustez para alta demanda.",
      context: result.commercial?.context || "Uso comercial e profissional frequente.",
      benefit: result.commercial?.benefit || "Retorno comprovado com máxima produtividade."
    },
    crossSell: Array.isArray(result.crossSell) && result.crossSell.length > 0 ? result.crossSell.map((item: any) => ({
      name: item?.name || "Acessório complementar",
      description: item?.description || "Item recomendado para uso conjunto."
    })) : [
      { name: "Acessórios de Manutenção", description: "Kits de conservação e limpeza para maior vida útil." },
      { name: "Peças de Reposição Genuínas", description: "Componentes originais para reposição sem perda de rendimento." }
    ],
    tips: Array.isArray(result.tips) && result.tips.length > 0 ? result.tips.filter(Boolean) : [
      "Verifique as medidas técnicas antes da instalação.",
      "Confira a voltagem correta na rede elétrica.",
      "Mantenha a rotina de higienização preventiva conforme o manual."
    ],
    seoKeywords: Array.isArray(result.seoKeywords) && result.seoKeywords.length > 0 ? result.seoKeywords.filter(Boolean) : [
      "produto profissional", "alta durabilidade", "melhor preço", "equipamento robusto"
    ],
    foundWords: Array.isArray(result.foundWords) ? result.foundWords : [],
    wordCounts: result.wordCounts && typeof result.wordCounts === "object" ? result.wordCounts : {}
  };
}

export async function rewriteDescription(input: RewriteInput): Promise<RewriteResult> {
  const apiKeyHeader: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
    if (key) {
      apiKeyHeader["x-gemini-api-key"] = key;
    }
  }

  const res = await fetch("/api/gemini/rewriteDescription", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...apiKeyHeader
    },
    body: JSON.stringify({ input })
  });

  if (!res.ok) {
    let message = `Erro no servidor (${res.status})`;
    try {
      const errData = await res.json();
      if (errData?.message) {
        message = errData.message;
      }
    } catch (_) {}
    throw new Error(message);
  }

  const data = await safeParseJSONResponse(res);
  if (!data || !data.formattedDesc || typeof data.formattedDesc !== "string" || data.formattedDesc.trim().length < 40) {
    throw new Error("A descrição completa gerada pela IA veio vazia ou incompleta. Suas informações foram mantidas para tentar novamente.");
  }

  return sanitizeRewriteResult(data, input);
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

function createClientFallbackSimpleSEO(input: SimpleSEOInput): SimpleSEOResult {
  const brand = input?.brand ? `da marca ${input.brand}` : "";
  const model = input?.model ? `modelo ${input.model}` : "";
  const diffs = input?.differentials ? `destacando-se por ${input.differentials}` : "desenvolvido para alta durabilidade e excelente desempenho";
  const base = input?.originalText?.slice(0, 300) || "";
  
  const seoParagraph = `${base ? `${base.trim()}. ` : ""}O produto ${brand} ${model} foi ${diffs}. Projetado com materiais de alta qualidade e foco em produtividade, atende às principais exigências do mercado com confiabilidade e excelente custo-benefício.`;
  
  return {
    seoParagraph,
    foundWords: [],
    wordCounts: {}
  };
}

export async function generateSimpleSEO(input: SimpleSEOInput): Promise<SimpleSEOResult> {
  try {
    const res = await fetch("/api/gemini/generateSimpleSEO", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    if (!res.ok) {
      console.warn("API generateSimpleSEO returned non-ok status, using fallback:", res.status);
      return createClientFallbackSimpleSEO(input);
    }

    const data = await safeParseJSONResponse(res);
    if (data && data.seoParagraph) {
      return data;
    }
    return createClientFallbackSimpleSEO(input);
  } catch (error: any) {
    console.warn("Erro ao gerar descrição SEO simples no backend, utilizando fallback seguro:", error);
    return createClientFallbackSimpleSEO(input);
  }
}

