import * as React from "react"
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { generateProductContent, type ProductData, type GenerationResult } from "@/src/lib/gemini";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    altura: "",
    largura: "",
    profundidade: "",
    peso: "",
    descricao: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) {
      setError("Por favor, envie uma imagem do produto.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data: ProductData = {
        image: preview,
        mimeType: preview.split(";")[0].split(":")[1],
        ...formData
      };
      const res = await generateProductContent(data);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao gerar o conteúdo. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans selection:bg-orange-100">
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Left: Form */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-2xl shadow-gray-200/40 rounded-3xl overflow-hidden">
              <CardContent className="p-8 space-y-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Image Upload */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Referência Visual</Label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer group overflow-hidden flex flex-col items-center justify-center gap-4
                        ${preview ? 'border-orange-500 bg-orange-50/20' : 'border-gray-200 hover:border-black hover:bg-gray-50'}`}
                    >
                      {preview ? (
                        <>
                          <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-6" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white text-sm font-bold">Alterar Referência</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform border border-gray-100">
                            <Upload className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="text-center px-4">
                            <p className="text-sm font-bold text-gray-900">Arraste ou clique</p>
                            <p className="text-xs text-gray-400 mt-1">Alta resolução recomendada</p>
                          </div>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>

                  {/* Dimensions */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Altura (cm)</Label>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          placeholder="00" 
                          className="pl-10 h-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-xl" 
                          value={formData.altura}
                          onChange={e => setFormData({...formData, altura: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Largura (cm)</Label>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90" />
                        <Input 
                          placeholder="00" 
                          className="pl-10 h-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-xl" 
                          value={formData.largura}
                          onChange={e => setFormData({...formData, largura: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Profundidade (cm)</Label>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          placeholder="00" 
                          className="pl-10 h-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-xl" 
                          value={formData.profundidade}
                          onChange={e => setFormData({...formData, profundidade: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Peso (kg)</Label>
                      <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          placeholder="0.0" 
                          className="pl-10 h-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-xl" 
                          value={formData.peso}
                          onChange={e => setFormData({...formData, peso: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Especificações Reais</Label>
                    <Textarea 
                      placeholder="Descreva materiais, acabamentos e diferenciais únicos..." 
                      className="min-h-[120px] resize-none bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-xl p-4"
                      value={formData.descricao}
                      onChange={e => setFormData({...formData, descricao: e.target.value})}
                    />
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-3 text-red-600 text-sm font-medium"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p>{error}</p>
                    </motion.div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-black hover:bg-gray-800 text-white font-bold rounded-2xl shadow-xl shadow-gray-200 transition-all active:scale-[0.98] disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Processando Fidelidade AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-3" />
                        Gerar Kit de Alta Fidelidade
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-8">
            {!result && !loading && (
              <div className="h-full min-h-[700px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-200 rounded-[40px] bg-white">
                <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-8 border border-gray-100">
                  <ImageIcon className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Estúdio AI Pronto</h3>
                <p className="text-gray-500 mt-3 max-w-md text-lg">Envie a referência do seu produto para gerar imagens realistas, SEO e descrições comerciais de alto impacto.</p>
                <div className="grid grid-cols-2 gap-4 mt-10">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Fidelidade Visual 100%
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    SEO Otimizado
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="space-y-10 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-[32px] bg-gray-100" />
                  ))}
                </div>
                <div className="space-y-6">
                  <Skeleton className="h-10 w-64 bg-gray-100 rounded-full" />
                  <Skeleton className="h-48 w-full bg-gray-100 rounded-[32px]" />
                </div>
              </div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-16"
              >
                {/* Images Grid */}
                <section className="space-y-8">
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black tracking-tight">Galeria de Fidelidade</h2>
                      <p className="text-gray-500">Imagens geradas com iluminação de estúdio e escala real.</p>
                    </div>
                    <Badge variant="secondary" className="bg-black text-white px-4 py-1.5 rounded-full">8 Ativos Gerados</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {result.images.map((img) => (
                      <div 
                        key={img.id}
                        className="group relative bg-white rounded-[32px] overflow-hidden border border-gray-100 transition-colors hover:border-[#FF6A00]"
                      >
                        <div className="aspect-square relative overflow-hidden bg-[#FDFDFD]">
                          <img 
                            src={img.url} 
                            alt={img.title} 
                            className="w-full h-full object-contain p-8"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-5 left-5">
                            <Badge className="bg-white/95 backdrop-blur-md text-black border-none shadow-xl px-4 py-1.5 font-bold text-xs uppercase tracking-widest">
                              {img.title}
                            </Badge>
                          </div>
                          <div className="absolute bottom-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <Button size="icon" variant="secondary" className="rounded-full bg-white/95 backdrop-blur-md shadow-lg">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="secondary" className="rounded-full bg-white/95 backdrop-blur-md shadow-lg">
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-8 bg-white">
                          <p className="text-sm text-gray-500 leading-relaxed font-medium">{img.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Cross-Sell Section */}
                <section className="bg-black rounded-[40px] p-10 md:p-16 text-white space-y-10 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 blur-[120px] rounded-full -mr-32 -mt-32" />
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3 text-orange-500 mb-4">
                      <ShoppingBag className="w-6 h-6" />
                      <span className="text-xs font-black uppercase tracking-[0.3em]">Oportunidade de Venda</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight">Compre Junto</h2>
                    <p className="text-gray-400 text-lg max-w-xl">Aumente o ticket médio sugerindo estes complementos ideais para o seu produto.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 relative z-10">
                    {result.crossSell.map((item, i) => (
                      <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:bg-white/10 transition-colors group">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mb-2">
                            <PlusCircle className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold">{item.name}</h3>
                          <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                        </div>
                        <Button variant="link" className="text-orange-500 p-0 h-auto mt-6 group-hover:translate-x-2 transition-transform">
                          Ver Detalhes <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* SEO & Commercial */}
                <div className="grid lg:grid-cols-2 gap-12">
                  {/* SEO */}
                  <section className="space-y-8 bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Search className="w-5 h-5 text-orange-600" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight">Inteligência SEO</h2>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-3">
                        {result.seo.map((tag, i) => (
                          <Badge key={i} variant="outline" className="px-6 py-2.5 rounded-full border-gray-100 text-gray-700 bg-gray-50/50 hover:bg-white transition-all font-bold text-xs uppercase tracking-wider">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <Separator className="bg-gray-100" />

                      <div className="space-y-5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <h3 className="font-bold text-lg">Melhorias Técnicas</h3>
                        </div>
                        <ul className="space-y-4">
                          {result.improvements.map((item, i) => (
                            <li key={i} className="flex gap-4 text-sm text-gray-600 group">
                              <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Commercial Description */}
                  <section className="space-y-8 bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight">Copy Comercial</h2>
                    </div>
                    
                    <ScrollArea className="h-[450px] pr-4">
                      <div className="space-y-10">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">A Dor do Cliente</h4>
                          <p className="text-gray-700 leading-relaxed text-lg italic">"{result.commercial.problem}"</p>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">A Solução AI</h4>
                          <p className="text-gray-700 leading-relaxed">{result.commercial.solution}</p>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Contexto de Uso</h4>
                          <p className="text-gray-700 leading-relaxed">{result.commercial.context}</p>
                        </div>
                        <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Impacto de Venda</h4>
                          <p className="text-orange-900 leading-relaxed font-bold">{result.commercial.benefit}</p>
                        </div>
                      </div>
                    </ScrollArea>
                  </section>
                </div>

                {/* Footer Action */}
                <div className="pt-12 pb-32 flex flex-col items-center gap-6">
                  <div className="flex gap-4">
                    <Button className="rounded-full px-10 h-14 bg-black hover:bg-gray-800 text-white font-bold shadow-2xl shadow-gray-200" onClick={() => window.print()}>
                      <Download className="w-5 h-5 mr-3" />
                      Exportar Kit PDF
                    </Button>
                    <Button variant="outline" className="rounded-full px-10 h-14 border-gray-200 font-bold">
                      Salvar na Nuvem
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">© 2026 E-com Studio Pro. Todos os direitos reservados.</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
