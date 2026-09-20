import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle,
  Loader2,
  Tag,
  Zap,
  Lightbulb,
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOResult } from "../lib/gemini";

interface SEOTabProps {
  seoFormData: {
    name: string;
    model: string;
    voltage: string;
    brand: string;
    differentials: string;
    currentTitle: string;
  };
  setSeoFormData: React.Dispatch<React.SetStateAction<any>>;
  handleSEOGenerate: (e: React.FormEvent) => Promise<void>;
  seoLoading: boolean;
  seoResult: SEOResult | null;
  seoCopyAlert: boolean;
  setSeoCopyAlert: React.Dispatch<React.SetStateAction<boolean>>;
  quotaExceeded: boolean;
}

export function SEOTab({
  seoFormData,
  setSeoFormData,
  handleSEOGenerate,
  seoLoading,
  seoResult,
  seoCopyAlert,
  setSeoCopyAlert,
  quotaExceeded
}: SEOTabProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setSeoCopyAlert(true);
    setTimeout(() => setSeoCopyAlert(false), 2000);
  };

  return (
    <div className={`w-full mx-auto ${seoResult || seoLoading ? 'max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start' : 'max-w-2xl'}`}>
      {/* Search Result Banner */}
      <AnimatePresence>
        {seoCopyAlert && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100]"
          >
            <Badge className="bg-green-600 text-white px-6 py-2 rounded-full shadow-2xl border-0 text-xs font-black uppercase tracking-widest">
              <Check className="w-4 h-4 mr-2" />
              Título copiado com sucesso!
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="space-y-6"
      >
        <Card className="border-0 shadow-none bg-white overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSEOGenerate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">PRODUTO</Label>
                  <Input 
                    value={seoFormData.name}
                    onChange={(e) => setSeoFormData({...seoFormData, name: e.target.value})}
                    className="h-11 border-slate-200 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Modelo</Label>
                  <Input 
                    value={seoFormData.model}
                    onChange={(e) => setSeoFormData({...seoFormData, model: e.target.value})}
                    className="h-11 border-slate-200 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Marca</Label>
                  <Input 
                    value={seoFormData.brand}
                    onChange={(e) => setSeoFormData({...seoFormData, brand: e.target.value})}
                    className="h-11 border-slate-200 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">VOLTAGEM</Label>
                  <Input 
                    value={seoFormData.voltage}
                    onChange={(e) => setSeoFormData({...seoFormData, voltage: e.target.value})}
                    className="h-11 border-slate-200 focus:border-blue-500 rounded-lg shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">DIFERENCIAIS</Label>
                <Textarea 
                  value={seoFormData.differentials}
                  onChange={(e) => setSeoFormData({...seoFormData, differentials: e.target.value})}
                  className="min-h-[80px] border-slate-200 focus:border-blue-500 rounded-lg resize-none shadow-sm"
                />
              </div>

              <Button 
                type="submit"
                disabled={seoLoading || !seoFormData.name || !seoFormData.brand}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-lg shadow-xl shadow-blue-200 transition-all group relative overflow-hidden active:scale-95 disabled:opacity-50"
              >
                {seoLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                    <span>Analisando Concorrência...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-200 group-hover:rotate-12 transition-transform" />
                    <span>Otimizar Título</span>
                  </div>
                )}
                <div className="absolute top-0 left-0 w-full h-1 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-6">
        {seoLoading ? (
          <div className="space-y-6">
            <Card className="border-0 shadow-none bg-white overflow-hidden">
              <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-blue-600"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="w-6 h-6 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-black uppercase tracking-tight text-slate-900">Sincronizando Marketplaces</h4>
                  <p className="text-xs text-slate-400 font-medium">Analisando volumes de busca e concorrentes de elite...</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 space-y-4">
                <Skeleton className="h-4 w-3/4 bg-slate-200" />
                <Skeleton className="h-4 w-full bg-slate-200" />
                <Skeleton className="h-4 w-5/6 bg-slate-200" />
              </div>
            </Card>
          </div>
        ) : seoResult ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Main Result Cards */}
            <div className="space-y-4">
              <Card className="border-0 shadow-none bg-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-3">
                  <Badge className="bg-blue-600 text-white font-black text-[8px] uppercase tracking-widest px-3 py-1 rotate-3 shadow-lg group-hover:rotate-0 transition-transform">TOP PERFORMER</Badge>
                </div>
                <CardHeader className="pb-3 border-b border-blue-50 bg-blue-50/30">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-600">Google & Mercado Livre</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <h3 className="text-xl font-black text-slate-900 leading-snug tracking-tight flex-1">
                      {seoResult.googleMeliTitle}
                    </h3>
                    <div className="shrink-0 flex items-center gap-1.5 self-start bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 shadow-sm">
                      <Badge className={`${seoResult.googleMeliTitle.length <= 60 ? 'bg-emerald-600' : 'bg-red-500'} text-white font-black text-[10px] px-2 py-0.5 shadow-none border-0`}>
                        {seoResult.googleMeliTitle.length}
                      </Badge>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">/ 60 carac.</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleCopy(seoResult.googleMeliTitle)}
                    className="w-full h-11 bg-white hover:bg-slate-50 text-blue-600 border-2 border-blue-600 font-black uppercase tracking-widest text-[10px]"
                  >
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Copiar Título
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-none bg-white overflow-hidden relative group">
                <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Site Acimaq</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <h3 className="text-lg font-black text-slate-700 leading-snug tracking-tight flex-1">
                      {seoResult.acimaqTitle}
                    </h3>
                    <div className="shrink-0 flex items-center gap-1.5 self-start bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">{seoResult.acimaqTitle.length}</span>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">carac.</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => handleCopy(seoResult.acimaqTitle)}
                    className="w-full h-11 border-slate-200 hover:border-blue-400 hover:text-blue-600 font-black uppercase tracking-widest text-[10px]"
                  >
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Copiar Título
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Insight Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-0 shadow-none bg-white">
                <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Palavras Concorrência</span>
                  <ExternalLink className="w-3 h-3 text-slate-300" />
                </CardHeader>
                <CardContent className="p-4 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {seoResult.competitorKeywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-wide border-0 px-2.5 py-1">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-none bg-white">
                <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-900/40">Destaques Únicos</span>
                  <Zap className="w-3 h-3 text-orange-300" />
                </CardHeader>
                <CardContent className="p-4 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {seoResult.highlightKeywords.map((kw, i) => (
                      <Badge key={i} className="bg-orange-500 text-white text-[9px] font-bold uppercase tracking-wide border-0 px-2.5 py-1">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Intent keywords */}
            <Card className="border-0 shadow-none bg-white overflow-hidden">
               <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                 <Tag className="w-3.5 h-3.5 text-blue-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Intenções de Busca (SEO On-page)</span>
               </div>
               <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {seoResult.intentKeywords.map((kw, i) => (
                      <span key={i} className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-blue-300" />
                        {kw}
                      </span>
                    ))}
                  </div>
               </CardContent>
            </Card>

            {/* Strategy Box */}
            <div className="p-6 bg-[#0F172A] rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/10 blur-3xl rounded-full" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-blue-400" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Estratégia de Melhoria</h4>
                </div>
                <div className="space-y-3">
                  {seoResult.improvements.map((imp, i) => (
                    <div key={i} className="flex gap-3 items-start group/item">
                      <div className="w-4 h-4 mt-1 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30 group-hover/item:bg-blue-500 transition-colors">
                        <Check className="w-2.5 h-2.5 text-blue-400 group-hover/item:text-white" />
                      </div>
                      <p className="text-blue-100/60 text-[11px] leading-relaxed group-hover/item:text-blue-50 transition-colors font-medium">
                        {imp}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
