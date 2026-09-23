import React, { useRef } from "react";
import { 
  Upload, 
  Ruler, 
  Weight, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Maximize2, 
  PlusCircle,
  Image as ImageIcon,
  Star,
  Home,
  Megaphone,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { type GenerationResult, validateProductFidelity } from "@/lib/gemini";
import { resizeAndCompressImage } from "../lib/imageCompressor";
import { PromptGeneratorTab } from "./PromptGeneratorTab";

interface ImageTabProps {
  imageLoading: boolean;
  imageResult: GenerationResult | null;
  imageError: string | null;
  preview: string | null;
  filename: string | null;
  imageFormData: {
    altura: string;
    largura: string;
    profundidade: string;
    peso: string;
    descricao: string;
  };
  setImageFormData: React.Dispatch<React.SetStateAction<any>>;
  handleSubmit: (
    e: React.FormEvent, 
    mode?: 'principal' | 'ambientada' | 'beneficios' | 'publicitaria' | 'medidas' | 'outros',
    extra?: any
  ) => Promise<void>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownload: (url: string, filename: string) => void;
  setSelectedImage: (val: {url: string, id: number} | null) => void;
  clearImageResult: () => void;
  filenameCopyAlert: number | null;
  setFilenameCopyAlert: (val: number | null) => void;
  uploadFilenameCopyAlert: boolean;
  setUploadFilenameCopyAlert: (val: boolean) => void;
  quotaExceeded: boolean;
  setPreview: (val: string | null) => void;
  setFilename: (val: string | null) => void;
}

export const ImageTab = ({
  imageLoading,
  imageResult,
  imageError,
  preview,
  filename,
  imageFormData,
  setImageFormData,
  handleSubmit,
  handleFileChange,
  handleDownload,
  setSelectedImage,
  clearImageResult,
  filenameCopyAlert,
  setFilenameCopyAlert,
  uploadFilenameCopyAlert,
  setUploadFilenameCopyAlert,
  quotaExceeded,
  setPreview,
  setFilename
}: ImageTabProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submenu, setSubmenu] = React.useState<'principal' | 'ambientada' | 'beneficios' | 'publicitaria' | 'medidas' | 'outros'>('principal');
  const hasRightSide = ["medidas", "beneficios"].includes(submenu);
  const [isGenerationMode, setIsGenerationMode] = React.useState(false);
  const [showBackConfirm, setShowBackConfirm] = React.useState(false);
  const [showValidationAlert, setShowValidationAlert] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [validationReason, setValidationReason] = React.useState("");

  const [isDraggingPrimary, setIsDraggingPrimary] = React.useState(false);

  const processFile = React.useCallback((file: File) => {
    if (!file) return;
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
  }, [setFilename, setPreview]);

  const handleDragOverPrimary = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingPrimary) setIsDraggingPrimary(true);
  }, [isDraggingPrimary]);

  const handleDragLeavePrimary = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingPrimary(false);
  }, []);

  const handleDropPrimary = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPrimary(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  }, [processFile]);

  const onGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview || imageLoading || isValidating) return;

    if (submenu !== 'outros') {
      await startFinalGeneration(e);
      return;
    }

    setIsValidating(true);
    try {
      const mimeType = preview.split(';')[0].split(':')[1];
      const validation = await validateProductFidelity({
        image: preview,
        mimeType,
        ...imageFormData
      });

      if (!validation.isCompatible) {
        setValidationReason(validation.reason || "");
        setShowValidationAlert(true);
      } else {
        startFinalGeneration(e);
      }
    } catch (err) {
      console.error("Erro na validação:", err);
      startFinalGeneration(e);
    } finally {
      setIsValidating(false);
    }
  };

  const startFinalGeneration = async (e: React.FormEvent) => {
    setIsGenerationMode(true);
    setShowValidationAlert(false);
    await handleSubmit(e, submenu);
  };

  const handleBackClick = () => {
    setShowBackConfirm(true);
  };

  const handleConfirmBack = () => {
    setIsGenerationMode(false);
    setShowBackConfirm(false);
    clearImageResult();
    setPreview(null);
    setFilename(null);
    setImageFormData({
      altura: "",
      largura: "",
      profundidade: "",
      peso: "",
      descricao: ""
    });
  };

  return (
    <div className="relative">
      {/* Confirmation Modal (Back) */}
      <AnimatePresence>
        {showBackConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4 text-orange-600">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Confirmar retorno</h3>
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  Se você voltar, a imagem enviada, os campos preenchidos e as imagens geradas serão apagados. Deseja voltar para a tela principal?
                </p>

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-12 font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    onClick={() => setShowBackConfirm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-100"
                    onClick={handleConfirmBack}
                  >
                    Ok, voltar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Discrepancy Modal */}
      <AnimatePresence>
        {showValidationAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4 text-orange-600">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Possível divergência detectada</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed font-semibold">
                    A descrição ou especificação preenchida parece diferente da imagem enviada. Para evitar imagens incorretas, confirme se as informações estão corretas antes de gerar. Deseja continuar mesmo assim?
                  </p>
                  {validationReason && (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg text-sm text-orange-700 italic">
                      AI detectou: "{validationReason}"
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-12 font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    onClick={() => setShowValidationAlert(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-100"
                    onClick={(e) => startFinalGeneration(e as any)}
                  >
                    Ok, gerar mesmo assim
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isGenerationMode && (
        <div className="flex justify-center mb-4">
          <div className="flex flex-wrap items-center justify-center gap-1 max-w-fit">
            {[
              { id: "principal", label: "Principal", icon: ImageIcon },
              { id: "ambientada", label: "Ambientada", icon: Home },
              { id: "beneficios", label: "Benefícios", icon: Star },
              { id: "publicitaria", label: "Publicitária", icon: Megaphone },
              { id: "medidas", label: "Medidas", icon: Ruler },
              { id: "outros", label: "Todos", icon: Layers }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSubmenu(tab.id as any);
                    clearImageResult();
                    setIsGenerationMode(false);
                    setPreview(null);
                    setFilename(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-none ${
                    submenu === tab.id 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${
                    submenu === tab.id 
                      ? "text-blue-600" 
                      : "text-slate-400"
                  }`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={isGenerationMode ? "generation" : submenu}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="w-full"
        >
          {submenu === 'outros' ? (
            <PromptGeneratorTab />
          ) : !isGenerationMode ? (
        <form onSubmit={onGenerate} className="w-full">
          <div className={hasRightSide ? "grid lg:grid-cols-12 gap-8 w-full items-start" : "w-full"}>
            {/* Left Side: Upload & Action */}
            <div className={hasRightSide ? (submenu === 'beneficios' ? "lg:col-span-6 space-y-4" : "lg:col-span-4 space-y-4") : "w-full space-y-4"}>
              <Card className="border-0 shadow-none rounded-none overflow-hidden bg-transparent">
                <CardContent className="p-0 space-y-4">
                    <div className="space-y-3">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOverPrimary}
                        onDragLeave={handleDragLeavePrimary}
                        onDrop={handleDropPrimary}
                        className={`relative w-full h-[280px] rounded-xl border-2 border-dashed transition-all cursor-pointer group overflow-hidden flex flex-col items-center justify-center gap-4 bg-transparent
                          ${isDraggingPrimary 
                            ? 'border-blue-600 bg-blue-50/60 ring-4 ring-blue-100 scale-[1.005]' 
                            : preview 
                              ? 'border-orange-500 bg-orange-50/20' 
                              : 'border-gray-200 hover:border-black hover:bg-gray-50'}`}
                      >
                        {preview && !isDraggingPrimary ? (
                          <>
                            <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-6" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <p className="text-white text-sm font-bold">Alterar Referência</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all border ${isDraggingPrimary ? 'bg-blue-100 border-blue-200 scale-110' : 'bg-gray-50 group-hover:scale-110 border-gray-100'}`}>
                              <Upload className={`w-6 h-6 ${isDraggingPrimary ? 'text-blue-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="text-center px-4">
                              <p className={`text-sm font-bold ${isDraggingPrimary ? 'text-blue-700' : 'text-gray-900'}`}>
                                {isDraggingPrimary ? 'Solte a imagem aqui' : 'Enviar imagem principal'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {isDraggingPrimary ? 'Formatos aceitos: JPG, PNG, WEBP' : 'Arraste a imagem ou clique para enviar'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {preview && filename && (
                          <motion.div 
                             initial={{ opacity: 0, y: -10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: -10 }}
                            className="flex items-center justify-between p-3 bg-slate-100/70 rounded-lg border border-gray-200 shadow-sm"
                          >
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                              <span className="text-xs font-bold text-gray-600 truncate max-w-[180px]">{filename}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="sm"
                                className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600 transition-all border border-gray-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(filename);
                                  setUploadFilenameCopyAlert(true);
                                  setTimeout(() => setUploadFilenameCopyAlert(false), 2000);
                                }}
                              >
                                <CheckCircle2 className={`w-3 h-3 mr-1.5 ${uploadFilenameCopyAlert ? 'text-green-600' : 'text-gray-400'}`} />
                                {uploadFilenameCopyAlert ? 'COPIADO' : 'COPIAR'}
                              </Button>
                              <button 
                                type="button"
                                className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreview(null);
                                  setFilename(null);
                                  if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                              >
                                Excluir
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*"
                      />
                    </div>

                  <AnimatePresence>
                    {preview && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 pt-1"
                      >
                        <Button 
                          type="submit" 
                          disabled={imageLoading || isValidating}
                          className={`w-full h-14 font-black rounded-lg shadow-xl shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70 
                            ${imageResult ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                        >
                          {imageLoading || isValidating ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                              {isValidating ? "Validando..." : "Gerando..."}
                            </>
                          ) : (
                            "Gerar"
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {imageError && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-lg bg-red-50 border border-red-100 flex gap-3 text-red-600 text-sm font-medium"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p>{imageError}</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Side: Specs, Dimensions & Explanation */}
            {hasRightSide && (
              <div className={submenu === 'beneficios' ? "lg:col-span-6 animate-fade-in" : "lg:col-span-8 space-y-6 animate-fade-in"}>
                {submenu === 'medidas' && (
                  <Card className="border-0 shadow-none rounded-lg overflow-hidden bg-transparent">
                    <CardContent className="p-0">
                      {/* Inputs de Medidas empilhados um embaixo do outro */}
                      <div className="space-y-3 animate-fade-in max-w-sm">
                        <div className="relative">
                          <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input 
                            placeholder="Altura (cm)"
                            className="pl-10 h-11 bg-white border border-gray-200 focus:border-gray-400 placeholder:text-gray-400 transition-all rounded-lg font-medium text-sm shadow-none" 
                            value={imageFormData.altura}
                            onChange={e => setImageFormData((prev: any) => ({...prev, altura: e.target.value}))}
                          />
                        </div>

                        <div className="relative">
                          <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90" />
                          <Input 
                            placeholder="Largura (cm)"
                            className="pl-10 h-11 bg-white border border-gray-200 focus:border-gray-400 placeholder:text-gray-400 transition-all rounded-lg font-medium text-sm shadow-none" 
                            value={imageFormData.largura}
                            onChange={e => setImageFormData((prev: any) => ({...prev, largura: e.target.value}))}
                          />
                        </div>

                        <div className="relative">
                          <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input 
                            placeholder="Profundidade (cm)"
                            className="pl-10 h-11 bg-white border border-gray-200 focus:border-gray-400 placeholder:text-gray-400 transition-all rounded-lg font-medium text-sm shadow-none" 
                            value={imageFormData.profundidade}
                            onChange={e => setImageFormData((prev: any) => ({...prev, profundidade: e.target.value}))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {submenu === 'beneficios' && (
                  <Card className="border-0 shadow-none rounded-lg overflow-hidden bg-transparent">
                    <CardContent className="p-0">
                      <Textarea 
                        placeholder="Principais características do produto"
                        className="w-full h-[280px] resize-none border border-gray-200 focus:border-gray-400 transition-all rounded-xl p-4 font-medium text-sm leading-relaxed placeholder:text-gray-400 bg-white shadow-none"
                        value={imageFormData.descricao}
                        onChange={e => setImageFormData((prev: any) => ({...prev, descricao: e.target.value}))}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </form>
      ) : (
        /* Generation/Result Mode */
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Left Side: Sent Image (Sticky) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="space-y-6">
              <div className="aspect-square flex items-center justify-center overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Enviada" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-300">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-[10px] font-black tracking-widest uppercase">Sem imagem</span>
                  </div>
                )}
              </div>

              {/* Botão Voltar moved below image */}
              <div className="flex items-center justify-center pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleBackClick}
                  className="w-full max-w-[200px] h-11 px-6 font-bold text-gray-600 border-gray-200 hover:bg-white hover:text-gray-900 transition-all rounded-lg shadow-sm"
                >
                  Voltar
                </Button>
              </div>
            </div>

            {imageError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg bg-red-50 border border-red-100 flex gap-3 text-red-600 text-sm font-medium"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{imageError}</p>
              </motion.div>
            )}
          </div>

          {/* Right Side: Generation Grid */}
          <div className="lg:col-span-8">
            <div className="space-y-8">
              {imageLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                  {[...Array(1)].map((_, i) => (
                    <div 
                      key={i}
                      className="aspect-square rounded-lg bg-white border border-gray-100 flex items-center justify-center relative overflow-hidden shadow-sm"
                    >
                      <div className="absolute inset-0 bg-gray-50/10" />
                      <div className="relative flex flex-col items-center gap-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="text-blue-600"
                        >
                          <Loader2 className="w-8 h-8" />
                        </motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {imageResult && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-12 pb-20"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {imageResult.images.map((img, idx) => (
                      <div 
                        key={`${img.id}-${idx}`}
                        className="group relative bg-white rounded-lg overflow-hidden border border-gray-100 transition-all hover:border-blue-300 shadow-sm"
                      >
                        <div className="aspect-square relative overflow-hidden bg-[#FDFDFD]">
                          <img 
                            src={img.url} 
                            alt={img.title} 
                            className="w-full h-full object-contain p-6"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <Button 
                              type="button"
                              size="icon" 
                              variant="secondary" 
                              className="rounded-lg bg-white/95 backdrop-blur-md shadow-lg"
                              onClick={() => {
                                const finalName = filename 
                                  ? (img.id === 1 ? `${filename}.jpg` : `${filename}-${img.id - 1}.jpg`)
                                  : `produto_${img.id}.jpg`;
                                handleDownload(img.url, finalName);
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              type="button"
                              size="icon" 
                              variant="secondary" 
                              className="rounded-lg bg-white/95 backdrop-blur-md shadow-lg"
                              onClick={() => setSelectedImage({url: img.url, id: img.id})}
                            >
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-6 bg-white space-y-3">
                          <p className="text-xs text-gray-500 leading-relaxed font-medium">{img.description}</p>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">ID Arquivo</span>
                              <span className="text-[11px] font-bold text-gray-500">
                                {filename 
                                  ? (img.id === 1 ? `${filename}.jpg` : `${filename}-${img.id - 1}.jpg`)
                                  : `produto_${img.id}.jpg`}
                              </span>
                            </div>
                            
                            <div className="relative">
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="sm"
                                className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-100"
                                onClick={() => {
                                  const finalName = filename 
                                    ? (img.id === 1 ? `${filename}.jpg` : `${filename}-${img.id - 1}.jpg`)
                                    : `produto_${img.id}.jpg`;
                                  navigator.clipboard.writeText(finalName);
                                  setFilenameCopyAlert(img.id);
                                  setTimeout(() => setFilenameCopyAlert(null), 2000);
                                }}
                              >
                                <PlusCircle className="w-3 h-3 mr-1.5" />
                                COPIAR
                              </Button>
                              
                              <AnimatePresence>
                                {filenameCopyAlert === img.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className="absolute bottom-full right-0 mb-2 z-50 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 whitespace-nowrap"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    Copiado!
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
