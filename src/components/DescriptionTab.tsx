import React, { memo } from "react";
import { 
  Eraser, 
  Loader2, 
  CheckCircle2, 
  PlusCircle, 
  Copy,
  AlertCircle, 
  Lightbulb, 
  Sparkles, 
  Search, 
  X, 
  Target, 
  ShoppingBag, 
  ArrowRight,
  FileText,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { generateSimpleSEO } from "@/lib/gemini";
import type { RewriteResult, SimpleSEOResult } from "@/lib/gemini";

interface DescriptionTabProps {
  originalDesc: string;
  setOriginalDesc: (val: string) => void;
  formatarMedidas: {
    altura: string;
    largura: string;
    profundidade: string;
    peso: string;
  };
  setFormatarMedidas: React.Dispatch<React.SetStateAction<any>>;
  handleRewrite: () => Promise<void>;
  rewriteLoading: boolean;
  rewriteResult: RewriteResult | null;
  setRewriteResult?: React.Dispatch<React.SetStateAction<RewriteResult | null>>;
  foundWords: string[];
  wordCounts: { [key: string]: number };
  showForbiddenAlert: boolean;
  setShowForbiddenAlert: (val: boolean) => void;
  copyAlert: boolean;
  setCopyAlert: (val: boolean) => void;
  typeDescAlert: boolean;
  setTypeDescAlert: (val: boolean) => void;
  quotaExceeded: boolean;
  seoFormData?: any;
  forbiddenWords?: string[];
}

export const DescriptionTab = ({
  originalDesc = "",
  setOriginalDesc,
  formatarMedidas = { altura: "", largura: "", profundidade: "", peso: "" },
  setFormatarMedidas,
  handleRewrite,
  rewriteLoading = false,
  rewriteResult = null,
  setRewriteResult,
  foundWords = [],
  wordCounts = {},
  showForbiddenAlert = false,
  setShowForbiddenAlert,
  copyAlert = false,
  setCopyAlert,
  typeDescAlert = false,
  setTypeDescAlert,
  quotaExceeded = false,
  seoFormData,
  forbiddenWords = []
}: DescriptionTabProps) => {
  const [activeSubTab, setActiveSubTab] = React.useState<"completo" | "rapido">("completo");

  // Rapid (Quick) states
  const [rapidInput, setRapidInput] = React.useState("");
  const [rapidLoading, setRapidLoading] = React.useState(false);
  const [rapidResult, setRapidResult] = React.useState<SimpleSEOResult | null>(null);
  const [rapidCopyAlert, setRapidCopyAlert] = React.useState(false);
  const [rapidFoundWords, setRapidFoundWords] = React.useState<string[]>([]);
  const [rapidWordCounts, setRapidWordCounts] = React.useState<{ [key: string]: number }>({});
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);

  const COMPLETO_LOADING_STATUSES = [
    "Analisando dados do produto e especificações técnicas...",
    "Eliminando termos restritos e verificando conformidade...",
    "Aplicando diretrizes de SEO e palavras-chave de alta conversão...",
    "Construindo copy persuasiva (dor, solução, contexto e impacto)...",
    "Estruturando formatação técnica e sugestões de compre junto...",
    "Finalizando revisão e gerando meta descrição..."
  ];

  const [loadingStatusIndex, setLoadingStatusIndex] = React.useState(0);

  React.useEffect(() => {
    if (!rewriteLoading) {
      setLoadingStatusIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStatusIndex((prev) => (prev + 1) % COMPLETO_LOADING_STATUSES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [rewriteLoading]);

  React.useEffect(() => {
    if (rewriteResult || rapidResult) {
      setShowSuccessToast(true);
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowSuccessToast(false);
    }
  }, [rewriteResult, rapidResult]);

  const safeFoundWords = Array.isArray(foundWords) ? foundWords : [];
  const safeWordCounts = wordCounts && typeof wordCounts === "object" ? wordCounts : {};
  const safeOriginalDesc = typeof originalDesc === "string" ? originalDesc : "";

  React.useEffect(() => {
    if (!rapidInput.trim()) {
      setRapidFoundWords([]);
      setRapidWordCounts({});
      return;
    }

    const counts: { [key: string]: number } = {};
    const found: string[] = [];
    const normalizedText = rapidInput.toLowerCase();

    (forbiddenWords || []).filter(Boolean).forEach(word => {
      try {
        const escapedWord = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/');
        const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
        const matches = normalizedText.match(regex);
        
        if (matches) {
          counts[word] = matches.length;
          found.push(word);
        }
      } catch (e) {}
    });

    setRapidFoundWords(found);
    setRapidWordCounts(counts);
  }, [rapidInput, forbiddenWords]);

  const handleRapidGenerate = async () => {
    if (!rapidInput.trim()) return;
    if (/\bfrete\b/i.test(rapidInput)) {
      alert("A palavra 'Frete' é proibida na Via Varejo. Geração bloqueada até que o termo seja removido.");
      return;
    }
    setRapidLoading(true);
    try {
      const res = await generateSimpleSEO({
        originalText: rapidInput,
        forbiddenWords: forbiddenWords || [],
        brand: seoFormData?.brand,
        model: seoFormData?.model,
        differentials: seoFormData?.differentials
      });
      setRapidResult(res);
      setRapidFoundWords(res.foundWords || []);
      setRapidWordCounts(res.wordCounts || {});
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Ocorreu um erro ao gerar a descrição rápida. Tente novamente.");
    } finally {
      setRapidLoading(false);
    }
  };

  const handleResetCompleto = () => {
    if (setRewriteResult) {
      setRewriteResult(null);
    }
  };

  const handleResetRapido = () => {
    setRapidResult(null);
  };

  const hasFrete = safeFoundWords.some(w => String(w).toLowerCase() === "frete");
  const hasRapidFrete = rapidFoundWords.some(w => String(w).toLowerCase() === "frete");

  return (
    <>
      {/* Alerta popup temporário no topo: Descrição Gerada com Sucesso */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ y: -60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            style={{ borderRadius: "15px" }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3.5 bg-emerald-600 text-white rounded-[15px] shadow-2xl border border-emerald-500 font-bold text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            <span>Descrição Gerada com Sucesso</span>
            <button
              type="button"
              onClick={() => setShowSuccessToast(false)}
              className="ml-2 p-1 hover:bg-emerald-700/80 rounded-full transition-colors text-white/80 hover:text-white"
              aria-label="Fechar alerta"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeSubTab === "completo" && !rewriteResult && showForbiddenAlert && safeFoundWords.length > 0 && (
          <motion.div 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            style={{ borderRadius: "15px" }}
            className="sticky top-16 z-50 bg-red-600 text-white p-4 shadow-none rounded-[15px] mb-3 border border-slate-200 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[90px] rounded-full -mr-32 -mt-32 animate-pulse" />
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-2 sm:px-4 relative z-10">
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-black uppercase tracking-tight text-white">Termos Restritos Detectados!</h3>
                  <p className="text-xs font-medium text-red-50/90 leading-relaxed max-w-3xl">
                    Identificamos palavras proibidas no seu texto que podem prejudicar o SEO ou violar políticas de marketplace:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {safeFoundWords.map(word => {
                      const isFrete = word.toLowerCase() === "frete";
                      const label = isFrete ? "frete (PROIBIDO VIA VAREJO)" : word;
                      const count = safeWordCounts[word] || 1;
                      return (
                        <span 
                          key={word}
                          style={{ borderRadius: "15px" }}
                          className="bg-red-700 text-white font-bold text-xs uppercase px-2.5 py-0.5 rounded-[15px] border border-red-800 shadow-none inline-flex items-center"
                        >
                          {label} ({count}x)
                        </span>
                      );
                    })}
                  </div>
                </div>
              <Button 
                variant="ghost" 
                size="icon" 
                style={{ borderRadius: "15px" }}
                onClick={() => setShowForbiddenAlert(false)}
                className="h-9 w-9 text-white hover:bg-white/20 rounded-[15px] transition-all active:scale-90 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {activeSubTab === "rapido" && !rapidResult && rapidFoundWords.length > 0 && (
          <motion.div 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            style={{ borderRadius: "15px" }}
            className="sticky top-16 z-50 bg-red-600 text-white p-4 shadow-none rounded-[15px] mb-3 border border-slate-200 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[90px] rounded-full -mr-32 -mt-32 animate-pulse" />
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-2 sm:px-4 relative z-10">
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-black uppercase tracking-tight text-white">Termos Restritos Detectados na Geração Rápida!</h3>
                  <p className="text-xs font-medium text-red-50/90 leading-relaxed max-w-3xl">
                    Identificamos palavras proibidas no seu rascunho de texto que podem prejudicar o SEO:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {rapidFoundWords.map(word => {
                      const isFrete = word.toLowerCase() === "frete";
                      const label = isFrete ? "frete (PROIBIDO VIA VAREJO)" : word;
                      const count = rapidWordCounts[word] || 1;
                      return (
                        <span 
                          key={word}
                          style={{ borderRadius: "15px" }}
                          className="bg-red-700 text-white font-bold text-xs uppercase px-2.5 py-0.5 rounded-[15px] border border-red-800 shadow-none inline-flex items-center"
                        >
                          {label} ({count}x)
                        </span>
                      );
                    })}
                  </div>
                </div>
              <Button 
                variant="ghost" 
                size="icon" 
                style={{ borderRadius: "15px" }}
                onClick={() => setRapidFoundWords([])}
                className="h-9 w-9 text-white hover:bg-white/20 rounded-[15px] transition-all active:scale-90 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* COMPLETO SUBTAB VIEW */}
        {activeSubTab === "completo" && (
          <div className="space-y-4">
            {/* If description is NOT generated and NOT loading: Show Input Screen */}
            {!rewriteResult && !rewriteLoading && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Submenu Header */}
                <div className="flex items-center justify-end pb-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSubTab("completo")}
                      type="button"
                      style={{ borderRadius: "15px" }}
                      className="py-1.5 px-4 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 bg-white text-black border border-slate-200 shadow-none rounded-[15px]"
                    >
                      <FileText className="w-3.5 h-3.5 text-black" />
                      Completo
                    </button>
                    <button
                      onClick={() => setActiveSubTab("rapido")}
                      type="button"
                      style={{ borderRadius: "15px" }}
                      className="py-1.5 px-4 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 bg-transparent border border-transparent shadow-none rounded-[15px]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      Simples
                    </button>
                  </div>
                </div>

                {/* Main Input Area */}
                <div className="space-y-4">
                  <Textarea 
                    className="h-[300px] min-h-[300px] w-full bg-white border border-slate-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-100 outline-none transition-all p-4 text-sm leading-relaxed overflow-y-auto resize-y placeholder:text-slate-400 shadow-none rounded-[15px]"
                    style={{ borderRadius: "15px" }}
                    value={safeOriginalDesc}
                    onChange={(e) => setOriginalDesc(e.target.value)}
                    placeholder="Enriqueça ou reescreva o texto do produto"
                  />

                  {/* Controls Row and Critical Alert */}
                  <div className="flex flex-col md:flex-row items-center gap-4 justify-between pt-1">
                    <div className="flex-1">
                      <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
                        <strong className="text-slate-400 font-bold">Atenção:</strong> esta ferramenta é apenas um apoio criativo. É obrigatório revisar todas as informações geradas antes de publicar no site. Confira dados técnicos, medidas, peso, voltagem, capacidade, material, marca, modelo e possíveis divergências com catálogo, fornecedor ou ficha técnica. Evite informações inventadas, promessas comerciais exageradas ou atributos não confirmados.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleRewrite}
                      disabled={rewriteLoading || !safeOriginalDesc.trim() || hasFrete}
                      style={{ borderRadius: "15px" }}
                      className={`w-full md:w-64 h-11 text-white font-black rounded-[15px] shadow-none border border-slate-200 transition-all active:scale-[0.98] disabled:opacity-70 uppercase tracking-tight shrink-0 ${
                        hasFrete 
                          ? 'bg-red-600 hover:bg-red-600 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {rewriteLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : hasFrete ? (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Bloqueado por "Frete"
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Melhorar descrição
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Secondary Info before generating (Restricted Terms if found in input) */}
                {safeFoundWords.length > 0 && (
                  <Card className="border border-slate-200 shadow-none overflow-hidden rounded-[15px]" style={{ borderRadius: "15px" }}>
                    <CardHeader className="p-3.5 pb-1">
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-red-600">Termos Restritos Encontrados na Entrada</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3.5 pt-1">
                      <ScrollArea className="h-[100px] pr-4">
                        <div className="flex flex-wrap gap-2">
                          {safeFoundWords.map((word, i) => (
                            <Badge 
                              key={i} 
                              variant="destructive"
                              style={{ borderRadius: "15px" }}
                              className="text-[10px] py-1.5 px-3 rounded-[15px] transition-all duration-300 font-bold uppercase tracking-wider bg-red-600 text-white border border-red-700 shadow-none hover:bg-red-700"
                            >
                              {word} ({safeWordCounts[word] || 1}x)
                            </Badge>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Loading State: Hidden input, showing full generator loader */}
            {rewriteLoading && (
              <div className="space-y-4 py-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <div>
                      <h3 className="text-base font-black text-slate-800">Gerando descrição completa e estruturada...</h3>
                      <p className="text-xs text-slate-500 transition-all duration-300">
                        {COMPLETO_LOADING_STATUSES[loadingStatusIndex]}
                      </p>
                    </div>
                  </div>
                </div>
                <Skeleton style={{ borderRadius: "15px" }} className="h-[250px] w-full rounded-[15px] bg-gray-100 shadow-none border border-slate-200" />
                <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton style={{ borderRadius: "15px" }} className="h-[180px] w-full rounded-[15px] bg-gray-100 shadow-none border border-slate-200" />
                  <Skeleton style={{ borderRadius: "15px" }} className="h-[180px] w-full rounded-[15px] bg-gray-100 shadow-none border border-slate-200" />
                </div>
              </div>
            )}

            {/* Generated Content: Hidden input screen, showing ONLY generated content and button to generate new description */}
            {rewriteResult && !rewriteLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2.5 pb-2 animate-in fade-in duration-300"
              >
                {/* 1. TEXTO PRINCIPAL (SAÍDA 1 - Completo) */}
                <Card style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white overflow-hidden">
                  <CardHeader className="p-3.5 sm:px-4 sm:py-2.5 bg-white">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <CardTitle className="text-lg sm:text-xl font-black tracking-tight">Descrição completa</CardTitle>
                      </div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Button 
                          onClick={handleResetCompleto}
                          variant="outline"
                          style={{ borderRadius: "15px" }}
                          className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-[15px] shadow-none border border-slate-200 flex items-center gap-1.5 transition-all active:scale-95 shrink-0 text-xs sm:text-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          Gerar novamente
                        </Button>

                        <div className="relative">
                          <Button 
                            variant="outline" 
                            style={{ borderRadius: "15px" }}
                            className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-[15px] shadow-none border border-slate-200 flex items-center gap-1.5 transition-all active:scale-95 shrink-0 text-xs sm:text-sm" 
                            onClick={() => {
                              navigator.clipboard.writeText(rewriteResult.formattedDesc || "");
                              setCopyAlert(true);
                              setTimeout(() => setCopyAlert(false), 2000);
                            }}
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            Copiar
                          </Button>
                          
                          <AnimatePresence>
                            {copyAlert && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                style={{ borderRadius: "15px" }}
                                className="absolute top-full right-0 mt-2 z-50 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-[15px] shadow-none border border-slate-200 flex items-center gap-2 whitespace-nowrap"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Copiado com sucesso!
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3.5 sm:px-4 sm:pb-3.5 pt-0">
                    <div 
                      style={{ borderRadius: "15px", fontFamily: "'Roboto', sans-serif" }} 
                      className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap font-normal border-l-4 border-slate-300 pl-4 pr-4 bg-gray-50/50 py-3 rounded-[15px] border border-slate-200 overflow-x-auto min-h-[140px] shadow-none"
                    >
                      {rewriteResult.formattedDesc}
                    </div>
                  </CardContent>
                </Card>

                {/* Secondary Info (Keywords and Restricted Terms) - Posicionado embaixo do texto descrição gerado */}
                {((rewriteResult.seoKeywords && rewriteResult.seoKeywords.length > 0) || safeFoundWords.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {rewriteResult.seoKeywords && rewriteResult.seoKeywords.length > 0 && (
                      <Card style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white overflow-hidden">
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-xs font-black uppercase tracking-widest text-orange-600">Palavras-chave SEO</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                          <div className="flex flex-wrap gap-1.5">
                            {rewriteResult.seoKeywords.map((tag, i) => (
                              <span 
                                key={i} 
                                className="bg-transparent text-slate-700 border-0 text-[11px] px-2 py-0.5 font-bold uppercase tracking-wide"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {safeFoundWords.length > 0 && (
                      <Card style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white overflow-hidden">
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-xs font-black uppercase tracking-widest text-red-600">Termos Restritos Encontrados</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                          <ScrollArea className="h-[90px] pr-4">
                            <div className="flex flex-wrap gap-1.5">
                              {safeFoundWords.map((word, i) => (
                                <Badge 
                                  key={i} 
                                  variant="destructive"
                                  style={{ borderRadius: "15px" }}
                                  className="text-[10px] py-1 px-2.5 rounded-[15px] transition-all duration-300 font-bold uppercase tracking-wider bg-red-600 text-white border border-red-700 shadow-none hover:bg-red-700"
                                >
                                  {word} ({safeWordCounts[word] || 1}x)
                                </Badge>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Meta Descrição Google (Type Description) */}
                <Card style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white overflow-hidden">
                  <CardHeader className="p-3 sm:px-4 sm:py-2.5 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <CardDescription className="text-gray-400 font-medium text-xs">Meta descrição otimizada para Google Search</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <AnimatePresence>
                          {typeDescAlert && (
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              style={{ borderRadius: "15px" }}
                              className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-1.5 rounded-[15px] shadow-none border border-slate-200"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold uppercase tracking-wider">Copiado!</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          style={{ borderRadius: "15px" }}
                          className="h-8 px-3 rounded-[15px] border border-slate-200 hover:bg-gray-50 flex items-center gap-1.5 transition-all active:scale-95 shadow-none text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(rewriteResult.typeDescription || "");
                            setTypeDescAlert(true);
                            setTimeout(() => setTypeDescAlert(false), 2000);
                          }}
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          Copiar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:px-4 sm:pb-3 pt-0">
                    <div className="text-gray-700 leading-relaxed text-sm font-medium font-sans">
                      {rewriteResult.typeDescription || "Meta descrição não disponível."}
                    </div>
                  </CardContent>
                </Card>

                {/* Dicas de Conteúdo (Insights) */}
                {Array.isArray(rewriteResult.tips) && rewriteResult.tips.length > 0 && (
                  <Card style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white overflow-hidden">
                    <CardHeader className="p-3 sm:px-4 sm:py-2.5 bg-white">
                      <div className="space-y-0.5">
                        <CardDescription className="text-slate-500 font-medium text-xs">O que falta na sua descrição para converter mais</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:px-4 sm:pb-3 pt-1">
                      <div className="grid md:grid-cols-2 gap-2.5">
                        {rewriteResult.tips.map((tip, index) => (
                          <div key={index} style={{ borderRadius: "15px" }} className="flex gap-2.5 p-2.5 bg-slate-50/70 rounded-[15px] transition-colors shadow-none">
                            <div style={{ borderRadius: "15px" }} className="flex-shrink-0 w-5 h-5 rounded-[15px] bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black shadow-none">
                              {index + 1}
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-snug">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Copy Comercial Gerada */}
                {rewriteResult.commercial && (
                  <section style={{ borderRadius: "15px" }} className="space-y-3 bg-white rounded-[15px] p-3.5 sm:p-4 border border-slate-200 shadow-none">
                    <div className="grid md:grid-cols-2 gap-3.5">
                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black">A Dor do Cliente</h4>
                          <p className="text-gray-700 leading-relaxed italic text-sm">"{rewriteResult.commercial.problem}"</p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black">A Solução AI</h4>
                          <p className="text-gray-700 leading-relaxed text-sm">{rewriteResult.commercial.solution}</p>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Contexto de Uso</h4>
                          <p className="text-gray-700 leading-relaxed text-sm">{rewriteResult.commercial.context}</p>
                        </div>
                        <div style={{ borderRadius: "15px" }} className="p-3 bg-slate-50 rounded-[15px] border border-slate-200 space-y-1 shadow-none">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Impacto de Venda</h4>
                          <p className="text-slate-900 leading-relaxed text-sm font-bold">{rewriteResult.commercial.benefit}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* 2. CARDS DE RESUMO */}
                {rewriteResult.summary && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {[
                        { title: "Problema", text: rewriteResult.summary.problem },
                        { title: "Solução", text: rewriteResult.summary.solution },
                        { title: "Benefícios", text: rewriteResult.summary.benefits },
                        { title: "Público/Local", text: rewriteResult.summary.target }
                      ].map((card, i) => (
                        <Card key={i} style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white">
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-xs font-bold tracking-tight text-gray-900">{card.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                              {card.text}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cross-Sell Section (Acimaq Focus) */}
                {Array.isArray(rewriteResult.crossSell) && rewriteResult.crossSell.length > 0 && (
                  <section style={{ borderRadius: "15px" }} className="bg-white rounded-[15px] p-3.5 sm:p-4 border border-slate-200 shadow-none space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      {rewriteResult.crossSell.map((item, i) => (
                        <div key={i} style={{ borderRadius: "15px" }} className="bg-slate-50 border border-slate-200 rounded-[15px] p-3.5 flex flex-col justify-between hover:bg-slate-100/70 transition-all group duration-300 shadow-none">
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold tracking-tight text-slate-800">{item.name}</h3>
                            <p className="text-slate-600 text-xs leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Bottom footer */}
                <div className="pt-2 pb-4 flex flex-col items-center gap-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">© 2026 CPA Studio Pro</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* RAPIDO / SIMPLES SUBTAB VIEW */}
        {activeSubTab === "rapido" && (
          <div className="space-y-4">
            {/* If rapid result is NOT generated and NOT loading: Show Input Screen */}
            {!rapidResult && !rapidLoading && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Submenu Header */}
                <div className="flex items-center justify-end pb-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSubTab("completo")}
                      type="button"
                      style={{ borderRadius: "15px" }}
                      className="py-1.5 px-4 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 bg-transparent border border-transparent shadow-none"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Completo
                    </button>
                    <button
                      onClick={() => setActiveSubTab("rapido")}
                      type="button"
                      style={{ borderRadius: "15px" }}
                      className="py-1.5 px-4 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 bg-white text-black border border-slate-200 shadow-none"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-black" />
                      Simples
                    </button>
                  </div>
                </div>

                {/* Input Form for Rapido */}
                <div className="space-y-4">
                  <Textarea 
                    className="h-[180px] min-h-[180px] w-full bg-white border border-slate-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-100 outline-none transition-all p-4 text-sm leading-relaxed overflow-y-auto resize-y placeholder:text-slate-400 shadow-none rounded-[15px]"
                    style={{ borderRadius: "15px" }}
                    value={rapidInput}
                    onChange={(e) => setRapidInput(e.target.value)}
                    placeholder="Enriqueça ou reescreva o texto do produto"
                  />

                  <div className="flex flex-col md:flex-row items-center gap-4 justify-between pt-1">
                    <div className="flex-1">
                      <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
                        <strong className="text-slate-400 font-bold">Atenção:</strong> esta ferramenta é apenas um apoio criativo. É obrigatório revisar todas as informações geradas antes de publicar no site. Confira dados técnicos, medidas, peso, voltagem, capacidade, material, marca, modelo e possíveis divergências com catálogo, fornecedor ou ficha técnica. Evite informações inventadas, promessas comerciais exageradas ou atributos não confirmados.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleRapidGenerate}
                      disabled={rapidLoading || !rapidInput.trim() || hasRapidFrete}
                      style={{ borderRadius: "15px" }}
                      className={`w-full md:w-64 h-11 text-white font-black rounded-[15px] shadow-none border border-slate-200 transition-all active:scale-[0.98] disabled:opacity-70 uppercase tracking-tight shrink-0 ${
                        hasRapidFrete 
                          ? 'bg-red-600 hover:bg-red-600 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {rapidLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : hasRapidFrete ? (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Bloqueado por "Frete"
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar Descrição Rápida
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state for Rapido */}
            {rapidLoading && (
              <div className="space-y-4 py-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    <div>
                      <h3 className="text-base font-black text-slate-800">Gerando parágrafo SEO rápido...</h3>
                      <p className="text-xs text-slate-500">Concatenando diferenciais técnicos e eliminando termos restritos</p>
                    </div>
                  </div>
                </div>
                <Skeleton style={{ borderRadius: "15px" }} className="h-[180px] w-full rounded-[15px] bg-gray-100 shadow-none border border-slate-200" />
              </div>
            )}

            {/* Results Area for Rapido: Hidden input screen, showing ONLY generated content and button to generate new */}
            {rapidResult && !rapidLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2.5 pb-2 animate-in fade-in duration-300"
              >
                {/* TEXTO SEO RAPIDO CARDS */}
                <Card style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white overflow-hidden">
                  <CardHeader className="p-3.5 sm:px-4 sm:py-2.5 bg-white">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <CardTitle className="text-lg sm:text-xl font-black tracking-tight font-sans">Descrição simples</CardTitle>
                      </div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Button 
                          onClick={handleResetRapido}
                          variant="outline"
                          style={{ borderRadius: "15px" }}
                          className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-[15px] shadow-none border border-slate-200 flex items-center gap-1.5 transition-all active:scale-95 shrink-0 text-xs sm:text-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          Gerar novamente
                        </Button>

                        <div className="relative">
                          <Button 
                            variant="outline" 
                            style={{ borderRadius: "15px" }}
                            className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-[15px] shadow-none border border-slate-200 flex items-center gap-1.5 transition-all active:scale-95 shrink-0 text-xs sm:text-sm" 
                            onClick={() => {
                              navigator.clipboard.writeText(rapidResult.seoParagraph || "");
                              setRapidCopyAlert(true);
                              setTimeout(() => setRapidCopyAlert(false), 2000);
                            }}
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            Copiar
                          </Button>

                          <AnimatePresence>
                            {rapidCopyAlert && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                style={{ borderRadius: "15px" }}
                                className="absolute top-full right-0 mt-2 z-50 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-[15px] shadow-none border border-slate-200 flex items-center gap-2 whitespace-nowrap"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Copiado com sucesso!
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3.5 sm:px-4 sm:pb-3.5 pt-0">
                    <div 
                      style={{ borderRadius: "15px", fontFamily: "'Roboto', sans-serif" }} 
                      className="text-gray-700 leading-relaxed text-sm font-normal border-l-4 border-indigo-200 pl-4 pr-4 bg-indigo-50/20 py-2.5 rounded-[15px] border border-slate-200 shadow-none"
                    >
                      {rapidResult.seoParagraph}
                    </div>

                    {/* Display restricted words block specifically inside the card if there are any */}
                    {Array.isArray(rapidResult.foundWords) && rapidResult.foundWords.length > 0 && (
                      <div style={{ borderRadius: "15px" }} className="mt-4 p-3 bg-red-50/50 rounded-[15px] border border-slate-200 space-y-1.5 shadow-none">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> Termos Restritos Encontrados na Entrada:
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {rapidResult.foundWords.map((word, i) => (
                            <Badge 
                              key={i} 
                              variant="destructive" 
                              style={{ borderRadius: "15px" }}
                              className="text-[10px] font-bold py-1 px-3 rounded-[15px] uppercase bg-red-600 text-white border border-red-700 shadow-none hover:bg-red-700"
                            >
                              {word} ({(rapidResult.wordCounts && rapidResult.wordCounts[word]) || 1}x)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bottom footer */}
                <div className="pt-2 pb-4 flex flex-col items-center gap-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">© 2026 CPA Studio Pro</p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
