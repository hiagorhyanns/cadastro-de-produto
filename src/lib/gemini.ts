import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ProductData {
  image: string; // base64
  mimeType: string;
  altura: string;
  largura: string;
  profundidade: string;
  peso: string;
  descricao: string;
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
}

export async function generateProductContent(data: ProductData): Promise<GenerationResult> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `Você é uma IA de elite especializada em fotografia de produto e marketing para e-commerce.
Sua tarefa é gerar conteúdo de altíssima fidelidade para um produto específico.

REGRAS CRÍTICAS DE FIDELIDADE:
- NUNCA altere a estrutura, cores ou componentes do produto.
- Mantenha a contagem exata de peças (assadeiras, botões, etc).
- Estética FOTOGRÁFICA REALISTA (Estúdio Profissional), evite aparência de render 3D.
- Iluminação suave, difusa e brilhante (High-end).

ESTRUTURA DE 8 IMAGENS:
1. Principal: Melhorada, fundo neutro, máxima nitidez.
2. Lateral: Perfil real (exatos 90°), sem repetição da principal.
3. Traseira: Visão posterior completa do produto.
4. Detalhe 1: Foco em material/acabamento.
5. Detalhe 2: Foco em funcionalidade técnica.
6. Ambientada: Escala real, pessoas interagindo, objetos de referência.
7. Benefícios: Layout com ícones e destaques visuais.
8. Dimensões: Produto isolado, linhas de medida EXTERNAS (fora do produto), identificadas como Altura, Largura e Profundidade.

Retorne os dados em formato JSON estrito.`;

  const prompt = `
DADOS DO PRODUTO:
- Altura: ${data.altura}cm
- Largura: ${data.largura}cm
- Profundidade: ${data.profundidade}cm
- Peso: ${data.peso}kg
- Descrição: ${data.descricao}

Gere o conteúdo JSON incluindo:
- imageDescriptions: Array com 8 itens (id, title, description, prompt_en, type).
- seo: 5 palavras-chave.
- commercial: problem, solution, context, benefit.
- crossSell: 2 produtos genéricos complementares (ex: kit manutenção, acessório proteção).
- improvements: 3 sugestões técnicas.
`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: systemInstruction },
          { inlineData: { data: data.image.split(',')[1], mimeType: data.mimeType } },
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
  });

  const result = JSON.parse(response.text);
  
  const images = await Promise.all(result.imageDescriptions.map(async (desc: any) => {
    try {
      const imgResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [
          {
            parts: [
              { inlineData: { data: data.image.split(',')[1], mimeType: data.mimeType } },
              { text: `PHOTOREALISTIC STUDIO PHOTOGRAPHY. High-end e-commerce lighting. 
              Requirement: ${desc.prompt_en}. 
              STRICT FIDELITY: Do not change product structure, colors, or count of parts. 
              ${desc.id === 8 ? 
                "ONLY FOR THIS IMAGE (Image 8): Draw measurement lines OUTSIDE the product in soft black, labeled 'Altura', 'Largura', 'Profundidade' and include weight '${data.peso}kg' as visual info." : 
                "PROIBIDO: Do not include any measurement lines, text, dimensions, or technical overlays. Keep the image clean."}
              If detail/benefit: use clean layout with subtle arrows and modern icons. 
              No 3D render look. No text inside product.` }
            ]
          }
        ]
      });

      let imageUrl = "";
      for (const part of imgResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      return {
        id: desc.id,
        title: desc.title,
        description: desc.description,
        type: desc.type,
        url: imageUrl || data.image
      };
    } catch (error) {
      return {
        id: desc.id,
        title: desc.title,
        description: desc.description,
        type: desc.type,
        url: data.image
      };
    }
  }));

  return {
    images,
    seo: result.seo,
    commercial: result.commercial,
    crossSell: result.crossSell,
    improvements: result.improvements
  };
}
