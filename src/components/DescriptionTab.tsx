import React, { memo } from "react";
import { 
  Eraser, 
  Loader2, 
  CheckCircle2, 
  PlusCircle, 
  AlertCircle, 
  Lightbulb, 
  Sparkles, 
  Search, 
  X, 
  Upload, 
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
      <AnimatePresence>
        {activeSubTab === "completo" && !rewriteResult && showForbiddenAlert && safeFoundWords.length > 0 && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            style={{ borderRadius: "15px" }}
            className="sticky top-16 z-50 bg-red-600 text-white p-6 shadow-none rounded-[15px] mb-10 border border-slate-200 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[90px] rounded-full -mr-32 -mt-32 animate-pulse" />
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="flex items-center gap-5">
                <div style={{ borderRadius: "15px" }} className="w-14 h-14 bg-white/20 rounded-[15px] flex items-center justify-center border border-white/20 shadow-none">
                  <AlertCircle className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Termos Restritos Detectados!</h3>
                  <p className="text-sm font-medium text-red-50/90 leading-relaxed max-w-3xl">
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
                          className="bg-red-700 text-white font-bold text-xs uppercase px-3 py-1 rounded-[15px] border border-red-800 shadow-none inline-flex items-center"
                        >
                          {label} ({count}x)
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                style={{ borderRadius: "15px" }}
                onClick={() => setShowForbiddenAlert(false)}
                className="h-12 w-12 text-white hover:bg-white/20 rounded-[15px] transition-all active:scale-90 flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </motion.div>
        )}

        {activeSubTab === "rapido" && !rapidResult && rapidFoundWords.length > 0 && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            style={{ borderRadius: "15px" }}
            className="sticky top-16 z-50 bg-red-600 text-white p-6 shadow-none rounded-[15px] mb-10 border border-slate-200 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[90px] rounded-full -mr-32 -mt-32 animate-pulse" />
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="flex items-center gap-5">
                <div style={{ borderRadius: "15px" }} className="w-14 h-14 bg-white/20 rounded-[15px] flex items-center justify-center border border-white/20 shadow-none">
                  <AlertCircle className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Termos Restritos Detectados na Geração Rápida!</h3>
                  <p className="text-sm font-medium text-red-50/90 leading-relaxed max-w-3xl">
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
                          className="bg-red-700 text-white font-bold text-xs uppercase px-3 py-1 rounded-[15px] border border-red-800 shadow-none inline-flex items-center"
                        >
                          {label} ({count}x)
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                style={{ borderRadius: "15px" }}
                onClick={() => setRapidFoundWords([])}
                className="h-12 w-12 text-white hover:bg-white/20 rounded-[15px] transition-all active:scale-90 flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {/* COMPLETO SUBTAB VIEW */}
        {activeSubTab === "completo" && (
          <div className="space-y-6">
            {/* If description is NOT generated and NOT loading: Show Input Screen */}
            {!rewriteResult && !rewriteLoading && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Submenu Header */}
                <div className="flex items-center justify-end pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSubTab("completo")}
                      type="button"
                      style={{ borderRadius: "15px" }}
                      className="py-2 px-5 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 bg-white text-black border border-slate-200 shadow-none rounded-[15px]"
                    >
                      <FileText className="w-3.5 h-3.5 text-black" />
                      Completo
                    </button>
                    <button
                      onClick={() => setActiveSubTab("rapido")}
                      type="button"
                      style={{ borderRadius: "15px" }}
                      className="py-2 px-5 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 bg-transparent border border-transparent shadow-none rounded-[15px]"
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
                    <CardHeader className="p-6 pb-3 border-b border-slate-200">
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-red-600">Termos Restritos Encontrados na Entrada</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
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
              <div className="space-y-6 py-8 animate-in fade-in duration-300">
                <div style={{ borderRadius: "15px" }} className="flex items-center justify-between p-6 bg-blue-50/60 border border-slate-200 rounded-[15px] shadow-none">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <div>
                      <h3 className="text-base font-black text-slate-800">Gerando descrição completa e estruturada...</h3>
                      <p className="text-xs text-slate-500">Aplicando diretrizes técnicas, copy comercial e otimizações de SEO</p>
                    </div>
                  </div>
                </div>
                <Skeleton style={{ borderRadius: "15px" }} className="h-[350px] w-full rounded-[15px] bg-gray-100 shadow-none border border-slate-200" />
                <div className="grid md:grid-cols-2 gap-6">
                  <Skeleton style={{ borderRadius: "15px" }} className="h-[250px] w-full rounded-[15px] bg-gray-100 shadow-none border border-slate-200" />
                  <Skeleton style={{ borderRadius: "15px" }} className="h-[250px] w-full rounded-[15px] bg-gray-100 shadow-none border border-slate-200" />
                </div>
              </div>
            )}

            {/* Generated Content: Hidden input screen, showing ONLY generated content and button to generate new description */}
            {rewriteResult && !rewriteLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 pb-12 animate-in fade-in duration-300"
              >
                {/* Header with button to generate a new description */}
                <div style={{ borderRadius: "15px" }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-[15px] border border-slate-200 shadow-none">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" /> Descrição Gerada com Sucesso
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Revise o conteúdo gerado e copie para o seu anúncio ou catálogo</p>
                  </div>
                  <Button 
                    onClick={handleResetCompleto}
                    style={{ borderRadius: "15px" }}
                    className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[15px] shadow-none border border-slate-200 flex items-center gap-2 transition-all active:scale-95 shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Gerar Nova Descrição
                  </Button>
                </div>

                {/* Secondary Info (Keywords and Restricted Terms) */}
                {((rewriteResult.seoKeywords && rewriteResult.seoKeywords.length > 0) || safeFoundWords.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rewriteResult.seoKeywords && rewriteResult.seoKeywords.length > 0 && (
                      <Card style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white overflow-hidden">
                        <CardHeader className="p-6 pb-3 border-b border-slate-200">
                          <CardTitle className="text-xs font-black uppercase tracking-widest text-orange-600">Palavras-chave SEO</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="flex flex-wrap gap-2">
                            {rewriteResult.seoKeywords.map((tag, i) => (
                              <Badge key={i} style={{ borderRadius: "15px" }} className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-3.5 py-1.5 rounded-[15px] shadow-none hover:bg-slate-200 transition-colors uppercase font-bold">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {safeFoundWords.length > 0 && (
                      <Card style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white overflow-hidden">
                        <CardHeader className="p-6 pb-3 border-b border-slate-200">
                          <CardTitle className="text-xs font-black uppercase tracking-widest text-red-600">Termos Restritos Encontrados</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ScrollArea className="h-[90px] pr-4">
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

                {/* 1. TEXTO PRINCIPAL (SAÍDA 1 - Completo) */}
                <Card style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white overflow-hidden">
                  <CardHeader className="p-8 border-b border-slate-200 bg-gradient-to-r from-orange-50/50 to-white">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div style={{ borderRadius: "15px" }} className="w-10 h-10 bg-orange-600 rounded-[15px] flex items-center justify-center border border-slate-200 shadow-none">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-black tracking-tight">Descrição Completa Formatada</CardTitle>
                          <CardDescription className="text-xs font-medium text-gray-400 uppercase tracking-widest">Saída 1 - Formato Técnico B2B</CardDescription>
                        </div>
                      </div>
                      <div className="relative">
                        <Button 
                          variant="default" 
                          size="lg" 
                          style={{ borderRadius: "15px" }}
                          className="rounded-[15px] h-11 px-7 font-black bg-blue-600 hover:bg-blue-700 text-white shadow-none border border-slate-200 transition-all active:scale-95" 
                          onClick={() => {
                            navigator.clipboard.writeText(rewriteResult.formattedDesc || "");
                            setCopyAlert(true);
                            setTimeout(() => setCopyAlert(false), 2000);
                          }}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          COPIAR DESCRIÇÃO
                        </Button>
                        
                        <AnimatePresence>
                          {copyAlert && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              style={{ borderRadius: "15px" }}
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-[15px] shadow-none border border-slate-200 flex items-center gap-2 whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Copiado com sucesso!
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div style={{ borderRadius: "15px" }} className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap font-mono border-l-4 border-orange-200 pl-6 bg-gray-50/50 py-6 rounded-[15px] border border-slate-200 overflow-x-auto min-h-[350px] shadow-none">
                      {rewriteResult.formattedDesc}
                    </div>
                  </CardContent>
                </Card>

                {/* Meta Descrição Google (Type Description) */}
                <Card style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white overflow-hidden">
                  <CardHeader className="p-8 pb-5 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div style={{ borderRadius: "15px" }} className="w-11 h-11 bg-emerald-50 rounded-[15px] flex items-center justify-center border border-slate-200 shadow-none">
                          <Search className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="space-y-0.5">
                          <CardTitle className="text-xl font-black tracking-tight">Type Description</CardTitle>
                          <CardDescription className="text-gray-400 font-medium text-xs">Meta descrição otimizada para Google Search</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <AnimatePresence>
                          {typeDescAlert && (
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              style={{ borderRadius: "15px" }}
                              className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-[15px] shadow-none border border-slate-200"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-wider">Copiado!</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          style={{ borderRadius: "15px" }}
                          className="h-10 px-5 rounded-[15px] border border-slate-200 hover:bg-gray-50 flex items-center gap-2 transition-all active:scale-95 shadow-none"
                          onClick={() => {
                            navigator.clipboard.writeText(rewriteResult.typeDescription || "");
                            setTypeDescAlert(true);
                            setTimeout(() => setTypeDescAlert(false), 2000);
                          }}
                        >
                          <Upload className="w-4 h-4 rotate-180" />
                          Copiar Texto
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div style={{ borderRadius: "15px" }} className="text-gray-700 leading-relaxed text-sm font-medium font-sans border-l-4 border-emerald-200 pl-6 bg-emerald-50/20 py-4 rounded-[15px] border border-slate-200 shadow-none">
                      {rewriteResult.typeDescription || "Meta descrição não disponível."}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                       <div className="w-1.5 h-1.5 rounded-lg bg-emerald-500 animate-pulse" />
                       {(rewriteResult.typeDescription || "").length}/150 Caracteres
                    </div>
                  </CardContent>
                </Card>

                {/* Dicas de Conteúdo (Insights) */}
                {Array.isArray(rewriteResult.tips) && rewriteResult.tips.length > 0 && (
                  <Card style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white overflow-hidden">
                    <CardHeader className="p-8 pb-5 border-b border-slate-200">
                      <div className="flex items-center gap-4">
                        <div style={{ borderRadius: "15px" }} className="w-11 h-11 bg-indigo-100 rounded-[15px] flex items-center justify-center border border-slate-200 shadow-none">
                          <Lightbulb className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="space-y-0.5">
                          <CardTitle className="text-xl font-black tracking-tight text-slate-800">Dicas e Insights de Mercado</CardTitle>
                          <CardDescription className="text-slate-500 font-medium text-xs">O que falta na sua descrição para converter mais</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        {rewriteResult.tips.map((tip, index) => (
                          <div key={index} style={{ borderRadius: "15px" }} className="flex gap-4 p-4 bg-white rounded-[15px] border border-slate-200 hover:border-indigo-200 transition-colors shadow-none">
                            <div style={{ borderRadius: "15px" }} className="flex-shrink-0 w-6 h-6 rounded-[15px] bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black border border-indigo-100 shadow-none">
                              {index + 1}
                            </div>
                            <p className="text-sm font-medium text-slate-600 leading-snug">{tip}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ borderRadius: "15px" }} className="mt-6 p-4 bg-indigo-50/50 rounded-[15px] border border-slate-200 flex items-start gap-3 shadow-none">
                        <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5" />
                        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                          Baseado em tendências de busca e dúvidas comuns em marketplaces brasileiros.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Copy Comercial Gerada */}
                {rewriteResult.commercial && (
                  <section style={{ borderRadius: "15px" }} className="space-y-6 bg-white rounded-[15px] p-8 border border-slate-200 shadow-none">
                    <div className="flex items-center gap-3">
                      <div style={{ borderRadius: "15px" }} className="w-9 h-9 bg-blue-50 rounded-[15px] flex items-center justify-center border border-slate-200 shadow-none">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-black tracking-tight">Copy Comercial Gerada</h2>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">A Dor do Cliente</h4>
                          <p className="text-gray-700 leading-relaxed italic text-sm">"{rewriteResult.commercial.problem}"</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">A Solução AI</h4>
                          <p className="text-gray-700 leading-relaxed text-sm">{rewriteResult.commercial.solution}</p>
                        </div>
                      </div>
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Contexto de Uso</h4>
                          <p className="text-gray-700 leading-relaxed text-sm">{rewriteResult.commercial.context}</p>
                        </div>
                        <div style={{ borderRadius: "15px" }} className="p-5 bg-orange-50 rounded-[15px] border border-slate-200 space-y-1.5 shadow-none">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Impacto de Venda</h4>
                          <p className="text-orange-900 leading-relaxed text-sm font-bold">{rewriteResult.commercial.benefit}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* 2. CARDS DE RESUMO */}
                {rewriteResult.summary && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 pl-2">Resumo Estruturado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { title: "Problema", text: rewriteResult.summary.problem, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
                        { title: "Solução", text: rewriteResult.summary.solution, icon: Lightbulb, color: "text-amber-600", bg: "bg-amber-50" },
                        { title: "Benefícios", text: rewriteResult.summary.benefits, icon: Sparkles, color: "text-blue-600", bg: "bg-blue-50" },
                        { title: "Público/Local", text: rewriteResult.summary.target, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" }
                      ].map((card, i) => (
                        <Card key={i} style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white">
                          <CardHeader className="p-5 pb-2">
                            <div style={{ borderRadius: "15px" }} className={`w-8 h-8 ${card.bg} rounded-[15px] flex items-center justify-center mb-2 border border-slate-200 shadow-none`}>
                              <card.icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                            <CardTitle className="text-sm font-bold tracking-tight text-gray-900">{card.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-5 pt-1">
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
                  <section style={{ borderRadius: "15px" }} className="bg-slate-900 rounded-[15px] p-8 md:p-10 text-white space-y-8 overflow-hidden relative border border-slate-200 shadow-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-lg -mr-32 -mt-32" />
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center gap-3 text-blue-400 mb-2">
                        <ShoppingBag className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Compre Junto Acimaq</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 relative z-10">
                      {rewriteResult.crossSell.map((item, i) => (
                        <div key={i} style={{ borderRadius: "15px" }} className="bg-white/5 backdrop-blur-sm border border-slate-200 rounded-[15px] p-6 flex flex-col justify-between hover:bg-white/10 transition-all group duration-300 shadow-none">
                          <div className="space-y-3">
                            <div style={{ borderRadius: "15px" }} className="w-10 h-10 bg-blue-600 rounded-[15px] flex items-center justify-center mb-2 shadow-none border border-slate-200">
                              <PlusCircle className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold tracking-tight">{item.name}</h3>
                            <p className="text-gray-400 text-xs leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Bottom action button to generate a new description */}
                <div className="pt-6 pb-12 flex flex-col items-center gap-4">
                  <Button 
                    onClick={handleResetCompleto}
                    size="lg"
                    style={{ borderRadius: "15px" }}
                    className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[15px] shadow-none border border-slate-200 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Gerar Nova Descrição
                  </Button>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">© 2026 CPA Studio Pro</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* RAPIDO / SIMPLES SUBTAB VIEW */}
        {activeSubTab === "rapido" && (
          <div className="space-y-6">
            {/* If rapid result is NOT generated and NOT loading: Show Input Screen */}
            {!rapidResult && !rapidLoading && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Submenu Header */}
                <div className="flex items-center justify-end pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSubTab("completo")}
                      type="button"
                      style={{ borderRadius: "20px" }}
                      className="py-2 px-5 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 bg-transparent border border-transparent shadow-none"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Completo
                    </button>
                    <button
                      onClick={() => setActiveSubTab("rapido")}
                      type="button"
                      style={{ borderRadius: "20px" }}
                      className="py-2 px-5 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 bg-white text-black border border-slate-200 shadow-none"
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
              <div className="space-y-6 py-8 animate-in fade-in duration-300">
                <div style={{ borderRadius: "15px" }} className="flex items-center justify-between p-6 bg-indigo-50/60 border border-slate-200 rounded-[15px] shadow-none">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <div>
                      <h3 className="text-base font-black text-slate-800">Gerando parágrafo SEO rápido...</h3>
                      <p className="text-xs text-slate-500">Concatenando diferenciais técnicos e eliminando termos restritos</p>
                    </div>
                  </div>
                </div>
                <Skeleton style={{ borderRadius: "15px" }} className="h-[220px] w-full rounded-[15px] bg-gray-100 shadow-none border border-slate-200" />
              </div>
            )}

            {/* Results Area for Rapido: Hidden input screen, showing ONLY generated content and button to generate new */}
            {rapidResult && !rapidLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 pb-12 animate-in fade-in duration-300"
              >
                {/* Header with button to generate a new description */}
                <div style={{ borderRadius: "15px" }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-[15px] border border-slate-200 shadow-none">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" /> Descrição Rápida Gerada com Sucesso
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Parágrafo único otimizado para marketplaces e e-commerce</p>
                  </div>
                  <Button 
                    onClick={handleResetRapido}
                    style={{ borderRadius: "15px" }}
                    className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-[15px] shadow-none border border-slate-200 flex items-center gap-2 transition-all active:scale-95 shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Gerar Nova Descrição
                  </Button>
                </div>

                {/* TEXTO SEO RAPIDO CARDS */}
                <Card style={{ borderRadius: "15px" }} className="border border-slate-200 shadow-none rounded-[15px] bg-white overflow-hidden">
                  <CardHeader className="p-8 border-b border-slate-200 bg-gradient-to-r from-blue-50/50 to-white">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div style={{ borderRadius: "15px" }} className="w-10 h-10 bg-indigo-600 rounded-[15px] flex items-center justify-center border border-slate-200 shadow-none">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-black tracking-tight font-sans">Descrição Simples com SEO</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <CardDescription className="text-xs font-medium text-gray-400 uppercase tracking-widest font-sans">Opção Rápida - Parágrafo Único</CardDescription>
                            <Badge variant="outline" style={{ borderRadius: "15px" }} className={`text-[9px] px-2 py-0.5 border border-slate-200 rounded-[15px] font-bold shadow-none ${(rapidResult.seoParagraph || "").length > 800 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                              {(rapidResult.seoParagraph || "").length}/800 chars
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="lg" 
                          style={{ borderRadius: "15px" }}
                          className="rounded-[15px] h-11 px-7 font-black border border-slate-200 hover:bg-indigo-50 text-indigo-600 transition-all active:scale-95 shadow-none" 
                          onClick={() => {
                            navigator.clipboard.writeText(rapidResult.seoParagraph || "");
                            setRapidCopyAlert(true);
                            setTimeout(() => setRapidCopyAlert(false), 2000);
                          }}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          COPIAR SEO
                        </Button>

                        <AnimatePresence>
                          {rapidCopyAlert && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              style={{ borderRadius: "15px" }}
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-[15px] shadow-none border border-slate-200 flex items-center gap-2 whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Copiado com sucesso!
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div style={{ borderRadius: "15px" }} className="text-gray-700 leading-relaxed text-sm font-medium font-sans border-l-4 border-indigo-200 pl-6 bg-indigo-50/20 py-4 rounded-[15px] border border-slate-200 shadow-none">
                      {rapidResult.seoParagraph}
                    </div>

                    {/* Display restricted words block specifically inside the card if there are any */}
                    {Array.isArray(rapidResult.foundWords) && rapidResult.foundWords.length > 0 && (
                      <div style={{ borderRadius: "15px" }} className="mt-6 p-4 bg-red-50/50 rounded-[15px] border border-slate-200 space-y-2 shadow-none">
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

                {/* Bottom button for convenience */}
                <div className="pt-6 pb-12 flex flex-col items-center gap-4">
                  <Button 
                    onClick={handleResetRapido}
                    size="lg"
                    style={{ borderRadius: "15px" }}
                    className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-[15px] shadow-none border border-slate-200 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Gerar Nova Descrição
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
