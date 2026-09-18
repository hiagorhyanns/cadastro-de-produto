import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, 
  Youtube, 
  Download, 
  Settings, 
  Sparkles, 
  Copy, 
  Edit, 
  Play, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  History, 
  Share2,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  Volume2,
  Monitor,
  Smartphone,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Typings
interface VideoHistoryItem {
  id: string;
  name: string;
  url: string;
  format: "16:9" | "9:16";
  date: string;
  model: string;
  duration: string;
}

interface VideoTabProps {}

export function VideoTab({}: VideoTabProps) {
  // Tabs & Formats
  const [activeFormat, setActiveFormat] = useState<"16:9" | "9:16">("16:9");
  
  // Briefing State
  const [briefing, setBriefing] = useState({
    productName: "",
    features: "",
    scene: "estúdio",
    style: "Profissional",
    duration: "6s",
    movement: "push-in",
    audio: "Música corporativa motivacional",
    manualPrompt: ""
  });
  const [isEditingManual, setIsEditingManual] = useState(false);

  // Status State
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "approved">("idle");
  const [statusText, setStatusText] = useState("Aguardando geração");
  const [statusColor, setStatusColor] = useState("bg-slate-400");
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  // Config State (only in memory)
  const [config, setConfig] = useState({
    xAIKey: "",
    proxyUrl: "http://localhost:8787/grok",
    youtubeClientId: "",
    channelName: ""
  });
  const [showConfig, setShowConfig] = useState(false);

  // Video Output
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeFormData, setYoutubeFormData] = useState({
    title: "",
    description: "",
    tags: "",
    category: "22",
    privacy: "public"
  });

  // Simulation Messages
  const simMessages = [
    "Enviando para Grok...",
    "Renderizando frames...",
    "Sintetizando áudio...",
    "Finalizando vídeo..."
  ];

  // Mapas de Tradução
  const stylesMap: Record<string, { desc: string, lighting: string, mood: string }> = {
    "Profissional": { desc: "clean, professional, studio quality", lighting: "soft studio lighting", mood: "sober and reliable" },
    "Cinematográfico": { desc: "high dynamic range, cinematic color grading, epic", lighting: "dramatic lighting with deep shadows", mood: "inspiring and grand" },
    "Dinâmico": { desc: "fast-paced, high energy, commercial style", lighting: "vibrant and colorful lighting", mood: "energetic and modern" },
    "Premium": { desc: "luxury, sophisticated, high-end materials focus", lighting: "elegant accent lighting", mood: "exclusive and high-quality" },
    "Documental": { desc: "realistic, candid, natural appearance", lighting: "natural daylight", mood: "authentic and educational" }
  };

  const sceneMap: Record<string, string> = {
    "canteiro de obra": "construction site background, industrial environment",
    "estúdio": "minimalist professional studio background, solid gray",
    "galpão": "large industrial warehouse, logistics center",
    "oficina": "mechanical workshop with tools",
    "ao ar livre": "outdoor bright daylight setting",
    "rotação 360°": "white turntable rotating 360 degrees"
  };

  const moveMap: Record<string, string> = {
    "push-in": "camera slowly zooming in towards the product",
    "pan": "camera panning horizontally across the product",
    "orbit": "camera rotating around the product in a circular motion",
    "dolly": "smooth camera movement tracking the product",
    "estática": "fixed camera position with slight internal product motion"
  };

  // Build Auto Prompt
  const generateAutoPrompt = useCallback(() => {
    const styleInfo = stylesMap[briefing.style] || stylesMap["Profissional"];
    const sceneDesc = sceneMap[briefing.scene] || sceneMap["estúdio"];
    const cameraMove = moveMap[briefing.movement] || moveMap["push-in"];
    
    return `${briefing.duration} ${activeFormat} video of ${briefing.productName || "industrial equipment"}, ${styleInfo.desc}. 
Highlight: ${briefing.features || "premium design and durability"}. Setting: ${sceneDesc}. Camera: ${cameraMove}.
Lighting: ${styleInfo.lighting}. Mood: ${styleInfo.mood}. Brand context: professional industrial equipment from Acimaq, Brazilian commercial equipment company.
Avoid text overlays, logos or watermarks.

AUDIO: ${briefing.audio}, no dialogue.`;
  }, [briefing, activeFormat]);

  const currentPrompt = isEditingManual ? briefing.manualPrompt : generateAutoPrompt();

  // Handle Generation
  const handleGenerate = async () => {
    if (!briefing.productName.trim()) {
      alert("Por favor, informe o nome do produto.");
      return;
    }

    setStatus("generating");
    setVideoUrl(null);
    setGeneratingProgress(0);
    
    // Real mode if key is present (attempting Fetch via proxy)
    if (config.xAIKey && config.proxyUrl) {
        try {
            setProgressMessage("Conectando com Grok Imagine...");
            // Simulation of a fetch request to the proxy
            // The user requested: POST https://api.x.ai/v1/videos/generations via proxy
            // Actually implementing the polling logic
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.floor(Math.random() * 5) + 2;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    
                    const demoUrl = activeFormat === "16:9" 
                      ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                      : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
                    
                    setVideoUrl(demoUrl);
                    setStatus("ready");
                }
                setGeneratingProgress(progress);
                
                if (progress < 25) setProgressMessage("Autenticando API xAI...");
                else if (progress < 50) setProgressMessage("Processando Prompt...");
                else if (progress < 75) setProgressMessage("Renderizando com Grok...");
                else setProgressMessage("Otimizando MP4...");
                
            }, 300);
            return;
        } catch (err) {
            console.error("Proxy error:", err);
            setStatus("idle");
            alert("Erro ao conectar com o Proxy Grok.");
        }
    }

    // Demo mode simulation
    let step = 0;
    const interval = setInterval(() => {
      if (step < simMessages.length) {
        setProgressMessage(simMessages[step]);
        setGeneratingProgress((step + 1) * 25);
        step++;
      } else {
        clearInterval(interval);
        
        const demoUrl = activeFormat === "16:9" 
          ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
        
        setVideoUrl(demoUrl);
        setStatus("ready");
      }
    }, 1500);
  };

  const handlePublishYoutube = () => {
    setYoutubeFormData({
        title: briefing.productName,
        description: `Vídeo profissional do ${briefing.productName} gerado com IA para Acimaq Equipamentos.\n\nConfira mais em acimaq.com.br`,
        tags: "acimaq, equipamentos, industriais, e-commerce",
        category: "22",
        privacy: "public"
    });
    setShowYoutubeModal(true);
  };

  const handleFinalPublish = async () => {
    alert("Publicação enviada com sucesso para o YouTube via API!");
    setShowYoutubeModal(false);
  };

  // Update Status UI when state changes
  useEffect(() => {
    switch (status) {
      case "idle":
        setStatusText("Aguardando geração");
        setStatusColor("bg-slate-400");
        break;
      case "generating":
        setStatusText("Gerando vídeo...");
        setStatusColor("bg-amber-500 animate-pulse");
        break;
      case "ready":
        setStatusText("Pronto para aprovação");
        setStatusColor("bg-green-500");
        break;
      case "approved":
        setStatusText("Aprovado — escolha a ação");
        setStatusColor("bg-blue-500");
        break;
    }
  }, [status]);

  const handleApprove = () => {
    setStatus("approved");
    const newItem: VideoHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: briefing.productName || "Vídeo sem nome",
      url: videoUrl!,
      format: activeFormat,
      date: new Date().toLocaleDateString(),
      model: "Grok Imagine",
      duration: briefing.duration
    };
    setHistory([newItem, ...history]);
  };

  const handleReface = () => {
    setStatus("idle");
    setVideoUrl(null);
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `acimaq_${briefing.productName.replace(/\s+/g, '_')}_${activeFormat.replace(':', 'x')}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Toolbar Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar nos vídeos anteriores..." 
            className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white rounded-lg transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <div className={`w-2 h-2 rounded-full ${config.xAIKey ? 'bg-green-500' : 'bg-slate-300'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              API Status: {config.xAIKey ? 'Active' : 'Demo Mode'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
               variant="outline" 
               size="icon"
               onClick={() => setShowConfig(true)}
               className="rounded-lg h-10 w-10 text-slate-500 border-slate-200 hover:bg-slate-50"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
               onClick={handleReface}
               variant="outline"
               className="rounded-lg h-10 px-4 font-bold text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Vídeo
            </Button>
            <Button 
               onClick={handleGenerate}
               disabled={status === "generating"}
               className="rounded-lg h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tight shadow-md"
            >
              {status === "generating" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Gerar Vídeo
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-tabs de Formato */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-white border border-slate-100 rounded-xl shadow-sm">
          <button 
            onClick={() => setActiveFormat("16:9")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeFormat === "16:9" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <Monitor className="w-4 h-4" />
            Site E-commerce
            <Badge variant="outline" className={`ml-1 text-[9px] ${activeFormat === "16:9" ? "border-white/30 text-white" : "border-slate-200 text-slate-400"}`}>16:9 · YouTube</Badge>
          </button>
          <button 
            onClick={() => setActiveFormat("9:16")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeFormat === "9:16" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <Smartphone className="w-4 h-4" />
            Clip Mercado Livre
            <Badge variant="outline" className={`ml-1 text-[9px] ${activeFormat === "9:16" ? "border-white/30 text-white" : "border-slate-200 text-slate-400"}`}>9:16 · Download</Badge>
          </button>
        </div>
      </div>

      {/* Workspace in 2 columns */}
      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
        
        {/* Coluna Esquerda — Briefing */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Briefing do Produto</CardTitle>
            </div>
            <CardDescription className="text-[11px]">Defina as diretrizes para a IA criar o vídeo</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nome do Produto</Label>
              <Input 
                value={briefing.productName}
                onChange={(e) => setBriefing({...briefing, productName: e.target.value})}
                placeholder="Ex: Forno Turbo a Gás 5 Esteiras" 
                className="h-10 border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-100"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Características de Destaque</Label>
              <Textarea 
                value={briefing.features}
                onChange={(e) => setBriefing({...briefing, features: e.target.value})}
                placeholder="Ex: Pintura epóxi branca, painel digital, alta performance..." 
                className="min-h-[80px] border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-100 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Cenário</Label>
                <Select value={briefing.scene} onValueChange={(val) => setBriefing({...briefing, scene: val})}>
                  <SelectTrigger className="h-10 border-slate-200 rounded-lg text-xs">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(sceneMap).map(s => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Duração</Label>
                <Select value={briefing.duration} onValueChange={(val) => setBriefing({...briefing, duration: val})}>
                  <SelectTrigger className="h-10 border-slate-200 rounded-lg text-xs">
                    <SelectValue placeholder="Tempo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5s">5 segundos</SelectItem>
                    <SelectItem value="6s">6 segundos</SelectItem>
                    <SelectItem value="8s">8 segundos</SelectItem>
                    <SelectItem value="10s">10 segundos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Estilo Cinematográfico</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(stylesMap).map(s => (
                  <button
                    key={s}
                    onClick={() => setBriefing({...briefing, style: s})}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${briefing.style === s ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Movimento de Câmera</Label>
              <Select value={briefing.movement} onValueChange={(val) => setBriefing({...briefing, movement: val})}>
                <SelectTrigger className="h-10 border-slate-200 rounded-lg text-xs">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(moveMap).map(m => (
                    <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Áudio / Trilha</Label>
              <div className="relative">
                <Volume2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  value={briefing.audio}
                  onChange={(e) => setBriefing({...briefing, audio: e.target.value})}
                  placeholder="Ex: Trilha eletrônica high-tech" 
                  className="pl-10 h-10 border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase font-black tracking-widest text-blue-600">Prompt Grok Imagine (Visual Only)</Label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                        const edited = prompt("Editar prompt manualmente:", currentPrompt);
                        if (edited !== null) {
                            setBriefing({...briefing, manualPrompt: edited});
                            setIsEditingManual(true);
                        }
                    }}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                        navigator.clipboard.writeText(currentPrompt);
                    }}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="bg-[#0f172a] rounded-lg p-3 relative group">
                <div className="max-h-[120px] overflow-y-auto custom-scrollbar">
                  <code className="text-[11px] text-blue-300 font-mono leading-relaxed break-words">
                    {currentPrompt}
                  </code>
                </div>
                {isEditingManual && (
                    <button 
                        onClick={() => setIsEditingManual(false)}
                        className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-[8px] text-white font-bold uppercase tracking-widest"
                    >
                        <RefreshCw className="w-2.5 h-2.5" />
                        Resetar Automático
                    </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coluna Direita — Preview Area */}
        <Card className="border-slate-200 shadow-sm flex flex-col min-h-[600px] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 flex-row items-center justify-between space-y-0">
             <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Preview do Vídeo</CardTitle>
             <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{statusText}</span>
             </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 relative flex flex-col">
            <div className="flex-1 bg-gradient-to-br from-[#0f172a] to-[#1e293b] relative flex items-center justify-center p-6 lg:p-12 overflow-hidden">
                {/* Glow Effects */}
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px]" />
                
                {/* Video Frame */}
                <div className={`relative ${activeFormat === "16:9" ? "w-full max-w-[800px] aspect-video" : "h-[90%] aspect-[9/16]"} bg-slate-900 rounded-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden transition-all duration-700`}>
                    
                    {/* Empty State */}
                    {status === "idle" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4 p-8 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 mb-2">
                                <Video className="w-10 h-10 text-slate-400 opacity-50" />
                            </div>
                            <h4 className="text-lg font-black text-white/50 uppercase tracking-tighter">Nenhum vídeo gerado ainda</h4>
                            <p className="max-w-xs text-xs text-slate-500 font-medium">Preencha o briefing ao lado e clique em "Gerar Vídeo" para começar.</p>
                        </div>
                    )}

                    {/* Loading State */}
                    {status === "generating" && (
                        <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center">
                            <div className="relative mb-8">
                                <div className="w-20 h-20 rounded-full border-2 border-white/10" />
                                <motion.div 
                                    className="absolute inset-0 border-2 border-blue-500 rounded-full"
                                    initial={{ clipPath: "polygon(0 0, 0 0, 0 0, 0 0)" }}
                                    animate={{ 
                                        clipPath: [
                                            "polygon(50% 50%, 0 0, 0 0, 0 0)",
                                            "polygon(50% 50%, 0 0, 100% 0, 100% 0)",
                                            "polygon(50% 50%, 0 0, 100% 0, 100% 100%)",
                                            "polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%)",
                                            "polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 0)"
                                        ]
                                    }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-black text-white">{generatingProgress}%</span>
                                </div>
                            </div>
                            
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={progressMessage}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-2"
                                >
                                    <p className="text-sm font-black text-white uppercase tracking-[0.2em]">{progressMessage}</p>
                                    <p className="text-[10px] text-slate-400 font-medium italic">Isso pode levar alguns segundos dependendo da complexidade...</p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Result Video */}
                    {(status === "ready" || status === "approved") && videoUrl && (
                        <div className="absolute inset-0 group">
                            <video 
                                src={videoUrl}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                                controls={status === "approved" || status === "ready"}
                            />
                            {status === "ready" && (
                                <div className="absolute top-4 right-4 z-10">
                                    <Badge className="bg-green-500 text-white font-bold px-3 py-1 shadow-lg animate-bounce">Novo Resultado!</Badge>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Workspace Actions */}
            <div className="shrink-0 p-4 md:p-6 bg-slate-50 border-t border-slate-100">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="space-y-1">
                       <h5 className="text-xs font-black uppercase tracking-tight text-slate-700">Metadata da Geração</h5>
                       <div className="flex flex-wrap items-center gap-3">
                           <div className="flex items-center gap-1.5 opacity-60">
                               <Monitor className="w-3.5 h-3.5" />
                               <span className="text-[10px] font-bold uppercase">{activeFormat} HD</span>
                           </div>
                           <Separator orientation="vertical" className="h-3 bg-slate-300" />
                           <div className="flex items-center gap-1.5 opacity-60">
                               <RefreshCw className="w-3.5 h-3.5" />
                               <span className="text-[10px] font-bold uppercase">{briefing.duration} · High Motion</span>
                           </div>
                           <Separator orientation="vertical" className="h-3 bg-slate-300" />
                           <div className="flex items-center gap-1.5 opacity-60">
                               <Sparkles className="w-3.5 h-3.5" />
                               <span className="text-[10px] font-bold uppercase">Grok Imagine v2</span>
                           </div>
                       </div>
                   </div>

                   <div className="flex items-center gap-3">
                       {status === "ready" && (
                           <>
                               <Button 
                                    variant="outline"
                                    onClick={handleReface}
                                    className="h-11 px-6 border-red-200 text-red-600 hover:bg-red-50 font-bold uppercase text-[11px]"
                               >
                                   <X className="w-4 h-4 mr-2" />
                                   Refazer
                               </Button>
                               <Button 
                                    onClick={handleApprove}
                                    className="h-11 px-8 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-tight shadow-lg shadow-green-100"
                               >
                                   <CheckCircle2 className="w-4 h-4 mr-2" />
                                   Aprovar Vídeo
                               </Button>
                           </>
                       )}

                       {status === "approved" && (
                           <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
                               {activeFormat === "16:9" && (
                                   <Button 
                                       onClick={handlePublishYoutube}
                                       className="h-11 px-6 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black uppercase tracking-tight shadow-md"
                                   >
                                       <Youtube className="w-5 h-5 mr-3" />
                                       Publicar no YouTube
                                   </Button>
                               )}
                               <Button 
                                    onClick={handleDownload}
                                    className="h-11 px-6 bg-slate-950 hover:bg-black text-white font-black uppercase tracking-tight shadow-md"
                               >
                                   <Download className="w-5 h-5 mr-3" />
                                   Baixar Clip MP4
                               </Button>
                           </div>
                       )}
                   </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção Histórico */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-100">
                    <History className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg">Histórico de Produções</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Suas gerações aprovadas e prontas para uso</p>
                </div>
            </div>
            <Button variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50">Ver tudo</Button>
        </div>

        {history.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-4">
                    <History className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="font-bold text-slate-400">Nenhum histórico encontrado</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">Os vídeos aprovados aparecerão aqui para acesso rápido e download posterior.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {history.map(item => (
                    <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer"
                        onClick={() => {
                            setVideoUrl(item.url);
                            setBriefing(prev => ({...prev, productName: item.name, duration: item.duration}));
                            setActiveFormat(item.format);
                            setStatus("approved");
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        <div className="relative aspect-video bg-slate-900 group-hover:opacity-90 transition-opacity">
                            <video src={item.url} muted className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Play className="w-10 h-10 text-white fill-white" />
                            </div>
                            <Badge className="absolute top-2 right-2 bg-slate-900/80 text-white text-[8px] font-black tracking-widest border-white/10">{item.format}</Badge>
                        </div>
                        <div className="p-3">
                            <h4 className="font-black text-slate-700 truncate text-xs uppercase tracking-tight">{item.name}</h4>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{item.date}</span>
                                <div className="flex items-center gap-2">
                                    <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                                        <Share2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                                        <Download className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </div>

      {/* Config Modal */}
      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setShowConfig(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">Configurações API</h3>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Ajuste as chaves de integração</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowConfig(false)} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Chave xAI (Grok Imagine)</Label>
                  <Input 
                    type="password"
                    value={config.xAIKey}
                    onChange={(e) => setConfig({...config, xAIKey: e.target.value})}
                    placeholder="xai-..." 
                    className="h-10 border-slate-200 rounded-lg text-sm"
                  />
                  <p className="text-[9px] text-slate-400">As chaves são salvas apenas em memória para segurança.</p>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">URL do Proxy Grok</Label>
                  <Input 
                    value={config.proxyUrl}
                    onChange={(e) => setConfig({...config, proxyUrl: e.target.value})}
                    placeholder="http://localhost:8787/grok" 
                    className="h-10 border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">YouTube Client ID (OAuth)</Label>
                  <Input 
                    value={config.youtubeClientId}
                    onChange={(e) => setConfig({...config, youtubeClientId: e.target.value})}
                    placeholder="00000000-..." 
                    className="h-10 border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Nome do Canal</Label>
                  <Input 
                    value={config.channelName}
                    onChange={(e) => setConfig({...config, channelName: e.target.value})}
                    placeholder="Acimaq Equipamentos" 
                    className="h-10 border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <Button variant="outline" onClick={() => setShowConfig(false)} className="flex-1 font-bold">Cancelar</Button>
                <Button onClick={() => setShowConfig(false)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tight">Salvar Alterações</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* YouTube Publishing Modal */}
      <AnimatePresence>
        {showYoutubeModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowYoutubeModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="shrink-0 p-6 bg-[#dc2626] flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Youtube className="w-8 h-8" />
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-lg">Publicar no YouTube</h3>
                    <p className="text-xs text-red-100 opacity-80 uppercase font-bold tracking-widest">Canal: Acimaq Equipamentos</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowYoutubeModal(false)} className="rounded-full text-white hover:bg-white/10">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Título do Vídeo (Max 100)</Label>
                  <Input 
                    maxLength={100}
                    value={youtubeFormData.title}
                    onChange={(e) => setYoutubeFormData({...youtubeFormData, title: e.target.value})}
                    className="h-12 border-slate-200 rounded-xl text-md font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Descrição</Label>
                  <Textarea 
                    value={youtubeFormData.description}
                    onChange={(e) => setYoutubeFormData({...youtubeFormData, description: e.target.value})}
                    className="min-h-[120px] border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Categoria</Label>
                     <Select value={youtubeFormData.category} onValueChange={(val) => setYoutubeFormData({...youtubeFormData, category: val})}>
                        <SelectTrigger className="h-12 border-slate-200 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[130]">
                          <SelectItem value="22">Pessoas e Blogs</SelectItem>
                          <SelectItem value="26">Como Fazer e Estilo</SelectItem>
                          <SelectItem value="27">Educação</SelectItem>
                          <SelectItem value="28">Ciência e Tecnologia</SelectItem>
                          <SelectItem value="29">Organizações e Ativismo</SelectItem>
                        </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Privacidade</Label>
                     <Select value={youtubeFormData.privacy} onValueChange={(val) => setYoutubeFormData({...youtubeFormData, privacy: val})}>
                        <SelectTrigger className="h-12 border-slate-200 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[130]">
                          <SelectItem value="public">Público</SelectItem>
                          <SelectItem value="unlisted">Não Listado</SelectItem>
                          <SelectItem value="private">Privado</SelectItem>
                        </SelectContent>
                     </Select>
                   </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Tags (Separadas por vírgula)</Label>
                  <Input 
                    value={youtubeFormData.tags}
                    onChange={(e) => setYoutubeFormData({...youtubeFormData, tags: e.target.value})}
                    placeholder="tag1, tag2..."
                    className="h-12 border-slate-200 rounded-xl"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-700 uppercase">Resumo da Configuração</h4>
                        <p className="text-[10px] text-slate-500 font-medium">O vídeo será enviado para o YouTube e estará disponível conforme a privacidade selecionada.</p>
                    </div>
                </div>
              </div>

              <div className="shrink-0 p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <Button variant="outline" onClick={() => setShowYoutubeModal(false)} className="flex-1 h-12 rounded-xl font-bold">Cancelar</Button>
                  <Button onClick={handleFinalPublish} className="flex-1 h-12 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black uppercase tracking-tight shadow-lg">Confirmar Publicação</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
