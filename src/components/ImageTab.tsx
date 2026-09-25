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
              <div className="p-5 space-y-3.5">
                <div className="flex items-center gap-3 text-orange-600">
                  <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Confirmar retorno</h3>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Se você voltar, a imagem enviada, os campos preenchidos e as imagens geradas serão apagados. Deseja voltar para a tela principal?
                </p>

                <div className="flex gap-2 pt-1">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-9 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg"
                    onClick={() => setShowBackConfirm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1 h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm rounded-lg"
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
              <div className="p-5 space-y-3.5">
                <div className="flex items-center gap-3 text-orange-600">
                  <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Possível divergência detectada</h3>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    A descrição ou especificação preenchida parece diferente da imagem enviada. Para evitar imagens incorretas, confirme se as informações estão corretas antes de gerar. Deseja continuar mesmo assim?
                  </p>
                  {validationReason && (
                    <div className="p-2.5 bg-orange-50 border border-orange-100 rounded-md text-xs text-orange-700 italic">
                      AI detectou: "{validationReason}"
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-9 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg"
                    onClick={() => setShowValidationAlert(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1 h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm rounded-lg"
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
        <div className="flex justify-center mb-3">
          <div className="flex flex-wrap items-center justify-center gap-1 max-w-fit bg-transparent p-0">
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
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-none ${
                    submenu === tab.id 
                      ? "bg-white text-blue-700 shadow-none border border-slate-200" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
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
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="w-full"
        >
          {submenu === 'outros' ? (
            <PromptGeneratorTab />
          ) : !isGenerationMode ? (
        <form onSubmit={onGenerate} className="w-full mx-auto max-w-5xl">
          <div className={hasRightSide ? "grid lg:grid-cols-12 gap-3.5 w-full items-start" : "w-full space-y-2.5"}>
            {/* Left Side: Upload & Action */}
            <div className={hasRightSide ? "lg:col-span-5 space-y-2.5" : "w-full space-y-2.5"}>
              <Card className="border-0 shadow-none rounded-none overflow-hidden bg-transparent">
                <CardContent className="p-0 space-y-2.5">
                    <div className="space-y-2">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOverPrimary}
                        onDragLeave={handleDragLeavePrimary}
                        onDrop={handleDropPrimary}
                        className={`relative w-full h-[200px] rounded-xl border-2 border-dashed transition-all cursor-pointer group overflow-hidden flex flex-col items-center justify-center gap-2 bg-transparent
                          ${isDraggingPrimary 
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-100 scale-[1.005]' 
                            : preview 
                              ? 'border-orange-500 bg-orange-50/20' 
                              : 'border-gray-200 hover:border-blue-500 hover:bg-gray-50/60'}`}
                      >
                        {preview && !isDraggingPrimary ? (
                          <>
                            <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <p className="text-white text-xs font-bold">Alterar Referência</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${isDraggingPrimary ? 'bg-blue-100 border-blue-200 scale-105' : 'bg-gray-50 group-hover:scale-105 border-gray-100'}`}>
                              <Upload className={`w-5 h-5 ${isDraggingPrimary ? 'text-blue-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="text-center px-3">
                              <p className={`text-xs font-bold ${isDraggingPrimary ? 'text-blue-700' : 'text-gray-900'}`}>
                                {isDraggingPrimary ? 'Solte a imagem aqui' : 'Enviar imagem principal'}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {isDraggingPrimary ? 'JPG, PNG ou WEBP' : 'Arraste a imagem ou clique para enviar'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {preview && filename && (
                          <motion.div 
                             initial={{ opacity: 0, y: -6 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: -6 }}
                            className="flex items-center justify-between p-2 px-3 bg-slate-100/80 rounded-lg border border-gray-200"
                          >
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                              <span className="text-[11px] font-bold text-gray-700 truncate max-w-[170px]">{filename}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="sm"
                                className="h-7 px-2.5 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-orange-50 hover:text-orange-600 transition-all border border-gray-200/60"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(filename);
                                  setUploadFilenameCopyAlert(true);
                                  setTimeout(() => setUploadFilenameCopyAlert(false), 2000);
                                }}
                              >
                                <CheckCircle2 className={`w-3 h-3 mr-1 ${uploadFilenameCopyAlert ? 'text-green-600' : 'text-gray-400'}`} />
                                {uploadFilenameCopyAlert ? 'COPIADO' : 'COPIAR'}
                              </Button>
                              <button 
                                type="button"
                                className="text-[10px] font-bold uppercase text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-all"
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

                  {/* Gerar Button on left (for tabs other than medidas) */}
                  <AnimatePresence>
                    {preview && submenu !== 'medidas' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-2 pt-0.5"
                      >
                        <Button 
                          type="submit" 
                          disabled={imageLoading || isValidating}
                          className={`w-full h-10 font-bold text-xs rounded-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-70 
                            ${imageResult ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
                        >
                          {imageLoading || isValidating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {isValidating ? "Validando..." : "Gerando..."}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-1.5" />
                              Gerar Imagem
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {imageError && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-2.5 rounded-lg bg-red-50 border border-red-100 flex gap-2 text-red-600 text-xs font-medium"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>{imageError}</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Side: Specs, Dimensions & Explanation */}
            {hasRightSide && (
              <div className="lg:col-span-7 space-y-2.5 animate-fade-in">
                {submenu === 'medidas' && (
                  <Card className="border border-gray-200 shadow-none rounded-xl overflow-hidden bg-white">
                    <CardContent className="p-3.5 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <Ruler className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-gray-900">Dimensões do Produto</h3>
                          <p className="text-[11px] text-gray-400 leading-tight">Preencha as medidas para inserção das cotas na imagem</p>
                        </div>
                      </div>

                      {/* Inputs de Medidas em 3 colunas compactas */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="medida-altura" className="text-[11px] font-bold text-gray-700">
                            Altura
                          </Label>
                          <div className="relative">
                            <Input 
                              id="medida-altura"
                              placeholder="0"
                              className="pr-7 h-9 bg-white border border-gray-200 focus:border-blue-500 rounded-md font-medium text-xs shadow-none" 
                              value={imageFormData.altura}
                              onChange={e => setImageFormData((prev: any) => ({...prev, altura: e.target.value}))}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">
                              cm
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="medida-largura" className="text-[11px] font-bold text-gray-700">
                            Largura
                          </Label>
                          <div className="relative">
                            <Input 
                              id="medida-largura"
                              placeholder="0"
                              className="pr-7 h-9 bg-white border border-gray-200 focus:border-blue-500 rounded-md font-medium text-xs shadow-none" 
                              value={imageFormData.largura}
                              onChange={e => setImageFormData((prev: any) => ({...prev, largura: e.target.value}))}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">
                              cm
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="medida-profundidade" className="text-[11px] font-bold text-gray-700">
                            Profundidade
                          </Label>
                          <div className="relative">
                            <Input 
                              id="medida-profundidade"
                              placeholder="0"
                              className="pr-7 h-9 bg-white border border-gray-200 focus:border-blue-500 rounded-md font-medium text-xs shadow-none" 
                              value={imageFormData.profundidade}
                              onChange={e => setImageFormData((prev: any) => ({...prev, profundidade: e.target.value}))}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">
                              cm
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-md flex items-center gap-2 text-[11px] text-slate-500">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Cotas dimensionais externas com fundo branco puro (#FFFFFF).</span>
                      </div>

                      {/* Botão Gerar na aba Medidas posicionado diretamente abaixo dos campos */}
                      <div className="pt-0.5">
                        <Button 
                          type="submit" 
                          disabled={!preview || imageLoading || isValidating}
                          className={`w-full h-9.5 font-bold text-xs rounded-md shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
                            ${imageResult 
                              ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-100' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'}`}
                        >
                          {imageLoading || isValidating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                              {isValidating ? "Validando..." : "Gerando..."}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-1.5" />
                              Gerar Imagem com Medidas
                            </>
                          )}
                        </Button>
                        {!preview && (
                          <p className="text-[10px] text-center text-slate-400 mt-1 font-medium">
                            Envie a imagem principal para habilitar a geração
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {submenu === 'beneficios' && (
                  <Card className="border border-gray-200 shadow-none rounded-xl overflow-hidden bg-white">
                    <CardContent className="p-3.5 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <Star className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-gray-900">Benefícios e Destaques</h3>
                          <p className="text-[11px] text-gray-400 leading-tight">Informe as características a destacar na imagem</p>
                        </div>
                      </div>
                      <Textarea 
                        placeholder="Principais características e diferenciais do produto..."
                        className="w-full h-[95px] resize-none border border-gray-200 focus:border-blue-500 transition-all rounded-md p-2.5 font-medium text-xs leading-relaxed placeholder:text-gray-400 bg-white shadow-none"
                        value={imageFormData.descricao}
                        onChange={e => setImageFormData((prev: any) => ({...prev, descricao: e.target.value}))}
                      />
                      <Button 
                        type="submit" 
                        disabled={!preview || imageLoading || isValidating}
                        className="w-full h-9.5 font-bold text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
                      >
                        {imageLoading || isValidating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            {isValidating ? "Validando..." : "Gerando..."}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-1.5" />
                            Gerar Imagem com Benefícios
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </form>
      ) : (
        /* Generation/Result Mode */
        <div className="grid lg:grid-cols-12 gap-4 items-start max-w-5xl mx-auto">
          {/* Left Side: Sent Image (Sticky) */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-3">
            <div className="space-y-2.5">
              <div className="aspect-square flex items-center justify-center overflow-hidden rounded-xl bg-white border border-gray-200 p-2">
                {preview ? (
                  <img src={preview} alt="Enviada" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-gray-300">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">Sem imagem</span>
                  </div>
                )}
              </div>

              {/* Botão Voltar below image */}
              <div className="flex items-center justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleBackClick}
                  className="w-full h-9 px-4 font-bold text-xs text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all rounded-lg shadow-none"
                >
                  Voltar
                </Button>
              </div>
            </div>

            {imageError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-2.5 rounded-lg bg-red-50 border border-red-100 flex gap-2 text-red-600 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{imageError}</p>
              </motion.div>
            )}
          </div>

          {/* Right Side: Generation Grid */}
          <div className="lg:col-span-8">
            <div className="space-y-4">
              {imageLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
                  {[...Array(1)].map((_, i) => (
                    <div 
                      key={i}
                      className="aspect-square rounded-xl bg-white border border-gray-100 flex items-center justify-center relative overflow-hidden shadow-none"
                    >
                      <div className="relative flex flex-col items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="text-blue-600"
                        >
                          <Loader2 className="w-6 h-6" />
                        </motion.div>
                        <span className="text-xs font-bold text-gray-500">Gerando visual...</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {imageResult && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 pb-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {imageResult.images.map((img, idx) => (
                      <div 
                        key={`${img.id}-${idx}`}
                        className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 transition-all hover:border-blue-400 shadow-none"
                      >
                        <div className="aspect-square relative overflow-hidden bg-[#FDFDFD]">
                          <img 
                            src={img.url} 
                            alt={img.title} 
                            className="w-full h-full object-contain p-2"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                            <Button 
                              type="button"
                              size="icon" 
                              variant="secondary" 
                              className="h-8 w-8 rounded-lg bg-white/95 backdrop-blur-md shadow-md"
                              onClick={() => {
                                const finalName = filename 
                                  ? (img.id === 1 ? `${filename}.jpg` : `${filename}-${img.id - 1}.jpg`)
                                  : `produto_${img.id}.jpg`;
                                handleDownload(img.url, finalName);
                              }}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              type="button"
                              size="icon" 
                              variant="secondary" 
                              className="h-8 w-8 rounded-lg bg-white/95 backdrop-blur-md shadow-md"
                              onClick={() => setSelectedImage({url: img.url, id: img.id})}
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 bg-white space-y-2">
                          <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-2">{img.description}</p>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Arquivo</span>
                              <span className="text-[11px] font-bold text-gray-600 truncate max-w-[130px]">
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
                                className="h-7 px-2.5 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-100"
                                onClick={() => {
                                  const finalName = filename 
                                    ? (img.id === 1 ? `${filename}.jpg` : `${filename}-${img.id - 1}.jpg`)
                                    : `produto_${img.id}.jpg`;
                                  navigator.clipboard.writeText(finalName);
                                  setFilenameCopyAlert(img.id);
                                  setTimeout(() => setFilenameCopyAlert(null), 2000);
                                }}
                              >
                                <PlusCircle className="w-3 h-3 mr-1" />
                                COPIAR
                              </Button>
                              
                              <AnimatePresence>
                                {filenameCopyAlert === img.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                    className="absolute bottom-full right-0 mb-1.5 z-50 bg-green-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md flex items-center gap-1 whitespace-nowrap"
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
