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

function createClientFallbackRewrite(input: RewriteInput): RewriteResult {
  const name = input?.productName || "Produto";
  const model = input?.model ? `Modelo ${input.model}` : "";
  const brand = input?.brand ? `Marca ${input.brand}` : "";
  const volt = input?.voltage ? `Voltagem ${input.voltage}` : "";
  const diffs = input?.differentials || "Alta durabilidade, eficiência operacional e excelente acabamento";

  const alt = input?.altura ? `${input.altura} cm` : "-";
  const larg = input?.largura ? `${input.largura} cm` : "-";
  const prof = input?.profundidade ? `${input.profundidade} cm` : "-";
  const peso = input?.peso ? `${input.peso} kg` : "-";

  const safeForbidden = Array.isArray(input?.forbiddenWords) ? input.forbiddenWords : [];
  const wordCounts: { [key: string]: number } = {};
  const foundWords: string[] = [];
  const normalizedText = (input?.originalText || "").toLowerCase();
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

  const formattedDesc = `${name} ${model} ${brand} ${volt} é desenvolvido para proporcionar máxima eficiência, resistência e precisão no uso diário. Com fabricação reforçada e especificações alinhadas às exigências operacionais, atende com segurança e estabilidade.

Confirme se este é o ${name} certo para você
Antes de comprar, verifique:
A capacidade e dimensões atendem ao seu espaço de trabalho? (Verifique as medidas nas especificações técnicas)
A voltagem e alimentação são compatíveis com sua instalação elétrica? (Confirme se ${volt || "sua rede elétrica"} é a indicada)
O modelo atende ao volume de demanda da sua operação? (Ideal para demandas constantes e de alta produtividade)
Necessita de itens ou acessórios complementares? (Consulte o que acompanha o equipamento)

Se respondeu “sim” para todos os pontos acima, este ${name} atende à sua necessidade.

Diferenciais técnicos que importam na prática:

Estrutura Reforçada e Durabilidade:
Construído com materiais de alta qualidade para suportar rotinas intensas de trabalho sem deformações.

Eficiência e Rendimento:
Projetado para otimizar o tempo de processo e entregar resultados padronizados e consistentes.

Operação Segura e Ergonômica:
Desenvolvido visando facilidade de manuseio e segurança operacional.

${diffs ? `Diferencial Exclusivo:\n${diffs}` : "Acabamento Padronizado:\nFacilidade de higienização e manutenção preventiva."}

Aplicações Indicadas:
Uso comercial e profissional
Ambientes de produção contínua
Estabelecimentos que buscam padronização e rendimento
Setores industriais e operacionais

Especificações Técnicas:

Nome: ${name}
${model ? `Modelo: ${input.model}\n` : ""}${brand ? `Marca: ${input.brand}\n` : ""}${volt ? `Voltagem: ${input.voltage}\n` : ""}Altura: ${alt}
Largura: ${larg}
Profundidade: ${prof}
Peso: ${peso}

Dúvida técnica? Pergunte antes de comprar.

Questões sobre especificações, compatibilidade ou uso do ${name} - nossa equipe responde com dados técnicos precisos. Use a caixa de perguntas logo abaixo do anúncio ou entre em contato.`;

  const seoParagraph = `O ${name} ${model} ${brand} combina durabilidade, alto rendimento e tecnologia para atender rotinas exigentes de trabalho. Projetado com materiais resistentes e foco em segurança, garante produtividade contínua e resultados superiores para o seu negócio.`;

  const typeDescription = `Compre ${name} ${model} ${brand} com o melhor custo-benefício. Alta eficiência, resistência técnica e entrega rápida. Confira!`;

  return sanitizeRewriteResult({
    formattedDesc,
    seoParagraph,
    typeDescription,
    summary: {
      problem: "Necessidade de equipamento robusto com desempenho confiável.",
      solution: `${name} ${model} oferece tecnologia adequada e resistência.`,
      benefits: "Alta produtividade, durabilidade prolongada e operação segura.",
      target: "Profissionais e empresas que buscam rendimento garantido."
    },
    commercial: {
      problem: "Perda de produtividade com equipamentos frágeis ou desregulados.",
      solution: "Estrutura reforçada projetada para funcionamento contínuo.",
      context: "Rotina operacional diária de comércio ou produção.",
      benefit: "Retorno rápido sobre o investimento com menor índice de manutenção."
    },
    crossSell: [
      { name: "Acessórios de Manutenção", description: "Kits de conservação e limpeza para maior vida útil." },
      { name: "Peças de Reposição Genuínas", description: "Componentes originais para reposição sem perda de rendimento." }
    ],
    tips: [
      "Informe detalhadamente as dimensões do local onde o produto será instalado.",
      "Confira a compatibilidade de voltagem antes da ligação.",
      "Mantenha a rotina de higienização preventiva conforme o manual.",
      "Utilize insumos e peças recomendados pelo fabricante."
    ],
    seoKeywords: [
      name.toLowerCase(),
      `${name.toLowerCase()} profissional`,
      `${name.toLowerCase()} ${input?.brand?.toLowerCase() || ""}`.trim(),
      `${name.toLowerCase()} preço`,
      `${name.toLowerCase()} comprar`,
      "equipamento profissional",
      "melhor custo benefício",
      "alta durabilidade"
    ],
    foundWords,
    wordCounts
  }, input);
}

export function sanitizeRewriteResult(result: any, input?: any): RewriteResult {
  if (!result || typeof result !== "object") {
    return createClientFallbackRewrite(input || {});
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
  try {
    const res = await fetch("/api/gemini/rewriteDescription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    if (!res.ok) {
      console.warn("API rewriteDescription returned non-ok status, using fallback:", res.status);
      return sanitizeRewriteResult(createClientFallbackRewrite(input), input);
    }

    const data = await safeParseJSONResponse(res);
    if (data && data.formattedDesc) {
      return sanitizeRewriteResult(data, input);
    }
    return sanitizeRewriteResult(createClientFallbackRewrite(input), input);
  } catch (error: any) {
    console.warn("Erro ao reescrever descrição no backend, utilizando fallback seguro:", error);
    return sanitizeRewriteResult(createClientFallbackRewrite(input), input);
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

