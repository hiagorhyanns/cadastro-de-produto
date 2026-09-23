import React, { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Ruler, 
  Weight, 
  FileText, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Image as ImageIcon,
  ShoppingBag,
  ArrowRight,
  PlusCircle,
  Eraser,
  MessageSquare,
  Users,
  Target,
  Lightbulb,
  X,
  Monitor,
  MousePointer2,
  Bookmark,
  Wrench,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EcommerceTeamLogo } from "@/components/EcommerceTeamLogo";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { rewriteDescription, generateSEOTitle, type RewriteResult, type SEOResult } from "./lib/gemini";
import { resizeAndCompressImage } from "./lib/imageCompressor";
import { useImageGeneration } from "./contexts/ImageGenerationContext";
import { SEOTab } from "./components/SEOTab";
import { DescriptionTab } from "./components/DescriptionTab";
import { ImageTab } from "./components/ImageTab";
import { PromptSaverTab } from "./components/PromptSaverTab";
import { ToolsTab } from "./components/ToolsTab";
import { TreinamentoTab } from "./components/TreinamentoTab";
import { ErrorBoundary } from "./components/ErrorBoundary";

const VALID_TABS = ["seo", "formatar", "imagem", "prompts", "ferramentas", "treinamento"];
const TAB_STORAGE_KEY = "cpa_last_active_tab";

function getStoredTab(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    if (urlTab && VALID_TABS.includes(urlTab)) {
      return urlTab;
    }
    const hash = window.location.hash.replace("#", "").split("?")[0].replace("tab=", "");
    if (hash && VALID_TABS.includes(hash)) {
      return hash;
    }
    const cached = localStorage.getItem(TAB_STORAGE_KEY);
    if (cached && VALID_TABS.includes(cached)) {
      return cached;
    }
  } catch (e) {
    console.error("Error reading stored tab:", e);
  }
  return "seo";
}

const FORBIDDEN_WORDS = [
  "vitrine", "pitão", "paralelo", "profissional", "garantido", "garantem", "couro", "q/d", "wind", "mel", "imbuia", 
  "linguiça", "bbs", "bbs 2", "vaporizador", "esferas", "window", "estrado", "original", "grátis", "100% grátis", 
  "gratuito", "gratuitamente", "garantia", "satisfação garantida", "garantia da loja", "imbatível", "novo", "usado", 
  "entrega rápida", "entrega em x dias", "clique aqui", "veja mais", "acesse nosso site", "whatsapp", "atendimento personalizado", 
  "link na bio", "link externo", "homologado por", "compatível com marca concorrente", "tipo marca concorrente", 
  "desconto", "frete grátis", "promoção", "oferta", "melhor do mercado", "top de linha", "mais vendido", 
  "campeão de vendas", "imperdível", "exclusivo", "aceitamos troca", "sem juros", "melhor preço", "super promoção", 
  "testado e aprovado", "produto líder", "aprovado por especialistas", "produto exclusivo", "de fábrica", "direto da fábrica",
  "frete"
];

export default function App() {
  const [activeTab, setActiveTabState] = React.useState<string>(getStoredTab);

  const setActiveTab = React.useCallback((tab: string) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, tab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      if (tab !== "treinamento" && tab !== "prompts") {
        url.searchParams.delete("sub");
      }
      window.history.replaceState({}, "", url.toString());
    } catch (e) {
      console.error("Error persisting tab:", e);
    }
  }, []);

  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("tab")) {
        url.searchParams.set("tab", activeTab);
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {
      console.error("Error syncing tab to URL:", e);
    }
  }, [activeTab]);
  
  // Image Generation State from Context
  const { 
    loading: imageLoading, 
    result: imageResult, 
    error: imageError, 
    preview, 
    setPreview, 
    filename,
    setFilename,
    formData: imageFormData, 
    setFormData: setImageFormData, 
    startGeneration,
    clearResult: clearImageResult,
    quotaError,
    setQuotaError
  } = useImageGeneration();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Menu 2 States
  const [originalDesc, setOriginalDesc] = React.useState("");
  const [rewriteLoading, setRewriteLoading] = React.useState(false);
  const [rewriteResult, setRewriteResult] = React.useState<RewriteResult | null>(null);
  const [foundWords, setFoundWords] = React.useState<string[]>([]);
  const [wordCounts, setWordCounts] = React.useState<{ [key: string]: number }>({});
  const [copyAlert, setCopyAlert] = React.useState(false);
  const [typeDescAlert, setTypeDescAlert] = React.useState(false);
  const [showForbiddenAlert, setShowForbiddenAlert] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<{url: string, id: number} | null>(null);
  const [formatarMedidas, setFormatarMedidas] = React.useState({
    altura: "",
    largura: "",
    profundidade: "",
    peso: ""
  });

  // Menu 3 (SEO Generator) States
  const [seoFormData, setSeoFormData] = React.useState({
    name: "",
    model: "",
    voltage: "",
    brand: "",
    differentials: "",
    currentTitle: ""
  });
  const [seoLoading, setSeoLoading] = React.useState(false);
  const [seoResult, setSeoResult] = React.useState<SEOResult | null>(null);
  const [seoCopyAlert, setSeoCopyAlert] = React.useState(false);

  const [filenameCopyAlert, setFilenameCopyAlert] = React.useState<number | null>(null);
  const [uploadFilenameCopyAlert, setUploadFilenameCopyAlert] = React.useState(false);

  const handleDownload = React.useCallback((url: string, filename: string) => {
    // Ensure filename always uses .jpg as requested
    const jpgFilename = filename.replace(/\.[^/.]+$/, "") + ".jpg";
    const link = document.createElement("a");
    link.href = url;
    link.download = jpgFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  React.useEffect(() => {
    if (!originalDesc.trim()) {
      setFoundWords([]);
      setWordCounts({});
      setShowForbiddenAlert(false);
      return;
    }

    const counts: { [key: string]: number } = {};
    const found: string[] = [];
    
    // Normalize text: remove accents for matching if needed, or just be careful
    // For now, let's just make it case insensitive and handles some common variations
    const normalizedText = originalDesc.toLowerCase();

    FORBIDDEN_WORDS.forEach(word => {
      // Create a regex that is a bit more flexible but still word-boundary based
      // Escaping for regex and handling slashes
      const escapedWord = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/');
      const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
      const matches = normalizedText.match(regex);
      
      if (matches) {
        counts[word] = matches.length;
        found.push(word);
      }
    });

    setFoundWords(found);
    setWordCounts(counts);
    
    // Auto-show alert if words found for the first time or if already showing
    if (found.length > 0) {
      setShowForbiddenAlert(true);
    } else {
      setShowForbiddenAlert(false);
    }
  }, [originalDesc]);

  const handleFileChange = React.useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Remove a extensão do nome do arquivo (ex: foto.jpg -> foto)
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setFilename(nameWithoutExtension);
      resizeAndCompressImage(file)
        .then((compressedBase64) => {
          setPreview(compressedBase64);
        })
        .catch((err) => {
          console.error("Erro ao comprimir imagem:", err);
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
    }
  }, [setFilename, setPreview]);

  const handleSubmit = React.useCallback(async (
    e: FormEvent, 
    mode: 'principal' | 'ambientada' | 'beneficios' | 'publicitaria' | 'medidas' | 'outros' | 'componentes' | 'cor' = 'principal',
    extra?: { imageTecnico?: string | null; mimeTypeTecnico?: string | null; detalhesTecnicos?: string }
  ) => {
    e.preventDefault();
    if (imageResult) {
      clearImageResult();
    }
    await startGeneration(mode, extra);
  }, [imageResult, clearImageResult, startGeneration]);

  const handleRewrite = React.useCallback(async () => {
    if (!originalDesc.trim()) return;
    if (/\bfrete\b/i.test(originalDesc)) {
      alert("A palavra 'Frete' é proibida na Via Varejo. Geração bloqueada até que o termo seja removido.");
      return;
    }
    setRewriteLoading(true);
    setShowForbiddenAlert(false);
    try {
      const res = await rewriteDescription({
        originalText: originalDesc,
        forbiddenWords: FORBIDDEN_WORDS,
        productName: seoFormData.name,
        model: seoFormData.model,
        brand: seoFormData.brand,
        voltage: seoFormData.voltage,
        differentials: seoFormData.differentials,
        altura: formatarMedidas.altura,
        largura: formatarMedidas.largura,
        profundidade: formatarMedidas.profundidade,
        peso: formatarMedidas.peso
      });
      setRewriteResult(res);
    } catch (err: any) {
      console.error(err);
      const isQuota = err?.message?.includes("429") || 
                     err?.message?.includes("quota") || 
                     err?.message?.includes("QUOTA_EXCEEDED") ||
                     err?.message?.includes("Limite de geração") ||
                     err?.status === 429;
      if (isQuota) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 15);
        const retryTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setQuotaError({ exceeded: true, retryTime });
      } else if (err?.message?.includes("503") || err?.message?.includes("demand") || err?.status === 503) {
        alert("O servidor está muito ocupado no momento (alta demanda). Por favor, tente novamente em alguns instantes.");
      } else if (err?.message?.includes("API key expired") || err?.message?.includes("INVALID_ARGUMENT")) {
        alert("Chave de API expirada ou inválida. Por favor, verifique as configurações da AI Studio.");
      } else {
        alert("Ocorreu um erro ao reescrever a descrição. Tente novamente.");
      }
    } finally {
      setRewriteLoading(false);
    }
  }, [originalDesc, foundWords.length, setQuotaError]);

  const handleSEOGenerate = React.useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!seoFormData.name || !seoFormData.brand) {
      return;
    }
    setSeoLoading(true);
    try {
      const res = await generateSEOTitle(seoFormData);
      setSeoResult(res);
    } catch (err: any) {
      console.error(err);
      const isQuota = err?.message?.includes("429") || 
                     err?.message?.includes("quota") || 
                     err?.message?.includes("QUOTA_EXCEEDED") ||
                     err?.message?.includes("Limite de geração") ||
                     err?.status === 429;
      if (isQuota) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 15);
        const retryTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setQuotaError({ exceeded: true, retryTime });
      } else if (err?.message?.includes("503") || err?.message?.includes("demand") || err?.status === 503) {
        alert("O servidor está muito ocupado no momento (alta demanda). Por favor, tente novamente em alguns instantes.");
      } else if (err?.message?.includes("API key expired") || err?.message?.includes("INVALID_ARGUMENT")) {
        alert("Chave de API expirada ou inválida. Por favor, verifique as configurações da AI Studio.");
      } else {
        alert("Ocorreu um erro ao gerar o SEO. Tente novamente.");
      }
    } finally {
      setSeoLoading(false);
    }
  }, [seoFormData, setQuotaError]);

  return (
    <div className="min-h-screen bg-slate-50/50 text-[#1A1A1A] font-sans selection:bg-orange-100 pb-4">
      {/* Modern Professional Header */}
      <header className="w-full border-b border-blue-700 bg-blue-600 backdrop-blur-xl shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2 lg:gap-4">
            {/* Brand Logo & Name */}
            <div className="flex items-center shrink-0">
              <button 
                onClick={() => setActiveTab("seo")} 
                className="flex items-center focus:outline-none py-0.5"
                title="Cadastro de Produto"
              >
                <img 
                  src="/logo-cadastro-de-produto.png?v=3" 
                  alt="Cadastro de Produto" 
                  className="h-10 sm:h-12 md:h-14 w-auto max-w-[220px] sm:max-w-[280px] md:max-w-[340px] object-contain select-none"
                  referrerPolicy="no-referrer"
                />
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center tracking-tight min-width-0 flex-1 justify-center max-w-fit">
              <button 
                onClick={() => setActiveTab("seo")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-4 xl:px-6 py-2 rounded-lg text-[11px] lg:text-[13px] xl:text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeTab === "seo" ? "text-white" : "text-blue-100/60 hover:text-white"}`}
              >
                <Search className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${activeTab === "seo" ? "text-white" : "text-blue-100/60"}`} />
                Titulo
              </button>

              <div className="w-[1px] h-4 bg-white/10 mx-1" />

              <button 
                onClick={() => setActiveTab("formatar")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-4 xl:px-6 py-2 rounded-lg text-[11px] lg:text-[13px] xl:text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeTab === "formatar" ? "text-white" : "text-blue-100/60 hover:text-white"}`}
              >
                <FileText className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${activeTab === "formatar" ? "text-white" : "text-blue-100/60"}`} />
                Descrição
              </button>

              <div className="w-[1px] h-4 bg-white/10 mx-1" />

              <button 
                onClick={() => setActiveTab("imagem")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-4 xl:px-6 py-2 rounded-lg text-[11px] lg:text-[13px] xl:text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeTab === "imagem" ? "text-white" : "text-blue-100/60 hover:text-white"}`}
              >
                <ImageIcon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${activeTab === "imagem" ? "text-white" : "text-blue-100/60"}`} />
                Imagem
                {imageLoading && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-3 h-3" />
                  </motion.div>
                )}
              </button>

              <div className="w-[1px] h-4 bg-white/10 mx-1" />

              <button 
                onClick={() => setActiveTab("prompts")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-4 xl:px-6 py-2 rounded-lg text-[11px] lg:text-[13px] xl:text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeTab === "prompts" ? "text-white" : "text-blue-100/60 hover:text-white"}`}
              >
                <Sparkles className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${activeTab === "prompts" ? "text-white" : "text-blue-100/60"}`} />
                IA
              </button>

              <div className="w-[1px] h-4 bg-white/10 mx-1" />

              <button 
                onClick={() => setActiveTab("ferramentas")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-4 xl:px-6 py-2 rounded-lg text-[11px] lg:text-[13px] xl:text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeTab === "ferramentas" ? "text-white" : "text-blue-100/60 hover:text-white"}`}
              >
                <Wrench className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${activeTab === "ferramentas" ? "text-white" : "text-blue-100/60"}`} />
                APP
              </button>

              <div className="w-[1px] h-4 bg-white/10 mx-1" />

              <button 
                onClick={() => setActiveTab("treinamento")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-4 xl:px-6 py-2 rounded-lg text-[11px] lg:text-[13px] xl:text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeTab === "treinamento" ? "text-white" : "text-blue-100/60 hover:text-white"}`}
              >
                <PlusCircle className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${activeTab === "treinamento" ? "text-white" : "text-blue-100/60"}`} />
                Outros
              </button>
            </nav>

            <div className="hidden md:flex items-center gap-2 lg:gap-4 shrink-0">
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-blue-600 border-b border-blue-700 p-2">
        <ScrollArea className="w-full">
          <div className="flex items-center p-1 w-max">
            <button 
              onClick={() => setActiveTab("seo")}
              className={`px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all ${activeTab === "seo" ? "text-white" : "text-white/40"}`}
            >
              <Search className="w-4 h-4" />
              Titulo
            </button>
            
            <div className="w-[1px] h-4 bg-white/10 mx-1" />

            <button 
              onClick={() => setActiveTab("formatar")}
              className={`px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all ${activeTab === "formatar" ? "text-white" : "text-white/40"}`}
            >
              <FileText className="w-4 h-4" />
              Descrição
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-1" />

            <button 
              onClick={() => setActiveTab("imagem")}
              className={`px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all ${activeTab === "imagem" ? "text-white" : "text-white/40"}`}
            >
              <ImageIcon className="w-4 h-4" />
              Imagem
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-1" />

            <button 
              onClick={() => setActiveTab("prompts")}
              className={`px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all ${activeTab === "prompts" ? "text-white" : "text-white/40"}`}
            >
              <Sparkles className="w-4 h-4" />
              IA
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-1" />

            <button 
              onClick={() => setActiveTab("ferramentas")}
              className={`px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all ${activeTab === "ferramentas" ? "text-white" : "text-white/40"}`}
            >
              <Wrench className="w-4 h-4" />
              APP
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-1" />

            <button 
              onClick={() => setActiveTab("treinamento")}
              className={`px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all ${activeTab === "treinamento" ? "text-white" : "text-white/40"}`}
            >
              <PlusCircle className="w-4 h-4" />
              Outros
            </button>
          </div>
        </ScrollArea>
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 md:py-6 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Hide the old TabsList since we moved it to the header */}
          <div className="hidden">
            <TabsList>
              <TabsTrigger value="seo">S</TabsTrigger>
              <TabsTrigger value="formatar">F</TabsTrigger>
              <TabsTrigger value="imagem">I</TabsTrigger>
              <TabsTrigger value="treinamento">T</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="treinamento">
            <ErrorBoundary isSection fallbackTitle="Falha na aba Treinamento">
              <TreinamentoTab />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="imagem">
            <ErrorBoundary isSection fallbackTitle="Falha na aba Imagem">
              <ImageTab 
                imageLoading={imageLoading}
                imageResult={imageResult}
                imageError={imageError}
                preview={preview}
                filename={filename}
                imageFormData={imageFormData}
                setImageFormData={setImageFormData}
                handleSubmit={handleSubmit}
                handleFileChange={handleFileChange}
                handleDownload={handleDownload}
                setSelectedImage={setSelectedImage}
                clearImageResult={clearImageResult}
                filenameCopyAlert={filenameCopyAlert}
                setFilenameCopyAlert={setFilenameCopyAlert}
                uploadFilenameCopyAlert={uploadFilenameCopyAlert}
                setUploadFilenameCopyAlert={setUploadFilenameCopyAlert}
                quotaExceeded={quotaError?.exceeded ?? false}
                setPreview={setPreview}
                setFilename={setFilename}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="formatar">
            <ErrorBoundary isSection fallbackTitle="Falha na aba Formatar Descrição">
              <DescriptionTab 
                originalDesc={originalDesc}
                setOriginalDesc={setOriginalDesc}
                formatarMedidas={formatarMedidas}
                setFormatarMedidas={setFormatarMedidas}
                handleRewrite={handleRewrite}
                rewriteLoading={rewriteLoading}
                rewriteResult={rewriteResult}
                setRewriteResult={setRewriteResult}
                foundWords={foundWords}
                wordCounts={wordCounts}
                showForbiddenAlert={showForbiddenAlert}
                setShowForbiddenAlert={setShowForbiddenAlert}
                copyAlert={copyAlert}
                setCopyAlert={setCopyAlert}
                typeDescAlert={typeDescAlert}
                setTypeDescAlert={setTypeDescAlert}
                quotaExceeded={quotaError?.exceeded ?? false}
                seoFormData={seoFormData}
                forbiddenWords={FORBIDDEN_WORDS}
              />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="seo">
            <ErrorBoundary isSection fallbackTitle="Falha na aba Gerador de Título">
              <SEOTab 
                seoFormData={seoFormData}
                setSeoFormData={setSeoFormData}
                handleSEOGenerate={handleSEOGenerate}
                seoLoading={seoLoading}
                seoResult={seoResult}
                seoCopyAlert={seoCopyAlert}
                setSeoCopyAlert={setSeoCopyAlert}
                quotaExceeded={quotaError?.exceeded ?? false}
              />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="prompts">
            <ErrorBoundary isSection fallbackTitle="Falha na aba IA">
              <PromptSaverTab />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="ferramentas">
            <ErrorBoundary isSection fallbackTitle="Falha na aba APP">
              <ToolsTab />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>
      {/* Image Viewer Portal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-6 right-6 z-10 flex gap-2">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="rounded-lg bg-white/90 shadow-xl"
                  onClick={() => {
                    const finalName = filename 
                      ? (selectedImage.id === 1 ? `${filename}.jpg` : `${filename}-${selectedImage.id - 1}.jpg`)
                      : `produto_${selectedImage.id}.jpg`;
                    handleDownload(selectedImage.url, finalName);
                  }}
                >
                  <Download className="w-5 h-5 text-black" />
                </Button>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="rounded-lg bg-black text-white shadow-xl hover:bg-gray-800"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 bg-[#FDFDFD] flex items-center justify-center p-4 md:p-8 overflow-y-auto overflow-x-auto min-h-0">
                <img 
                  src={selectedImage.url} 
                  alt="Expanded view" 
                  className="max-w-full max-h-[75vh] object-contain select-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

