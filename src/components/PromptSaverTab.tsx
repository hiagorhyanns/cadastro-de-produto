import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Copy, 
  Check, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  AlignLeft,
  Search,
  Loader2,
  AlertCircle,
  Cloud,
  Sparkles,
  Image,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  getPrompts, 
  savePrompt, 
  deletePrompt,
  uploadImage,
  getUploads,
  UploadData,
  PromptData 
} from "../services/firebaseService";

interface SavedPrompt {
  id: string;
  name: string;
  type: string;
  content: string;
  driveLink: string | null;
  imageLink: string | null;
  createdAt: string;
  submenu?: string;
  ordem?: number | null;
}

export function PromptSaverTab() {
  const [prompts, setPrompts] = React.useState<SavedPrompt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generateFormData, setGenerateFormData] = React.useState({
    title: "",
    category: "",
    objective: "",
    context: "",
    theme: "",
    audience: "",
    tone: "",
    restrictions: "",
    expectedResult: "",
    generatedPrompt: ""
  });
  const [generateError, setGenerateError] = React.useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = React.useState<SavedPrompt | null>(null);
  const [copyStatus, setCopyStatus] = React.useState<string | null>(null);
  const [saveAlert, setSaveAlert] = React.useState(false);
  const [expandedPrompts, setExpandedPrompts] = React.useState<Record<string, boolean>>({});
  const toggleExpandPrompt = (id: string) => {
    setExpandedPrompts(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [showSaveDetailsModal, setShowSaveDetailsModal] = React.useState(false);
  const [saveDetails, setSaveDetails] = React.useState<{
    title: string;
    category: string;
    driveLink: string;
    imageLink: string;
    submenu: string;
    ordem: number | null;
  }>({
    title: "",
    category: "",
    driveLink: "",
    imageLink: "",
    submenu: "Cadastro de produto",
    ordem: null
  });

  const PROMPT_SUBMENU_KEY = "cpa_prompt_active_submenu";

  const getInitialPromptSubmenu = (): string => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "prompts") {
        const urlSub = params.get("sub");
        if (urlSub) return urlSub;
      }
      const saved = localStorage.getItem(PROMPT_SUBMENU_KEY);
      if (saved) return saved;
    } catch (e) {
      console.error("Error reading saved prompt submenu:", e);
    }
    return "Cadastro de produto";
  };

  const [selectedSubmenu, setSelectedSubmenuState] = React.useState<string>(getInitialPromptSubmenu);

  const setSelectedSubmenu = React.useCallback((sub: string) => {
    setSelectedSubmenuState(sub);
    try {
      localStorage.setItem(PROMPT_SUBMENU_KEY, sub);
      const url = new URL(window.location.href);
      if (url.searchParams.get("tab") === "prompts") {
        url.searchParams.set("sub", sub);
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {
      console.error("Error persisting prompt submenu:", e);
    }
  }, []);

  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("tab") === "prompts" && !url.searchParams.has("sub")) {
        url.searchParams.set("sub", selectedSubmenu);
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {
      console.error("Error updating prompt submenu URL:", e);
    }
  }, [selectedSubmenu]);

  const [customSubmenus, setCustomSubmenus] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("prompt_custom_submenus");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isAddingGlobalSubmenu, setIsAddingGlobalSubmenu] = React.useState(false);
  const [newGlobalSubmenuName, setNewGlobalSubmenuName] = React.useState("");

  const [isAddingSubEdit, setIsAddingSubEdit] = React.useState(false);
  const [newSubNameEdit, setNewSubNameEdit] = React.useState("");
  
  const [isAddingSubSave, setIsAddingSubSave] = React.useState(false);
  const [newSubNameSave, setNewSubNameSave] = React.useState("");

  const handleCreateSubmenu = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = ["Cadastro de produto", "Pessoal", ...customSubmenus].some(
      sub => sub.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      alert("Este submenu já existe.");
      return;
    }
    const updated = [...customSubmenus, trimmed];
    setCustomSubmenus(updated);
    localStorage.setItem("prompt_custom_submenus", JSON.stringify(updated));
  };

  const allSubmenus = React.useMemo(() => {
    const defaults = ["Cadastro de produto", "Pessoal"];
    const customSet = new Set<string>();
    
    // Add from localStorage custom list
    customSubmenus.forEach(sub => {
      if (sub.trim()) customSet.add(sub.trim());
    });
    
    // Add from prompts themselves
    prompts.forEach(p => {
      if (p.submenu && !defaults.includes(p.submenu)) {
        customSet.add(p.submenu.trim());
      }
    });
    
    return [...defaults, ...Array.from(customSet)];
  }, [customSubmenus, prompts]);

  const fetchPromptsData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getPrompts();
      const mappedData: SavedPrompt[] = data.map((item: any) => ({
        id: item.id,
        name: item.nome,
        type: item.tipo,
        content: item.conteudo,
        driveLink: item.drive_link || null,
        imageLink: item.imagem_link || null,
        createdAt: item.criado_em,
        submenu: item.submenu || "Cadastro de produto",
        ordem: typeof item.ordem === 'number' ? item.ordem : (item.ordem ? parseInt(item.ordem, 10) : null)
      }));
      
      const seen = new Set<string>();
      const uniquePrompts = mappedData.filter(item => {
        if (!item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      
      setPrompts(uniquePrompts);
      setError(null);
    } catch (err: any) {
      setError("Erro ao carregar prompts do banco de dados Firebase.");
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Load prompts on mount
  React.useEffect(() => {
    fetchPromptsData();
  }, []);

  const handleAddPrompt = () => {
    setCurrentPrompt({
      id: '',
      name: "",
      type: "",
      content: "",
      driveLink: null,
      imageLink: null,
      createdAt: new Date().toISOString(),
      submenu: selectedSubmenu || "Cadastro de produto",
      ordem: null
    });
    setIsEditing(true);
  };

  const handleEditPrompt = (prompt: SavedPrompt) => {
    setCurrentPrompt({ 
      ...prompt,
      submenu: prompt.submenu || "Cadastro de produto",
      imageLink: prompt.imageLink || null,
      ordem: prompt.ordem ?? null
    });
    setIsEditing(true);
  };

  const generatePromptBody = () => {
    const parts = [];
    if (generateFormData.category?.trim()) {
      parts.push(`Você é um especialista em ${generateFormData.category.trim()}.`);
    }
    if (generateFormData.objective?.trim()) {
      parts.push(`Crie um conteúdo com o objetivo de ${generateFormData.objective.trim()}.`);
    }
    if (generateFormData.context?.trim()) {
      parts.push(`Considere o seguinte contexto: ${generateFormData.context.trim()}.`);
    }
    if (generateFormData.theme?.trim()) {
      parts.push(`O tema principal é ${generateFormData.theme.trim()}.`);
    }
    if (generateFormData.audience?.trim()) {
      parts.push(`O público-alvo é ${generateFormData.audience.trim()}.`);
    }
    if (generateFormData.tone?.trim()) {
      parts.push(`Use um tom ${generateFormData.tone.trim()}.`);
    }
    if (generateFormData.restrictions?.trim()) {
      parts.push(`Respeite obrigatoriamente as seguintes restrições: ${generateFormData.restrictions.trim()}.`);
    }
    if (generateFormData.expectedResult?.trim()) {
      parts.push(`O resultado final deve ser: ${generateFormData.expectedResult.trim()}.`);
    }
    return parts.join(" ");
  };

  const handleOpenSaveDetails = () => {
    let finalPrompt = generateFormData.generatedPrompt;
    if (!finalPrompt || !finalPrompt.trim()) {
      finalPrompt = generatePromptBody();
      setGenerateFormData(prev => ({ ...prev, generatedPrompt: finalPrompt }));
    }
    
    setSaveDetails({
      title: generateFormData.title || "",
      category: generateFormData.category || "",
      driveLink: "",
      imageLink: "",
      submenu: selectedSubmenu || "Cadastro de produto",
      ordem: null
    });
    setShowSaveDetailsModal(true);
  };

  const handleSavePromptFromPerfectModal = async () => {
    try {
      setIsSaving(true);
      const promptToSave: PromptData = {
        nome: saveDetails.title || "Prompt Sem Título",
        tipo: saveDetails.category || "Sem Categoria",
        conteudo: generateFormData.generatedPrompt || generatePromptBody(),
        drive_link: saveDetails.driveLink || null,
        imagem_link: saveDetails.imageLink || null,
        criado_em: new Date().toISOString(),
        submenu: saveDetails.submenu || "Cadastro de produto",
        ordem: typeof saveDetails.ordem === 'number' ? saveDetails.ordem : (saveDetails.ordem ? parseInt(String(saveDetails.ordem), 10) : null)
      };
      
      await savePrompt(promptToSave);
      
      // Copy automatically
      if (promptToSave.conteudo) {
        navigator.clipboard.writeText(promptToSave.conteudo);
      }
      
      setShowSaveDetailsModal(false);
      setIsGenerating(false);
      setSaveAlert(true);
      setTimeout(() => setSaveAlert(false), 3000);
      fetchPromptsData(true);
    } catch (err) {
      setGenerateError("Erro ao salvar prompt no Firebase.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!currentPrompt || !currentPrompt.name || !currentPrompt.content) return;

    try {
      setIsSaving(true);
      setError(null);
      
      const promptToSave: PromptData = {
        id: currentPrompt.id || undefined,
        nome: currentPrompt.name,
        tipo: currentPrompt.type,
        conteudo: currentPrompt.content,
        drive_link: currentPrompt.driveLink || null,
        imagem_link: currentPrompt.imageLink || null,
        criado_em: currentPrompt.createdAt || new Date().toISOString(),
        submenu: currentPrompt.submenu || selectedSubmenu || "Cadastro de produto",
        ordem: typeof currentPrompt.ordem === 'number' ? currentPrompt.ordem : (currentPrompt.ordem ? parseInt(String(currentPrompt.ordem), 10) : null)
      };

      console.log('Attempting to save prompt:', promptToSave);
      await savePrompt(promptToSave);
      
      // Reset state FIRST to provide immediate feedback
      setIsEditing(false);
      setCurrentPrompt(null);
      setSaveAlert(true);
      setTimeout(() => setSaveAlert(false), 3000);

      // Refresh list silently in background
      fetchPromptsData(true);
    } catch (err: any) {
      console.error('Full Firebase Error:', err);
      const errorMessage = err.message || "Ocorreu um erro ao salvar o prompt.";
      setError(`Erro Firebase: ${errorMessage}`);
      
      if (errorMessage.includes("insufficient permissions")) {
        alert("Erro de Permissão: Verifique se as políticas do Firebase Firestore foram aplicadas corretamente.");
      } else {
        alert(`Erro ao salvar: ${errorMessage}`);
      }
      // Depending on the error, we might want to keep the modal open so they don't lose data, 
      // but "saving loop" suggests it's stuck. Let's make sure errors are visible.
    } finally {
      setIsSaving(false);
    }
  };

  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [promptToDelete, setPromptToDelete] = React.useState<SavedPrompt | null>(null);

  const handleDeletePrompt = async (id: string | null) => {
    const targetId = id || (promptToDelete?.id);
    if (!targetId) {
      console.error("Tentativa de excluir prompt sem ID");
      setPromptToDelete(null);
      return;
    }

    try {
      setIsDeleting(targetId);
      console.log(`Deleting prompt with ID: ${targetId}`);
      await deletePrompt(targetId);
      setPrompts(prevPrompts => prevPrompts.filter(p => p.id !== targetId));
      console.log("Prompt deleted successfully");
      setPromptToDelete(null);
      setIsEditing(false);
      setCurrentPrompt(null);
    } catch (err: any) {
      console.error("Error in handleDeletePrompt:", err);
      const errorMessage = err.message || "Erro desconhecido";
      alert(`Erro ao excluir o prompt: ${errorMessage}`);
      setPromptToDelete(null); // Close modal even on error to avoid getting "stuck"
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCopyPrompt = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const filteredPrompts = React.useMemo(() => {
    return prompts
      .filter(p => {
        const sub = (p.submenu || "").trim().toLowerCase();
        const tipo = (p.type || "").trim().toLowerCase();
        // Remove all "pessoal" prompts
        if (sub === "pessoal" || sub.includes("pessoal") || tipo === "pessoal") {
          return false;
        }
        // Keep only product registration prompts
        return true;
      })
      .sort((a, b) => {
        const orderA = (a.ordem !== undefined && a.ordem !== null && a.ordem > 0) ? a.ordem : 999999;
        const orderB = (b.ordem !== undefined && b.ordem !== null && b.ordem > 0) ? b.ordem : 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [prompts]);

  return (
    <div className="space-y-6">
      {/* Visual Feedback for Saving */}
      <AnimatePresence>
        {saveAlert && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100]"
          >
            <Badge className="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg border-0">
              <Check className="w-4 h-4 mr-2" />
              Prompt salvo com sucesso!
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center text-red-600 gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Conectando ao Firebase...</p>
            </div>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <Card className="border-0 shadow-none bg-white rounded-xl">
            <CardContent className="h-40 flex flex-col items-center justify-center text-slate-400">
              <Check className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">Nenhum prompt encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          filteredPrompts.map((prompt) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <Card className="overflow-hidden border-0 shadow-none rounded-xl flex flex-col bg-white">
                {/* 1. Imagem de referência do prompt NO TOPO DO CARD */}
                {prompt.imageLink && (
                  <div className="w-full h-52 sm:h-60 md:h-72 bg-slate-50/50 overflow-hidden flex items-center justify-center border-0">
                    <PromptCardImage src={prompt.imageLink} />
                  </div>
                )}

                {/* 2. Top Header: Título à esquerda, Botões Copiar e Editar à direita (SEM BORDAS) */}
                <CardHeader className="px-5 pt-4 pb-1.5 bg-white border-0 flex-none">
                  <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center flex-wrap gap-2 min-w-0">
                      {prompt.ordem ? (
                        <Badge variant="secondary" className="bg-blue-600 text-white rounded-md text-[10px] font-black px-2 py-0.5 border-0">
                          #{prompt.ordem}
                        </Badge>
                      ) : null}
                      <h3 className="font-bold text-slate-900 text-base">{prompt.name}</h3>
                      {prompt.type && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-md text-[10px] uppercase tracking-wider font-bold border-0">
                          {prompt.type}
                        </Badge>
                      )}
                    </div>

                    {/* Botão Copiar Prompt e Editar do lado direito do título, SEM BORDAS */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCopyPrompt(prompt.content, prompt.id)}
                        className={`h-8 px-2.5 text-xs font-bold rounded-lg border-0 shadow-none transition-all ${
                          copyStatus === prompt.id 
                            ? "bg-green-50 text-green-700 hover:bg-green-100" 
                            : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                        }`}
                      >
                        {copyStatus === prompt.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                            Copiar Prompt
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditPrompt(prompt)}
                        className="h-8 px-2.5 text-xs font-bold rounded-lg border-0 shadow-none bg-transparent text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* 3. Conteúdo: Texto do prompt com ocultação de overflow e botão Ver mais */}
                <CardContent className="px-5 pt-1 pb-4 bg-white border-0 flex flex-col justify-between">
                  {(() => {
                    const isExpanded = Boolean(expandedPrompts[prompt.id]);
                    const isLongText = (prompt.content || "").length > 220 || (prompt.content || "").split("\n").length > 4;
                    return (
                      <div className="bg-white p-0 rounded-none border-0">
                        <div className={`relative transition-all duration-300 ${!isExpanded && isLongText ? "max-h-24 overflow-hidden" : ""}`}>
                          <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                            {prompt.content}
                          </p>
                          {!isExpanded && isLongText && (
                            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                          )}
                        </div>

                        {isLongText && (
                          <button
                            type="button"
                            onClick={() => toggleExpandPrompt(prompt.id)}
                            className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors self-start cursor-pointer select-none"
                          >
                            {isExpanded ? (
                              <>
                                <span>Ver menos</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>Ver mais</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {prompt.driveLink && (
                    <div className="mt-3 flex justify-start">
                      <Button 
                        asChild
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tight h-9 px-6 rounded-full shadow-md group transition-all text-xs border-0"
                      >
                        <a href={prompt.driveLink} target="_blank" rel="noopener noreferrer">
                          <Cloud className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform text-blue-100" />
                          Abrir no Google Drive
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Perfect Prompt Generator Modal */}
      <AnimatePresence>
        {isGenerating && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setIsGenerating(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] m-auto"
            >
              <div className="shrink-0 p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-white uppercase tracking-tight text-lg">
                      Criar Prompt Perfeito
                    </h3>
                    <p className="text-[10px] text-blue-100 uppercase font-bold tracking-widest">
                      Preencha os campos abaixo para gerar um prompt estruturado
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsGenerating(false)}
                  className="text-white hover:bg-white/10 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 p-6 md:p-8">
                <div className="space-y-8">
                  {generateError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center text-red-600 gap-3">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-bold">{generateError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Título do Prompt</Label>
                      <Input 
                        value={generateFormData.title}
                        onChange={(e) => setGenerateFormData({...generateFormData, title: e.target.value})}
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria do Prompt</Label>
                      <Input 
                        value={generateFormData.category}
                        onChange={(e) => setGenerateFormData({...generateFormData, category: e.target.value})}
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">O que você quer que este prompt faça?</Label>
                      <Input 
                        value={generateFormData.objective}
                        onChange={(e) => setGenerateFormData({...generateFormData, objective: e.target.value})}
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Qual é o contexto ou cenário?</Label>
                      <Input 
                        value={generateFormData.context}
                        onChange={(e) => setGenerateFormData({...generateFormData, context: e.target.value})}
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sobre qual produto, tema ou assunto é o prompt?</Label>
                      <Input 
                        value={generateFormData.theme}
                        onChange={(e) => setGenerateFormData({...generateFormData, theme: e.target.value})}
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Para quem esse prompt será usado?</Label>
                      <Input 
                        value={generateFormData.audience}
                        onChange={(e) => setGenerateFormData({...generateFormData, audience: e.target.value})}
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Qual tom de escrita deve ser usado?</Label>
                      <Input 
                        value={generateFormData.tone}
                        onChange={(e) => setGenerateFormData({...generateFormData, tone: e.target.value})}
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Existe alguma regra ou restrição?</Label>
                      <Input 
                        value={generateFormData.restrictions}
                        onChange={(e) => setGenerateFormData({...generateFormData, restrictions: e.target.value})}
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Qual resultado final você espera?</Label>
                    <Textarea 
                      value={generateFormData.expectedResult}
                      onChange={(e) => setGenerateFormData({...generateFormData, expectedResult: e.target.value})}
                      className="min-h-[80px] border-slate-200 focus:border-blue-500 rounded-lg resize-none"
                    />
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600">Gerar prompt</Label>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-blue-600 hover:bg-blue-50 font-bold"
                        onClick={() => {
                          setGenerateError(null);
                          const finalPrompt = generatePromptBody();
                          setGenerateFormData({...generateFormData, generatedPrompt: finalPrompt});
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Prompt
                      </Button>
                    </div>
                    <Textarea 
                      value={generateFormData.generatedPrompt}
                      onChange={(e) => setGenerateFormData({...generateFormData, generatedPrompt: e.target.value})}
                      className="min-h-[150px] bg-slate-50 border-slate-200 focus:border-blue-500 rounded-lg p-4 font-mono text-sm leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <Button 
                  className="h-11 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-tight shadow-lg px-8"
                  disabled={isSaving}
                  onClick={handleOpenSaveDetails}
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  Salvar Prompt
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Details Simple Popup */}
      <AnimatePresence>
        {showSaveDetailsModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setShowSaveDetailsModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] m-auto z-10"
            >
              <div className="shrink-0 p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Save className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-black text-white uppercase tracking-tight text-sm">
                    Detalhes para Salvar Prompt
                  </h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowSaveDetailsModal(false)}
                  className="text-white hover:bg-white/10 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Título do prompt</Label>
                  <Input 
                    value={saveDetails.title}
                    onChange={(e) => setSaveDetails({...saveDetails, title: e.target.value})}
                    className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo/categoria do prompt</Label>
                  <Input 
                    value={saveDetails.category}
                    onChange={(e) => setSaveDetails({...saveDetails, category: e.target.value})}
                    className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ordem / Posição (Ex: 1 = Topo)</Label>
                  <Input 
                    type="number"
                    min={1}
                    value={saveDetails.ordem ?? ""}
                    onChange={(e) => setSaveDetails({...saveDetails, ordem: e.target.value ? parseInt(e.target.value, 10) : null})}
                    className="h-11 border-slate-200 focus:border-blue-500 rounded-lg font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Submenu (Organização)</Label>
                    {!isAddingSubSave && (
                      <button
                        type="button"
                        onClick={() => setIsAddingSubSave(true)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Novo Submenu
                      </button>
                    )}
                  </div>
                  
                  {isAddingSubSave ? (
                    <div className="flex gap-2">
                      <Input
                        value={newSubNameSave}
                        onChange={(e) => setNewSubNameSave(e.target.value)}
                        className="h-9 text-xs border-slate-200"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const trimmed = newSubNameSave.trim();
                            if (trimmed) {
                              handleCreateSubmenu(trimmed);
                              setSaveDetails({...saveDetails, submenu: trimmed});
                              setNewSubNameSave("");
                              setIsAddingSubSave(false);
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const trimmed = newSubNameSave.trim();
                          if (trimmed) {
                            handleCreateSubmenu(trimmed);
                            setSaveDetails({...saveDetails, submenu: trimmed});
                            setNewSubNameSave("");
                            setIsAddingSubSave(false);
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3 text-xs shrink-0"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setNewSubNameSave("");
                          setIsAddingSubSave(false);
                        }}
                        className="h-9 px-2 text-slate-400"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <select
                      value={saveDetails.submenu || "Cadastro de produto"}
                      onChange={(e) => setSaveDetails({...saveDetails, submenu: e.target.value})}
                      className="w-full h-11 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-white px-3 text-sm focus:outline-none"
                    >
                      {allSubmenus.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Link, se houver (Google Drive)</Label>
                  <Input 
                    value={saveDetails.driveLink}
                    onChange={(e) => setSaveDetails({...saveDetails, driveLink: e.target.value})}
                    className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Imagem por link</Label>
                  <Input 
                    value={saveDetails.imageLink}
                    onChange={(e) => setSaveDetails({...saveDetails, imageLink: e.target.value})}
                    className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                  />
                </div>
              </div>

              <div className="shrink-0 p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSaveDetailsModal(false)}
                  className="h-11 border-slate-200 text-slate-500 font-bold uppercase tracking-tight px-6"
                >
                  Cancelar
                </Button>
                <Button 
                  className="h-11 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-tight shadow-lg px-8"
                  disabled={isSaving}
                  onClick={handleSavePromptFromPerfectModal}
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "OK"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {promptToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setPromptToDelete(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Excluir Prompt?</h3>
              <p className="text-slate-500 text-sm mb-8">
                Você está prestes a excluir o prompt <span className="font-bold text-slate-900">"{promptToDelete.name}"</span>. Esta ação não pode ser desfeita.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setPromptToDelete(null)}
                  disabled={!!isDeleting}
                  className="h-12 border-slate-200 text-slate-600 font-bold"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeletePrompt(null)}
                  disabled={!!isDeleting}
                  className="h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-tight"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Sim, Excluir"
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal Overlay */}
      <AnimatePresence>
        {isEditing && currentPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsEditing(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] m-auto"
            >
              <div className="shrink-0 p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Save className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-black text-white uppercase tracking-tight">
                    {currentPrompt.id ? "Editar Prompt" : "Novo Prompt"}
                  </h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsEditing(false)}
                  className="text-white hover:bg-white/10 rounded-full"
                  disabled={isSaving}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6">
                <div className="space-y-5 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome do Prompt</Label>
                      <Input 
                        value={currentPrompt.name}
                        onChange={(e) => setCurrentPrompt({...currentPrompt, name: e.target.value})}
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ordem / Posição</Label>
                      <Input 
                        type="number"
                        min={1}
                        value={currentPrompt.ordem ?? ""}
                        onChange={(e) => setCurrentPrompt({...currentPrompt, ordem: e.target.value ? parseInt(e.target.value, 10) : null})}
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg font-bold"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo (Opcional)</Label>
                      <Input 
                        value={currentPrompt.type}
                        onChange={(e) => setCurrentPrompt({...currentPrompt, type: e.target.value})}
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Submenu</Label>
                      {!isAddingSubEdit && (
                        <button
                          type="button"
                          onClick={() => setIsAddingSubEdit(true)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Novo
                        </button>
                      )}
                    </div>
                    
                    {isAddingSubEdit ? (
                      <div className="flex gap-1.5">
                        <Input
                          value={newSubNameEdit}
                          onChange={(e) => setNewSubNameEdit(e.target.value)}
                          className="h-11 text-xs border-slate-200"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = newSubNameEdit.trim();
                              if (trimmed) {
                                handleCreateSubmenu(trimmed);
                                setCurrentPrompt({...currentPrompt, submenu: trimmed});
                                setNewSubNameEdit("");
                                setIsAddingSubEdit(false);
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const trimmed = newSubNameEdit.trim();
                            if (trimmed) {
                              handleCreateSubmenu(trimmed);
                              setCurrentPrompt({...currentPrompt, submenu: trimmed});
                              setNewSubNameEdit("");
                              setIsAddingSubEdit(false);
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-2.5 text-xs shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setNewSubNameEdit("");
                            setIsAddingSubEdit(false);
                          }}
                          className="h-11 px-1.5 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <select
                        value={currentPrompt.submenu || "Cadastro de produto"}
                        onChange={(e) => setCurrentPrompt({...currentPrompt, submenu: e.target.value})}
                        className="w-full h-11 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-white px-3 text-sm focus:outline-none"
                        disabled={isSaving}
                      >
                        {allSubmenus.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conteúdo do Prompt</Label>
                    <Textarea 
                      value={currentPrompt.content}
                      onChange={(e) => setCurrentPrompt({...currentPrompt, content: e.target.value})}
                      className="min-h-[200px] border-slate-200 focus:border-blue-500 rounded-lg resize-none"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Cloud className="w-3 h-3 text-blue-500" /> Link do Google Drive
                    </Label>
                    <Input 
                      value={currentPrompt.driveLink || ""}
                      onChange={(e) => setCurrentPrompt({...currentPrompt, driveLink: e.target.value})}
                      className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                      disabled={isSaving}
                    />
                    <p className="text-[10px] text-slate-400">Cole o link da pasta ou arquivo do Google Drive aqui.</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Image className="w-3 h-3 text-emerald-500" /> Imagem por link
                    </Label>
                    <Input 
                      value={currentPrompt.imageLink || ""}
                      onChange={(e) => setCurrentPrompt({...currentPrompt, imageLink: e.target.value})}
                      className="h-11 border-slate-200 focus:border-blue-500 rounded-lg"
                      disabled={isSaving}
                    />
                    <p className="text-[10px] text-slate-400">Insira a URL de uma imagem para ilustrar o prompt no card.</p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                {currentPrompt.id ? (
                  <Button 
                    variant="ghost"
                    type="button"
                    className="h-11 px-4 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-lg"
                    onClick={() => setPromptToDelete(currentPrompt)}
                    disabled={isSaving || isDeleting === currentPrompt.id}
                  >
                    {isDeleting === currentPrompt.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Excluir Prompt
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline"
                    className="h-11 border-slate-200 text-slate-600 font-bold uppercase tracking-tight hover:bg-slate-100 px-5 text-xs rounded-lg"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-tight shadow-md disabled:opacity-50 px-6 text-xs rounded-lg"
                    disabled={!currentPrompt.name || !currentPrompt.content || isSaving}
                    onClick={handleSavePrompt}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {currentPrompt.id ? "Atualizar Prompt" : "Salvar Prompt"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PromptCardImage({ src }: { src: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return null;
  }

  return (
    <img
      src={src}
      className="w-full h-full object-contain md:object-cover transition-all duration-300 hover:scale-[1.01]"
      alt="Referência do Prompt"
      referrerPolicy="no-referrer"
      onError={() => {
        console.warn(`Failed to load prompt image from link: ${src}`);
        setHasError(true);
      }}
    />
  );
}
