import React, { useState, useEffect } from "react";
import { 
  Upload, 
  FileSpreadsheet, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Activity, 
  Package, 
  Search, 
  RefreshCw,
  X,
  Plus,
  Medal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";

interface SKUItem {
  idSku: string;
  name: string;
  quantity: number;
  orderCount: number;
  percentage: number;
}

interface VtexDataState {
  ranking: SKUItem[];
  totalLines: number;
  totalSkus: number;
  lastUpdate: string;
  totalQuantitySold: number;
}

const MONTHS = [
  { id: "geral", label: "Geral" },
  { id: "jan", label: "Janeiro" },
  { id: "fev", label: "Fevereiro" },
  { id: "mar", label: "Março" },
  { id: "abr", label: "Abril" },
  { id: "mai", label: "Maio" },
  { id: "jun", label: "Junho" },
  { id: "jul", label: "Julho" },
  { id: "ago", label: "Agosto" },
  { id: "set", label: "Setembro" },
  { id: "out", label: "Outubro" },
  { id: "nov", label: "Novembro" },
  { id: "dez", label: "Dezembro" }
];

function ProductImage({ idSku }: { idSku: string }) {
  const [error, setError] = useState(false);
  const imageUrl = `https://catalogo.acimaq.com.br/IMGS/${idSku}.jpg`;
  const productUrl = `https://www.acimaq.com.br/${idSku}`;

  return (
    <a 
      href={productUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver produto no site da Acimaq"
      className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group hover:border-blue-500 hover:ring-2 hover:ring-blue-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {error ? (
        <div className="flex flex-col items-center justify-center text-slate-400 bg-slate-50 w-full h-full">
          <Package className="w-5 h-5 text-slate-300" />
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={`SKU ${idSku}`}
          loading="lazy"
          onError={() => setError(true)}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      )}
    </a>
  );
}

export function VtexBestSellersTab() {
  const [data, setData] = useState<VtexDataState | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("geral");

  // Load from localStorage on mount and when selectedMonth changes
  useEffect(() => {
    // Legacy migration: if we have legacy 'vtex_best_sellers', clone it to month keys if not already present
    const legacyDataStream = localStorage.getItem("vtex_best_sellers");
    if (legacyDataStream) {
      if (!localStorage.getItem("vtex_best_sellers_geral")) {
        localStorage.setItem("vtex_best_sellers_geral", legacyDataStream);
      }
      if (!localStorage.getItem("vtex_best_sellers_jun")) {
        localStorage.setItem("vtex_best_sellers_jun", legacyDataStream);
      }
    }

    const key = `vtex_best_sellers_${selectedMonth}`;
    let cached = localStorage.getItem(key);
    
    // Backwards compatibility fallback for general
    if (!cached && selectedMonth === "geral") {
      cached = localStorage.getItem("vtex_best_sellers");
    }

    if (cached) {
      try {
        setData(JSON.parse(cached));
      } catch (err) {
        console.error(`Erro ao carregar dados de vendas do localStorage para ${selectedMonth}`, err);
        setData(null);
      }
    } else {
      setData(null);
    }
    setStatusMessage(null);
    setSearchQuery("");
  }, [selectedMonth]);

  // Safe line parser to split CSV formats preserving column entries with quotes
  const parseCSVLine = (line: string, separator: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(s => s.trim().replace(/^"|"$/g, ""));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage(null);

    // Validate overall extension type helper
    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith(".csv");
    const isXlsx = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (!isCsv && !isXlsx) {
      setLoading(false);
      setStatusMessage({
        type: "error",
        text: "Formato não suportado. O arquivo deve ser do tipo .csv ou .xlsx."
      });
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (!rawRows || rawRows.length === 0) {
        setLoading(false);
        setStatusMessage({
          type: "error",
          text: "Arquivo inválido ou planilha vazia."
        });
        return;
      }

      // Safe check for delimiter splits on CSV sheets that load as a single concatenated column
      let rows: any[][] = [];
      const firstRow = rawRows[0];
      if (firstRow.length === 1 && typeof firstRow[0] === "string" && firstRow[0].includes(";")) {
        rows = rawRows.map(row => {
          if (row.length === 1 && typeof row[0] === "string") {
            return parseCSVLine(row[0], ";");
          }
          return row;
        });
      } else if (firstRow.length === 1 && typeof firstRow[0] === "string" && firstRow[0].includes(",")) {
        rows = rawRows.map(row => {
          if (row.length === 1 && typeof row[0] === "string") {
            return parseCSVLine(row[0], ",");
          }
          return row;
        });
      } else if (firstRow.length === 1 && typeof firstRow[0] === "string" && firstRow[0].includes("\t")) {
        rows = rawRows.map(row => {
          if (row.length === 1 && typeof row[0] === "string") {
            return parseCSVLine(row[0], "\t");
          }
          return row;
        });
      } else {
        rows = rawRows;
      }

      if (rows.length < 2) {
        setLoading(false);
        setStatusMessage({
          type: "error",
          text: "Nenhuma linha válida encontrada."
        });
        return;
      }

      // Parse headers
      const headers = rows[0].map(h => String(h || "").trim());

      // Search ID_SKU index (case-insensitive and resilient variants)
      const idSkuIndex = headers.findIndex(h => {
        const norm = h.toUpperCase().replace(/[\s_-]/g, "");
        return (
          norm === "IDSKU" || 
          norm === "SKUID" ||
          norm === "SKU" ||
          norm === "ID"
        );
      });

      if (idSkuIndex === -1) {
        setLoading(false);
        setStatusMessage({
          type: "error",
          text: "Coluna ID_SKU não encontrada."
        });
        return;
      }

      // Search Quantity_SKU index
      const qtyIndex = headers.findIndex(h => {
        const norm = h.toUpperCase().replace(/[\s_-]/g, "");
        return (
          norm === "QUANTITYSKU" || 
          norm === "QUANTITIESSKU" || 
          norm === "QTDSKU" ||
          norm === "QUANTIDADESKU" ||
          norm === "QUANTIDADE" ||
          norm === "QUANTITY"
        );
      });

      if (qtyIndex === -1) {
        setLoading(false);
        setStatusMessage({
          type: "error",
          text: "Coluna Quantity_SKU não encontrada."
        });
        return;
      }

      // Optionally fetch Product/SKU name column
      const nameIndex = headers.findIndex((h, idx) => {
        if (idx === idSkuIndex) return false;
        const norm = h.toUpperCase().replace(/[\s_-]/g, "");
        return (
          norm === "SKUNAME" ||
          norm === "NAMESKU" ||
          norm === "PRODUCTNAME" ||
          norm === "PRODUTO" ||
          norm === "NOMEDOPRODUTO" ||
          norm === "NOMESKU" ||
          norm === "SKU" ||
          norm === "NOME" ||
          norm === "NAME" ||
          norm === "PRODUCT"
        );
      });

      // Accumulate logic
      const skuMap: { [id: string]: { idSku: string; name: string; quantity: number; orderCount: number } } = {};
      let totalQty = 0;
      let validLinesProcessed = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const idValue = String(row[idSkuIndex] ?? "").trim();
        if (!idValue) continue;

        const qtyRaw = String(row[qtyIndex] ?? "").trim();
        if (!qtyRaw) continue;

        // Strip formatting issues like spaces and parse floats representing Brazilian formatted decimals or integers safely
        const parsedQtyValue = Number(qtyRaw.replace(/\s/g, "").replace(",", "."));
        if (isNaN(parsedQtyValue)) {
          setLoading(false);
          setStatusMessage({
            type: "error",
            text: "Existem valores inválidos na coluna Quantity_SKU."
          });
          return;
        }

        const nameValue = nameIndex !== -1 ? String(row[nameIndex] ?? "").trim() : "";
        const finalName = nameValue || `Produto SKU ${idValue}`;

        if (!skuMap[idValue]) {
          skuMap[idValue] = {
            idSku: idValue,
            name: finalName,
            quantity: 0,
            orderCount: 0
          };
        }

        skuMap[idValue].quantity += parsedQtyValue;
        skuMap[idValue].orderCount += 1;

        if (nameValue && skuMap[idValue].name === `Produto SKU ${idValue}`) {
          skuMap[idValue].name = nameValue;
        }

        totalQty += parsedQtyValue;
        validLinesProcessed++;
      }

      if (validLinesProcessed === 0) {
        setLoading(false);
        setStatusMessage({
          type: "error",
          text: "Nenhuma linha válida encontrada."
        });
        return;
      }

      // Convert mapping back to list with percentage calculations
      const processedRanking: SKUItem[] = Object.values(skuMap).map(item => ({
        ...item,
        percentage: totalQty > 0 ? (item.quantity / totalQty) * 100 : 0
      }));

      // Sort descending by highest selling SKU total amount
      processedRanking.sort((a, b) => b.quantity - a.quantity);

      const timestamp = new Date();
      const currentFormattedDate = `${String(timestamp.getDate()).padStart(2, "0")}/${String(timestamp.getMonth() + 1).padStart(2, "0")}/${timestamp.getFullYear()} ${String(timestamp.getHours()).padStart(2, "0")}:${String(timestamp.getMinutes()).padStart(2, "0")}`;

      const finalState: VtexDataState = {
        ranking: processedRanking,
        totalLines: validLinesProcessed,
        totalSkus: processedRanking.length,
        lastUpdate: currentFormattedDate,
        totalQuantitySold: totalQty
      };

      // Set state and cache locally
      setData(finalState);
      const key = `vtex_best_sellers_${selectedMonth}`;
      localStorage.setItem(key, JSON.stringify(finalState));
      if (selectedMonth === "geral") {
        localStorage.setItem("vtex_best_sellers", JSON.stringify(finalState));
      }

      setLoading(false);
      setStatusMessage({
        type: "success",
        text: `Planilha importada com sucesso para ${MONTHS.find(m => m.id === selectedMonth)?.label || "Geral"}. Foram processadas ${validLinesProcessed} linhas e encontrados ${processedRanking.length} SKUs vendidos.`
      });

    } catch (error) {
      console.error("Falha ao rodar processador vtex excel/csv", error);
      setLoading(false);
      setStatusMessage({
        type: "error",
        text: "Falha ao processar a planilha."
      });
    }
  };

  const handleClearData = () => {
    setData(null);
    const key = `vtex_best_sellers_${selectedMonth}`;
    localStorage.removeItem(key);
    if (selectedMonth === "geral") {
      localStorage.removeItem("vtex_best_sellers");
    }
    setStatusMessage(null);
    setSearchQuery("");
  };

  // Filter ranking list by search query input (by sku or name)
  const filteredRanking = data?.ranking.filter(item => {
    const query = searchQuery.toLowerCase();
    const displayName = item.name || `Produto SKU ${item.idSku}`;
    return (
      item.idSku.toLowerCase().includes(query) || 
      displayName.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header and subtitle */}
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Mais vendido VTEX
        </h2>
        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
          Visualização de ranking de SKUs com base na exportação de pedidos da VTEX
        </p>
      </div>

      {/* Guide explaining where it goes and how it operates */}
      <Card className="border-0 shadow-none rounded-xl bg-white relative">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">
                Como exportar a planilha no Admin VTEX
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Guia de instruções de exportação
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed font-semibold">
            Para gerar e conferir o ranking, obtenha a planilha de pedidos diretamente do seu painel VTEX seguindo estes passos rápidos:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold pb-2">
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none px-1.5 py-0">1</Badge> No Admin VTEX:
              </h4>
              <p className="text-slate-500 leading-relaxed font-medium">
                Vá em <strong className="text-slate-700">Pedidos &gt; Todos os pedidos</strong>. Aplique os filtros de período que deseja analisar e clique em <strong className="text-slate-700">Exportar</strong> no canto superior. Baixe o arquivo recebido no e-mail.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none px-1.5 py-0">2</Badge> Colunas de Cálculo:
              </h4>
              <p className="text-slate-500 leading-relaxed font-medium">
                O analisador lê os cabeçalhos <strong className="text-slate-700">ID_SKU</strong> (ID único do SKU) e <strong className="text-slate-700">Quantity_SKU</strong> (unidades faturadas no pedido) para agrupar e acumular o total absoluto de modo instantâneo.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-medium italic border-l-2 border-orange-400 pl-3">
            Dica: O sistema aceita formatos <strong>.csv</strong> de qualquer separador (; ou ,) ou Excel <strong>.xlsx / .xls</strong>. Se a planilha contiver coluna indicando os nomes do SKU/Produto, eles também serão mapeados no ranking automatically!
          </p>
        </CardContent>
      </Card>

      {/* Selector of month-by-month VTEX Best Sellers */}
      <Card className="border-0 shadow-none rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                Selecione o Período do Ranking
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Escolha o mês para importar ou visualizar o ranking correspondente
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Ativo:</span>
              <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold uppercase border border-rose-200/50 text-[10px]">
                {MONTHS.find(m => m.id === selectedMonth)?.label}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-3 gap-x-1 select-none font-bold text-sm text-rose-500 py-1">
            {MONTHS.map((m, idx) => {
              const isActive = selectedMonth === m.id;
              // Check if localStorage has this month's data to show a nice little dot indicator
              const tempKey = `vtex_best_sellers_${m.id}`;
              const hasData = m.id === "geral" 
                ? !!(localStorage.getItem(tempKey) || localStorage.getItem("vtex_best_sellers"))
                : !!localStorage.getItem(tempKey);

              return (
                <span key={m.id} className="flex items-center">
                  {idx > 0 && <span className="text-rose-300 mx-1.5 select-none font-light">|</span>}
                  <button
                    onClick={() => setSelectedMonth(m.id)}
                    className={`relative px-2.5 py-1 rounded-md transition-all text-xs font-bold tracking-wide cursor-pointer focus:outline-none ${
                      isActive
                        ? "bg-rose-600 text-white shadow-sm font-extrabold"
                        : "hover:bg-rose-50 text-rose-600 hover:text-rose-700"
                    }`}
                  >
                    <span>{m.label}</span>
                    {hasData && (
                      <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                        isActive ? "bg-white" : "bg-emerald-500"
                      }`} title="Possui dados salvos" />
                    )}
                  </button>
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload layout block */}
      <Card className="border-0 shadow-none rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Última atualização ({MONTHS.find(m => m.id === selectedMonth)?.label}): {data?.lastUpdate ? data.lastUpdate : "Nenhuma importação encontrada"}
              </span>
              <p className="text-xs text-slate-500 font-medium">
                {data?.lastUpdate 
                  ? `Foram analisados ${data.totalSkus} SKUs através de ${data.totalLines} transações faturadas para o período selecionado.`
                  : `Por favor, selecione ou importe a planilha de ${MONTHS.find(m => m.id === selectedMonth)?.label} para gerar o ranking.`
                }
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
              {data && (
                <Button 
                  variant="outline" 
                  onClick={handleClearData} 
                  className="h-11 px-5 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-xs font-black uppercase tracking-wider transition-all"
                >
                  Limpar Dados ({MONTHS.find(m => m.id === selectedMonth)?.label})
                </Button>
              )}
              
              <label className="relative flex items-center justify-center h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-100 cursor-pointer transition-all active:scale-95">
                <Upload className="w-4 h-4 mr-2" />
                Importar Planilha ({MONTHS.find(m => m.id === selectedMonth)?.label})
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Skeletons loader or notifications */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3"
              >
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-bold text-slate-700">Agrupando registros e somando quantitativo de SKUs...</p>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Processando o arquivo VTEX</p>
              </motion.div>
            )}

            {!loading && statusMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-5 rounded-xl border flex items-start gap-4 ${
                  statusMessage.type === "success" 
                    ? "bg-emerald-50/60 border-emerald-100 text-emerald-950" 
                    : "bg-rose-50/80 border-rose-100 text-rose-950"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-tight">
                    {statusMessage.type === "success" ? "Processinho Concluído!" : "Falha na Importação"}
                  </h4>
                  <p className="text-xs font-semibold leading-relaxed opacity-90">
                    {statusMessage.text}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Main Results Board */}
      {data && (
        <div className="space-y-6">
          
          {/* Summary counters cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-none rounded-xl bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Diferentes SKUs</p>
                  <p className="text-2xl font-black text-slate-800 leading-none">{data.totalSkus}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none rounded-xl bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Total de Itens Vendidos</p>
                  <p className="text-2xl font-black text-slate-800 leading-none">
                    {Number(data.totalQuantitySold).toLocaleString("pt-BR")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none rounded-xl bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Transações Processadas</p>
                  <p className="text-2xl font-black text-slate-800 leading-none">
                    {data.totalLines}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ranking Table with full specifications */}
          <Card className="border-0 shadow-none rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                  Ranking Geral de Vendas{selectedMonth !== "geral" && ` - ${MONTHS.find(m => m.id === selectedMonth)?.label}`}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 font-semibold">
                  Exibição ordenada descendente pela quantidade vendida faturada em {MONTHS.find(m => m.id === selectedMonth)?.label || "geral"}
                </CardDescription>
              </div>

              {/* Filtering input bar */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-slate-50/50 border-slate-100 hover:border-slate-200 focus:bg-white text-xs font-semibold rounded-xl"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              
              {filteredRanking.length === 0 ? (
                <div className="p-16 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-500">Nenhum item correspondente encontrado.</p>
                  <p className="text-xs text-slate-400">Experimente ajustar o termo de busca ou limpar o filtro.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-4 px-6 text-center w-24">Pos</th>
                        <th className="py-4 px-6">Produto</th>
                        <th className="py-4 px-6 text-center w-36">ID SKU</th>
                        <th className="py-2 px-6 text-center w-36">Pedidos (Linhas)</th>
                        <th className="py-2 px-6 text-slate-right w-36 text-right">Qtd Vendida</th>
                        <th className="py-2 px-6 text-slate-right w-36 text-right">% Participação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/70">
                      {filteredRanking.map((item, index) => {
                        const originalPos = data.ranking.findIndex(r => r.idSku === item.idSku) + 1;
                        
                        return (
                          <tr key={item.idSku} className="text-xs font-semibold text-slate-600 hover:bg-slate-50/40 transition-colors">
                            
                            {/* Position */}
                            <td className="py-4 px-6 text-center">
                              {originalPos === 1 ? (
                                <span className="inline-flex items-center justify-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/50 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm">
                                  <Medal className="w-4 h-4 text-yellow-500 fill-yellow-400 shrink-0" />
                                  1º
                                </span>
                              ) : originalPos === 2 ? (
                                <span className="inline-flex items-center justify-center gap-1 bg-orange-50 text-orange-950 border border-orange-200/50 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm">
                                  <Medal className="w-4 h-4 text-orange-600 fill-orange-500 shrink-0" />
                                  2º
                                </span>
                              ) : originalPos === 3 ? (
                                <span className="inline-flex items-center justify-center gap-1 bg-slate-100 text-slate-700 border border-slate-200/50 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm">
                                  <Medal className="w-4 h-4 text-slate-400 fill-slate-300 shrink-0" />
                                  3º
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-slate-400 hover:text-slate-500">
                                  {originalPos}º
                                </span>
                              )}
                            </td>

                            {/* Produto */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <ProductImage idSku={item.idSku} />
                                <div className="min-w-0">
                                  <a 
                                    href={`https://www.acimaq.com.br/${item.idSku}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Ver produto no site da Acimaq"
                                    className="text-slate-800 font-extrabold max-w-sm sm:max-w-md truncate hover:text-blue-600 hover:underline transition-all block cursor-pointer"
                                  >
                                    {item.name || `Produto SKU ${item.idSku}`}
                                  </a>
                                </div>
                              </div>
                            </td>

                            {/* ID SKU */}
                            <td className="py-4 px-6 text-center">
                              <span className="font-mono text-xs font-extrabold tracking-wider text-slate-700 bg-slate-100/80 border border-slate-200 px-2.5 py-1 rounded-lg">
                                {item.idSku}
                              </span>
                            </td>

                            {/* Occurrence count */}
                            <td className="py-4 px-6 text-center text-slate-500">
                              {item.orderCount}
                            </td>

                            {/* Quantity */}
                            <td className="py-4 px-6 text-right font-black text-slate-900">
                              {Number(item.quantity).toLocaleString("pt-BR")}
                            </td>

                            {/* Percentage with progress visual line */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex flex-col items-end gap-1 structure">
                                <span className="text-[11px] font-black text-blue-600">
                                  {item.percentage.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%
                                </span>
                                <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-blue-600 h-full rounded-full" 
                                    style={{ width: `${Math.min(item.percentage * 2, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
