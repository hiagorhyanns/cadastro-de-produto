import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  FileText, 
  Ruler, 
  SlidersHorizontal 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ProductPromptData {
  nome: string;
  sku: string;
  marca: string;
  modelo: string;
  descricao: string;
  caracteristicas: string;
  altura: string;
  largura: string;
  profundidade: string;
  peso: string;
  cor: string;
  material: string;
  voltagem: string;
  capacidade: string;
  temperatura: string;
  potencia: string;
  outrasInformacoes: string;
}

const initialProductData: ProductPromptData = {
  nome: "",
  sku: "",
  marca: "",
  modelo: "",
  descricao: "",
  caracteristicas: "",
  altura: "",
  largura: "",
  profundidade: "",
  peso: "",
  cor: "",
  material: "",
  voltagem: "",
  capacidade: "",
  temperatura: "",
  potencia: "",
  outrasInformacoes: ""
};

function buildPromptPrincipal(data: ProductPromptData): string {
  const parts: string[] = [
    "FOTOGRAFIA PRINCIPAL DE PRODUTO PARA E-COMMERCE\n",
    "Utilize obrigatoriamente a fotografia do produto que será anexada nesta conversa como referência visual principal.\n",
    `Produto:\n${data.nome.trim()}`
  ];

  if (data.marca.trim()) {
    parts.push(`Marca:\n${data.marca.trim()}`);
  }
  if (data.modelo.trim()) {
    parts.push(`Modelo:\n${data.modelo.trim()}`);
  }
  if (data.descricao.trim()) {
    parts.push(`Descrição e aplicação:\n${data.descricao.trim()}`);
  }
  if (data.caracteristicas.trim()) {
    parts.push(`Características técnicas confirmadas:\n${data.caracteristicas.trim()}`);
  }

  parts.push(
`Crie uma fotografia ultrarrealista de produto para e-commerce.

Preserve rigorosamente o produto original da imagem de referência:

- formato;
- proporções;
- cores;
- materiais;
- textura;
- marca;
- logotipo;
- comandos;
- botões;
- painéis;
- displays;
- encaixes;
- componentes;
- parafusos;
- etiquetas;
- acabamento.

Não invente, remova, duplique ou reposicione componentes.

O produto deve estar inteiro e totalmente visível.

Use fundo branco puro sólido #FFFFFF.

Produto centralizado.

Formato quadrado 1:1.

Apresentação premium.

Iluminação profissional de estúdio.

Softbox lateral.

Luz suave de recorte nas bordas.

Reflexos naturais.

Sombra de contato discreta.

Alta nitidez.

Materiais realistas.

Não adicionar pessoas, objetos decorativos, textos publicitários, ícones ou elementos extras.`
  );

  return parts.join("\n\n");
}

function buildPromptAmbientada(data: ProductPromptData): string {
  const parts: string[] = [
    "FOTOGRAFIA DO PRODUTO EM USO REAL\n",
    "Utilize obrigatoriamente a fotografia original do produto anexada nesta conversa como referência visual.\n",
    `Produto:\n${data.nome.trim()}`
  ];

  if (data.descricao.trim()) {
    parts.push(`Descrição e aplicação real:\n${data.descricao.trim()}`);
  }
  if (data.caracteristicas.trim()) {
    parts.push(`Características confirmadas:\n${data.caracteristicas.trim()}`);
  }

  parts.push(
`Crie uma fotografia hiper-realista mostrando o produto sendo utilizado em seu contexto real de aplicação.

O cenário deve ser profissional, natural e coerente com a função do equipamento.

Quando fizer sentido, incluir uma pessoa adulta interagindo naturalmente com o produto.

A pessoa deve ser secundária.

O produto permanece protagonista.

Não esconder:
- controles;
- logotipo;
- painel;
- componentes importantes.

Não inventar funcionalidades.

Não demonstrar funções que não estejam nas informações fornecidas.

Formato quadrado 1:1.

O produto deve permanecer fiel à fotografia original.

Adicionar no canto inferior esquerdo:

- título publicitário curto;
- subtexto de no máximo duas linhas.

O texto deve relacionar uma dificuldade real do cliente com uma característica verdadeira do produto.

Não inventar benefícios ou resultados.`
  );

  return parts.join("\n\n");
}

function buildPromptBeneficios(data: ProductPromptData): string {
  const parts: string[] = [
    "LIFESTYLE BENEFITS CALLOUT\n",
    "Utilize obrigatoriamente a fotografia original anexada como referência do produto.\n",
    `Produto:\n${data.nome.trim()}`
  ];

  if (data.descricao.trim()) {
    parts.push(`Descrição:\n${data.descricao.trim()}`);
  }
  if (data.caracteristicas.trim()) {
    parts.push(`Características técnicas confirmadas:\n${data.caracteristicas.trim()}`);
  }

  parts.push(
`Crie um infográfico publicitário premium no estilo "Lifestyle Benefits Callout".

O produto deve permanecer centralizado, inteiro e fiel à fotografia original.

O produto deve ocupar aproximadamente 45% a 60% da composição.

Selecione preferencialmente as 4 características técnicas mais relevantes dentre as informações fornecidas.

Não inventar nenhuma especificação.

Para características associadas a uma peça visível do equipamento:

- criar zoom circular fotográfico da própria peça;
- utilizar linha fina;
- conectar corretamente ao local correspondente.

Para características que não tenham uma peça específica visível:

- apresentar somente o texto;
- não criar conexão física falsa.

Utilizar títulos curtos.

Tipografia sans-serif moderna.

Design sofisticado, minimalista e comercial.

Não usar:
- emojis;
- ícones genéricos;
- selos inventados;
- desenhos de componentes.

Utilizar apenas:
- produto;
- zooms fotográficos;
- linhas;
- textos.`
  );

  return parts.join("\n\n");
}

function buildPromptPublicitaria(data: ProductPromptData): string {
  const parts: string[] = [
    "FOTOGRAFIA PUBLICITÁRIA PREMIUM\n",
    "Utilize obrigatoriamente a fotografia original do produto anexada nesta conversa.\n",
    `Produto:\n${data.nome.trim()}`
  ];

  if (data.descricao.trim()) {
    parts.push(`Descrição e aplicação:\n${data.descricao.trim()}`);
  }
  if (data.caracteristicas.trim()) {
    parts.push(`Características:\n${data.caracteristicas.trim()}`);
  }
  if (data.cor.trim()) {
    parts.push(`Cor:\n${data.cor.trim()}`);
  }
  if (data.material.trim()) {
    parts.push(`Material:\n${data.material.trim()}`);
  }

  parts.push(
`Preserve integralmente o design do produto.

Crie uma fotografia publicitária premium de estúdio.

Produto centralizado e extremamente nítido.

Adicione ao redor elementos diretamente relacionados à aplicação real do produto.

Para equipamentos de cozinha ou alimentos:
utilizar alimentos, ingredientes, embalagens ou utensílios coerentes.

Para equipamentos comerciais:
utilizar produtos, embalagens, mercadorias ou elementos compatíveis com a função.

Para outras categorias:
utilizar somente objetos relacionados à aplicação real.

Não esconder o produto.

Não adicionar componentes ao equipamento.

Não criar acessórios inexistentes.

Utilizar:

- superfície limpa;
- composição sofisticada;
- iluminação cinematográfica;
- reflexos realistas;
- sombras naturais;
- fundo tonal ou degradê suave relacionado à categoria do produto.

Formato quadrado 1:1.

Não adicionar texto publicitário.`
  );

  return parts.join("\n\n");
}

function buildPromptMedidas(data: ProductPromptData): string {
  const parts: string[] = [
    "IMAGEM TÉCNICA — DIMENSÕES E PESO\n",
    "Utilize obrigatoriamente a fotografia original do produto anexada nesta conversa como referência visual.\n",
    `Produto:\n${data.nome.trim()}`
  ];

  const dimLines: string[] = [];
  if (data.altura.trim()) dimLines.push(`Altura: ${data.altura.trim()} cm`);
  if (data.largura.trim()) dimLines.push(`Largura: ${data.largura.trim()} cm`);
  if (data.profundidade.trim()) dimLines.push(`Profundidade: ${data.profundidade.trim()} cm`);
  if (data.peso.trim()) dimLines.push(`Peso: ${data.peso.trim()} kg`);

  if (dimLines.length > 0) {
    parts.push(`DIMENSÕES REAIS DO PRODUTO:\n\n${dimLines.join("\n")}`);
  }

  parts.push(
`Crie uma imagem técnica minimalista para e-commerce.

Preserve rigorosamente o produto original.

Não modificar:
- formato;
- proporções;
- cores;
- materiais;
- marca;
- controles;
- componentes.

Fundo branco puro sólido #FFFFFF.

Formato quadrado 1:1.

Produto centralizado, inteiro e ampliado.

As medidas devem ficar fora do produto.`
  );

  const measureDirectives: string[] = [];

  if (data.altura.trim()) {
    measureDirectives.push(
`ALTURA:

Posicionar na lateral direita.

Linha vertical extremamente fina.

Mostrar:

${data.altura.trim()}

e logo abaixo:

cm`
    );
  }

  if (data.largura.trim()) {
    measureDirectives.push(
`LARGURA:

Posicionar abaixo do produto.

Linha horizontal extremamente fina.

Mostrar:

${data.largura.trim()} cm`
    );
  }

  if (data.profundidade.trim()) {
    measureDirectives.push(
`PROFUNDIDADE:

Utilizar linha diagonal seguindo corretamente o eixo da frente para trás do produto.

Mostrar:

${data.profundidade.trim()} cm

Não confundir profundidade com largura.`
    );
  }

  if (data.peso.trim()) {
    measureDirectives.push(
`PESO:

Posicionar na lateral esquerda.

Utilizar pequeno ícone minimalista de peso.

Mostrar:

${data.peso.trim()} kg`
    );
  }

  if (measureDirectives.length > 0) {
    parts.push(measureDirectives.join("\n\n"));
  }

  parts.push(
`Utilizar linhas muito finas em cinza-claro.

Não utilizar setas grandes.

Não utilizar linhas pretas grossas.

Não colocar informações sobre o produto.

Não estimar ou alterar nenhuma medida.`
  );

  return parts.join("\n\n");
}

function buildPromptCompleto(data: ProductPromptData): string {
  const sku = data.sku.trim();
  const parts: string[] = [
`IMPORTANTE — GERAÇÃO EM LOTE

Gere agora UM LOTE contendo EXATAMENTE 5 imagens diferentes e independentes do MESMO PRODUTO.

O lote deve conter CINCO SAÍDAS SEPARADAS.

Cada saída corresponde a uma categoria diferente.

SAÍDA 1:
Principal

SAÍDA 2:
Ambientada / Uso real

SAÍDA 3:
Benefícios

SAÍDA 4:
Publicitária

SAÍDA 5:
Medidas

IMPORTANTE:

As cinco saídas NÃO são variações da imagem Principal.

Cada saída deve seguir exclusivamente o briefing correspondente à sua categoria.

NÃO aplicar o fundo branco da imagem Principal nas outras quatro imagens.

NÃO reutilizar o cenário da Principal nas outras imagens.

NÃO utilizar uma imagem gerada anteriormente como base visual das outras.

Todas devem utilizar a fotografia ORIGINAL anexada como referência do produto.

Cada saída deve ser uma imagem quadrada 1:1 independente.

Não criar colagem.
Não criar mosaico.
Não criar grade.
Não criar composição 5 em 1.
Não colocar miniaturas das outras categorias dentro da mesma imagem.

O resultado deve ser CINCO arquivos/imagens separados.`,

`NOMES E FORMATO DOS ARQUIVOS

SKU / Código deste produto:
${sku}

As cinco imagens devem ser entregues como arquivos JPG individuais.

FORMATO DE ARQUIVO FINAL:
JPG / JPEG

NÃO entregar PNG.
NÃO entregar WEBP.
NÃO entregar AVIF.

Todas as cinco imagens finais devem ser disponibilizadas como arquivos .jpg.

Caso a ferramenta de geração de imagem produza originalmente outro formato, como PNG, o ChatGPT deve converter o arquivo final para JPG antes da entrega.
A imagem visual não deve ser alterada durante a conversão.
Utilizar alta qualidade JPEG.
Manter a proporção quadrada 1:1.
Quando a resolução solicitada for 2000 × 2000 px, o JPG final também deve possuir 2000 × 2000 px.

Utilize EXATAMENTE os seguintes nomes:

SAÍDA 1 — PRINCIPAL:
${sku}.jpg

SAÍDA 2 — AMBIENTADA / USO REAL:
${sku}-1.jpg

SAÍDA 3 — BENEFÍCIOS:
${sku}-2.jpg

SAÍDA 4 — PUBLICITÁRIA:
${sku}-3.jpg

SAÍDA 5 — MEDIDAS:
${sku}-4.jpg

Não alterar esses nomes.

Não adicionar palavras ao nome do arquivo.

Não adicionar "principal", "ambientada", "beneficios", "publicitaria" ou "medidas" ao nome.

Não adicionar data.

Não adicionar números aleatórios.

Não adicionar espaços.

Não alterar o SKU.

Não substituir hífen por underline.

Todos os arquivos devem utilizar a extensão:

.jpg`,

`CRIAÇÃO DE IMAGENS PARA E-COMMERCE — GERAR UM LOTE COM EXATAMENTE 5 IMAGENS INDEPENDENTES

Utilize a fotografia original que será anexada nesta conversa como referência obrigatória para todas as imagens.

Quero gerar um lote com 5 imagens diferentes e independentes do MESMO PRODUTO.

Produto:
${data.nome.trim()}

SKU / Código do produto:
${sku}`
  ];

  if (data.marca.trim()) parts.push(`Marca:\n${data.marca.trim()}`);
  if (data.modelo.trim()) parts.push(`Modelo:\n${data.modelo.trim()}`);
  if (data.descricao.trim()) parts.push(`Descrição e aplicação:\n${data.descricao.trim()}`);
  if (data.caracteristicas.trim()) parts.push(`Características técnicas:\n${data.caracteristicas.trim()}`);

  const extraLines: string[] = [];
  if (data.cor.trim()) extraLines.push(`Cor: ${data.cor.trim()}`);
  if (data.material.trim()) extraLines.push(`Material: ${data.material.trim()}`);
  if (data.voltagem.trim()) extraLines.push(`Voltagem: ${data.voltagem.trim()}`);
  if (data.capacidade.trim()) extraLines.push(`Capacidade: ${data.capacidade.trim()}`);
  if (data.temperatura.trim()) extraLines.push(`Temperatura: ${data.temperatura.trim()}`);
  if (data.potencia.trim()) extraLines.push(`Potência: ${data.potencia.trim()}`);
  if (data.outrasInformacoes.trim()) extraLines.push(`Outras informações: ${data.outrasInformacoes.trim()}`);

  if (extraLines.length > 0) {
    parts.push(`Informações adicionais preenchidas:\n${extraLines.join("\n")}`);
  }

  // Regra crítica de diferenciação visual
  parts.push(
`========================================
REGRA CRÍTICA DE DIFERENCIAÇÃO VISUAL
========================================

ATENÇÃO:

As características visuais de uma categoria NÃO devem contaminar as demais categorias.

Por exemplo:

O fundo branco puro #FFFFFF pertence SOMENTE à SAÍDA 1 — PRINCIPAL.

A SAÍDA 2 — AMBIENTADA deve obrigatoriamente apresentar ambiente real de uso.

A SAÍDA 3 — BENEFÍCIOS deve obrigatoriamente apresentar layout de infográfico com textos e destaques técnicos.

A SAÍDA 4 — PUBLICITÁRIA deve obrigatoriamente apresentar cenário publicitário premium com elementos contextuais ao redor do produto.

A SAÍDA 5 — MEDIDAS deve obrigatoriamente apresentar linhas técnicas, medidas e peso.

Se uma saída não apresentar essas diferenças, ela está incorreta.`
  );

  // SAÍDA 1 — PRINCIPAL
  parts.push(
`========================================
SAÍDA 1 — PRINCIPAL
========================================

NOME OBRIGATÓRIO DO ARQUIVO FINAL:
${sku}.jpg

FORMATO:
JPG

Esta instrução vale EXCLUSIVAMENTE para a SAÍDA 1.

${buildPromptPrincipal(data)}

Fundo branco #FFFFFF é exclusivo desta saída e NÃO deve ser utilizado como regra para as saídas 2, 3 e 4.`
  );

  // SAÍDA 2 — AMBIENTADA / USO REAL
  parts.push(
`========================================
SAÍDA 2 — AMBIENTADA / USO REAL
========================================

NOME OBRIGATÓRIO DO ARQUIVO FINAL:
${sku}-1.jpg

FORMATO:
JPG

Esta imagem NÃO pode ter fundo branco de catálogo.

Criar obrigatoriamente uma cozinha profissional completa e claramente visível.

Mostrar bancada, ambiente profissional, profundidade de cenário e contexto real de operação.

Mostrar pessoa adulta utilizando o produto.

O resultado deve parecer uma fotografia feita dentro de uma cozinha profissional, e não uma fotografia de produto isolado.

${buildPromptAmbientada(data)}`
  );

  // SAÍDA 3 — BENEFÍCIOS
  parts.push(
`========================================
SAÍDA 3 — BENEFÍCIOS
========================================

NOME OBRIGATÓRIO DO ARQUIVO FINAL:
${sku}-2.jpg

FORMATO:
JPG

Esta imagem NÃO pode ser apenas uma fotografia do produto sobre fundo branco.

É obrigatório apresentar visual de infográfico publicitário.

Deve conter claramente:
- produto protagonista;
- títulos;
- informações técnicas;
- linhas de conexão;
- zooms fotográficos quando aplicáveis;
- distribuição visual dos benefícios ao redor do produto.

Para este produto, utilizar exclusivamente as características reais preenchidas no formulário.

${buildPromptBeneficios(data)}`
  );

  // SAÍDA 4 — PUBLICITÁRIA
  parts.push(
`========================================
SAÍDA 4 — PUBLICITÁRIA
========================================

NOME OBRIGATÓRIO DO ARQUIVO FINAL:
${sku}-3.jpg

FORMATO:
JPG

Esta imagem NÃO pode utilizar fundo branco de catálogo.

Criar obrigatoriamente um cenário publicitário diferente da Principal.

Para equipamentos de cozinha, utilizar:
- alimentos coerentes;
- ingredientes;
- utensílios;
- elementos relacionados à operação real.

Utilizar:
- fundo tonal;
- degradê suave;
- iluminação cinematográfica;
- profundidade;
- reflexos;
- sombras naturais.

O resultado deve parecer uma campanha publicitária premium.

NÃO adicionar textos.

${buildPromptPublicitaria(data)}`
  );

  // SAÍDA 5 — MEDIDAS E PESO
  const alturaVal = data.altura.trim() ? `${data.altura.trim()} cm` : "conforme especificação";
  const larguraVal = data.largura.trim() ? `${data.largura.trim()} cm` : "conforme especificação";
  const profundidadeVal = data.profundidade.trim() ? `${data.profundidade.trim()} cm` : "conforme especificação";
  const pesoVal = data.peso.trim() ? `${data.peso.trim()} kg` : "conforme especificação";

  parts.push(
`========================================
SAÍDA 5 — MEDIDAS E PESO
========================================

NOME OBRIGATÓRIO DO ARQUIVO FINAL:
${sku}-4.jpg

FORMATO:
JPG

O fundo branco pode ser usado nesta categoria porque se trata de imagem técnica.

Esta saída deve ser claramente diferente da Principal pela presença obrigatória das cotas técnicas.

Deve mostrar:
Altura: ${alturaVal}
Largura: ${larguraVal}
Profundidade: ${profundidadeVal}
Peso: ${pesoVal}

As informações devem ficar fora do produto.

${buildPromptMedidas(data)}`
  );

  // NOVA REGRA FINAL
  parts.push(
`REGRA FINAL DO LOTE

Produza EXATAMENTE CINCO SAÍDAS VISUALMENTE DIFERENTES:

1. PRINCIPAL
Produto isolado + fundo branco.

2. AMBIENTADA
Produto em cozinha profissional + pessoa + CTA.

3. BENEFÍCIOS
Infográfico + características técnicas + zooms/destaques.

4. PUBLICITÁRIA
Cena publicitária premium + alimentos/elementos contextuais + fundo tonal.

5. MEDIDAS
Imagem técnica + dimensões + peso.

As cinco saídas devem utilizar o MESMO produto da fotografia original.

Porém, cenário, composição e função visual devem ser diferentes conforme cada categoria.

Não gerar cinco versões da Principal.

Não gerar cinco produtos sobre fundo branco.

Não aplicar as instruções da primeira categoria às demais.

GERAR AS CINCO SAÍDAS COMO UM ÚNICO LOTE DE CINCO IMAGENS INDEPENDENTES.


PADRÃO OBRIGATÓRIO DOS ARQUIVOS FINAIS

As cinco saídas do lote devem resultar em CINCO arquivos individuais.

Todos devem estar em formato JPG.

Os nomes devem seguir exatamente o SKU informado neste pedido:

1. ${sku}.jpg
2. ${sku}-1.jpg
3. ${sku}-2.jpg
4. ${sku}-3.jpg
5. ${sku}-4.jpg

Correspondência obrigatória:

${sku}.jpg
= Principal

${sku}-1.jpg
= Ambientada / Uso real

${sku}-2.jpg
= Benefícios

${sku}-3.jpg
= Publicitária

${sku}-4.jpg
= Medidas

Não inverter a sequência.

Não duplicar nomes.

Não entregar PNG.

Não entregar uma única imagem contendo as cinco artes.

Cada arquivo JPG corresponde exclusivamente a UMA das cinco saídas do lote.`
  );

  return parts.join("\n\n");
}

export const PromptGeneratorTab: React.FC = () => {
  const [formData, setFormData] = useState<ProductPromptData>(initialProductData);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (field: keyof ProductPromptData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if ((field === 'nome' || field === 'sku') && value.trim()) {
      setValidationError(null);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setValidationError("Informe o Nome do produto.");
      return;
    }
    if (!formData.sku.trim()) {
      setValidationError("Informe o Código / SKU do produto.");
      return;
    }
    setValidationError(null);

    const result = buildPromptCompleto(formData);
    setGeneratedPrompt(result);
  };

  const handleCopy = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const handleClear = () => {
    setGeneratedPrompt(null);
    setCopied(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-10 pb-16 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Gerador de Prompts para Imagens
        </h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Preencha as informações do produto e gere automaticamente os prompts para usar no ChatGPT.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="space-y-8">
        {/* Seção 1: Informações do produto */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-800">
              Informações do produto
            </h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="nome" className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Nome do produto</span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase">Obrigatório</span>
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={e => handleChange('nome', e.target.value)}
                  className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sku" className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Código / SKU do produto</span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase">Obrigatório</span>
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={e => handleChange('sku', e.target.value)}
                  className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm font-mono"
                />
              </div>
            </div>

            {validationError && (
              <p className="text-xs text-red-500 font-medium pt-1">{validationError}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="marca" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Marca
                </Label>
                <Input
                  id="marca"
                  value={formData.marca}
                  onChange={e => handleChange('marca', e.target.value)}
                  className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modelo" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Modelo
                </Label>
                <Input
                  id="modelo"
                  value={formData.modelo}
                  onChange={e => handleChange('modelo', e.target.value)}
                  className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Descrição / Aplicação do produto
              </Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={e => handleChange('descricao', e.target.value)}
                className="min-h-[100px] bg-white border-slate-200 focus:border-blue-500 text-sm leading-relaxed resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="caracteristicas" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Características técnicas
              </Label>
              <Textarea
                id="caracteristicas"
                value={formData.caracteristicas}
                onChange={e => handleChange('caracteristicas', e.target.value)}
                className="min-h-[140px] bg-white border-slate-200 focus:border-blue-500 text-sm leading-relaxed resize-y font-mono"
              />
              <p className="text-xs text-slate-400 font-medium">Digite uma característica por linha.</p>
            </div>
          </div>
        </div>

        {/* Seção 2: Dimensões e peso */}
        <div className="space-y-5 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Ruler className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-800">
              Dimensões e peso
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="altura" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Altura
              </Label>
              <div className="relative">
                <Input
                  id="altura"
                  value={formData.altura}
                  onChange={e => handleChange('altura', e.target.value)}
                  className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="largura" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Largura
              </Label>
              <div className="relative">
                <Input
                  id="largura"
                  value={formData.largura}
                  onChange={e => handleChange('largura', e.target.value)}
                  className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profundidade" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Profundidade
              </Label>
              <div className="relative">
                <Input
                  id="profundidade"
                  value={formData.profundidade}
                  onChange={e => handleChange('profundidade', e.target.value)}
                  className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="peso" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Peso
              </Label>
              <div className="relative">
                <Input
                  id="peso"
                  value={formData.peso}
                  onChange={e => handleChange('peso', e.target.value)}
                  className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  kg
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Seção 3: Informações complementares */}
        <div className="space-y-5 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-800">
              Informações complementares
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cor" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Cor
              </Label>
              <Input
                id="cor"
                value={formData.cor}
                onChange={e => handleChange('cor', e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="material" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Material
              </Label>
              <Input
                id="material"
                value={formData.material}
                onChange={e => handleChange('material', e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="voltagem" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Voltagem
              </Label>
              <Input
                id="voltagem"
                value={formData.voltagem}
                onChange={e => handleChange('voltagem', e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacidade" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Capacidade
              </Label>
              <Input
                id="capacidade"
                value={formData.capacidade}
                onChange={e => handleChange('capacidade', e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="temperatura" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Temperatura
              </Label>
              <Input
                id="temperatura"
                value={formData.temperatura}
                onChange={e => handleChange('temperatura', e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="potencia" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Potência
              </Label>
              <Input
                id="potencia"
                value={formData.potencia}
                onChange={e => handleChange('potencia', e.target.value)}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="outrasInformacoes" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Outras informações
            </Label>
            <Textarea
              id="outrasInformacoes"
              value={formData.outrasInformacoes}
              onChange={e => handleChange('outrasInformacoes', e.target.value)}
              className="min-h-[80px] bg-white border-slate-200 focus:border-blue-500 text-sm leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Botão Principal */}
        <div className="pt-4 flex justify-center">
          <Button
            type="submit"
            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 rounded-lg flex items-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            Gerar Prompt Completo
          </Button>
        </div>
      </form>

      {/* Seção: Resultado */}
      <AnimatePresence>
        {generatedPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6 pt-6 border-t border-slate-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Prompt pronto para usar no ChatGPT
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Copie o prompt abaixo, abra o ChatGPT, anexe a foto original do produto e envie o comando.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleCopy}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs rounded-lg flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copiado ✓
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Prompt
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="h-9 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 border-slate-200 rounded-lg flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar
                </Button>
              </div>
            </div>

            {/* Prompt Único */}
            <Card className="border border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
              <CardContent className="p-5">
                <Textarea
                  readOnly
                  value={generatedPrompt}
                  className="min-h-[460px] max-h-[650px] w-full text-xs font-mono text-slate-800 bg-slate-50/70 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
