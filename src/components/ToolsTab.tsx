import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  ExternalLink, 
  Copy, 
  Check, 
  Edit2, 
  Trash2, 
  ImageIcon, 
  Save, 
  X,
  Search,
  Globe,
  Tag,
  Info,
  Wrench,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { 
  getTools, 
  saveTool, 
  deleteTool,
  ToolData as Tool
} from "../services/firebaseService";

export function ToolsTab() {
  const [tools, setTools] = React.useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [currentTool, setCurrentTool] = React.useState<Tool | null>(null);
  const [copyStatus, setCopyStatus] = React.useState<string | null>(null);
  const [saveAlert, setSaveAlert] = React.useState(false);

  const [brokenImages, setBrokenImages] = React.useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setBrokenImages(prev => ({ ...prev, [id]: true }));
  };

  // Load tools from Firebase on mount
  const fetchTools = async () => {
    try {
      const data = await getTools();
      console.log("TOOLS CARREGADAS DO FIRESTORE:", data);
      const seen = new Set<string>();
      const uniqueData = data.filter(item => {
        if (!item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      setTools(uniqueData);
    } catch (e) {
      console.error("Error loading tools", e);
    }
  };

  React.useEffect(() => {
    fetchTools();
  }, []);

  const handleAddTool = () => {
    // Basic fallback for environments where crypto.randomUUID isn't available
    const newId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    setCurrentTool({
      id: newId,
      name: "",
      url: "",
      description: "",
      category: "",
      icon: "",
      createdAt: Date.now()
    });
    setIsEditing(true);
  };

  const handleEditTool = (tool: Tool) => {
    setCurrentTool({ ...tool });
    setIsEditing(true);
  };

  const handleSaveTool = async () => {
    if (!currentTool || !currentTool.name || !currentTool.url) return;

    try {
      setIsSaving(true);
      
      // Basic URL validation/formatting
      let formattedUrl = currentTool.url.trim();
      if (!formattedUrl.startsWith('http') && !formattedUrl.startsWith('mailto:')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      const toolToSave: Tool = { 
        ...currentTool, 
        name: currentTool.name.trim(),
        url: formattedUrl, 
        icon: currentTool.icon // Now always a URL or null
      };

      console.log("ITEM 1 - PAYLOAD FINAL SENDING TO FIRESTORE:", toolToSave);
      console.log("VALOR DO CAMPO 'icon':", toolToSave.icon);

      await saveTool(toolToSave);
      
      // Update local state
      setTools(prev => {
        const index = prev.findIndex(t => t.id === toolToSave.id);
        if (index >= 0) {
          const newTools = [...prev];
          newTools[index] = toolToSave;
          return newTools;
        } else {
          return [toolToSave, ...prev];
        }
      });

      // Reset broken state for this tool in case it was fixed
      setBrokenImages(prev => {
        const next = { ...prev };
        delete next[toolToSave.id];
        return next;
      });

      // Update UI
      setIsEditing(false);
      setCurrentTool(null);
      setSaveAlert(true);
      setTimeout(() => setSaveAlert(false), 2000);

      // Refresh tools to be 100% sure we are in sync with server
      await fetchTools();
    } catch (e: any) {
      console.error("Error saving tool:", e);
      alert(e.message || "Erro ao salvar ferramenta.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta ferramenta?")) {
      try {
        await deleteTool(id);
        setTools(prev => prev.filter(t => t.id !== id));
        setBrokenImages(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } catch (e) {
        console.error("Error deleting tool", e);
        alert("Erro ao excluir ferramenta.");
      }
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(tools.map(t => t.category))).filter(Boolean);

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
              Ferramenta salva com sucesso!
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            ref={searchInputRef}
            placeholder="Pesquisar ferramentas..." 
            className="pl-10 pr-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg bg-white shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button 
          onClick={handleAddTool}
          className="w-full md:w-auto h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md px-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Ferramenta
        </Button>
      </div>

      {categories.length > 0 && searchQuery === "" && (
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Badge 
              key={cat} 
              variant="outline" 
              className="cursor-pointer hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors py-1 px-3"
              onClick={() => setSearchQuery(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {filteredTools.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="h-40 flex flex-col items-center justify-center text-slate-400">
              <Wrench className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">Nenhuma ferramenta encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          filteredTools.map((tool) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <Card className="overflow-hidden border-slate-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex flex-col md:flex-row">
                  {/* Tool Identity/Icon - ITEM 2 */}
                  <div className="p-4 md:p-6 flex items-start gap-4 md:border-r border-slate-50 md:w-1/3 bg-white">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                      {/* Lendo campo 'icon' conforme padronização */}
                      {tool.icon && !brokenImages[tool.id] ? (
                        <img 
                          src={tool.icon} 
                          alt={tool.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={() => {
                            console.warn(`Imagem falhou ao carregar para ferramenta ${tool.id}:`, tool.icon);
                            handleImageError(tool.id);
                          }}
                        />
                      ) : (
                        <Globe className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate mb-1">{tool.name}</h3>
                      {tool.category && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 rounded-md text-[10px] uppercase tracking-wider font-bold mb-2">
                          {tool.category}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 uppercase font-black tracking-widest truncate">
                        <Globe className="w-2.5 h-2.5" />
                        {(() => {
                          try {
                            return new URL(tool.url).hostname;
                          } catch (e) {
                            return tool.url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
                          }
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Tool Info & Actions */}
                  <div className="flex-1 p-4 md:p-6 bg-[#FAFAFA] flex flex-col justify-between">
                    <div>
                      <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed mb-4">
                        {tool.description || "Sem descrição disponível."}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        asChild
                        className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                      >
                        <a href={tool.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Abrir Ferramenta
                        </a>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCopyLink(tool.url, tool.id)}
                        className={`h-10 px-4 font-bold transition-all border-slate-200 ${copyStatus === tool.id ? "bg-green-50 text-green-600 border-green-200" : "text-slate-600 hover:bg-white"}`}
                      >
                        {copyStatus === tool.id ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar Link
                          </>
                        )}
                      </Button>

                      <div className="flex items-center gap-2 ml-auto">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditTool(tool)}
                          className="h-10 w-10 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteTool(tool.id)}
                          className="h-10 w-10 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isEditing && currentTool && (
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
              className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] m-auto"
            >
              {/* HEADER FIXO */}
              <div className="shrink-0 p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-black uppercase tracking-tight">
                    {tools.find(t => t.id === currentTool.id) ? "Editar Ferramenta" : "Nova Ferramenta"}
                  </h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsEditing(false)}
                  className="text-white hover:bg-white/10 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* BODY COM SCROLL */}
              <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6">
                <div className="space-y-5 pb-6">
                  {/* Icon Preview & URL Area */}
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-6">
                    <div className="shrink-0 w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden">
                      {currentTool.icon ? (
                        <img 
                          src={currentTool.icon} 
                          alt="Icon Preview" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = ""; // Clear broken src
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <ImageIcon className="w-3 h-3 text-blue-500" /> Link do Ícone (URL)
                      </Label>
                      <Input 
                        value={currentTool.icon || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrentTool(prev => prev ? {...prev, icon: val} : null);
                        }}
                        placeholder="https://exemplo.com/icone.png"
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg shadow-sm"
                      />
                      <p className="text-[10px] text-slate-400">Insira um link direto para a imagem do ícone.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Tag className="w-3 h-3 text-blue-500" /> Nome da Ferramenta
                      </Label>
                      <Input 
                        value={currentTool.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrentTool(prev => prev ? {...prev, name: val} : null);
                        }}
                        placeholder="Ex: Gemini AI, Canva, Trello"
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Tag className="w-3 h-3 text-blue-500" /> Categoria
                      </Label>
                      <Input 
                        value={currentTool.category}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrentTool(prev => prev ? {...prev, category: val} : null);
                        }}
                        placeholder="Ex: IA, Design, SEO"
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Globe className="w-3 h-3 text-blue-500" /> Link/URL
                    </Label>
                    <Input 
                      value={currentTool.url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentTool(prev => prev ? {...prev, url: val} : null);
                      }}
                      placeholder="https://exemplo.com"
                      className="h-11 border-slate-200 focus:border-blue-500 rounded-lg shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Info className="w-3 h-3 text-blue-500" /> Descrição
                    </Label>
                    <Textarea 
                      value={currentTool.description || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentTool(prev => prev ? {...prev, description: val} : null);
                      }}
                      placeholder="O que esta ferramenta faz?"
                      className="min-h-[120px] border-slate-200 focus:border-blue-500 rounded-lg resize-none shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER FIXO */}
              <div className="shrink-0 p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex flex-row-reverse gap-3">
                <Button 
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tighter shadow-lg disabled:opacity-50"
                  disabled={!currentTool.name || !currentTool.url || isSaving}
                  onClick={handleSaveTool}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando Ferramenta...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      {tools.find(t => t.id === currentTool.id) ? "Atualizar Ferramenta" : "Salvar Ferramenta"}
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 h-12 border-slate-200 text-slate-500 font-black uppercase tracking-tighter hover:bg-slate-100"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
