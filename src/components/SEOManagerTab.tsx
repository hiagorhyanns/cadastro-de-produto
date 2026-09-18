import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Copy, 
  Check, 
  Edit2, 
  Trash2, 
  Save, 
  ChevronDown,
  ChevronUp,
  X,
  Search,
  Tag,
  Info,
  Loader2,
  FileText,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { 
  getSEOItems, 
  saveSEOItem, 
  deleteSEOItem,
  SEOData as SEO
} from "../services/firebaseService";

export function SEOManagerTab() {
  const [seoItems, setSeoItems] = React.useState<SEO[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [currentSEO, setCurrentSEO] = React.useState<SEO | null>(null);
  const [copyStatus, setCopyStatus] = React.useState<string | null>(null);
  const [saveAlert, setSaveAlert] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [expandedCardIds, setExpandedCardIds] = React.useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Load SEO items from Firebase on mount
  const fetchSEOItems = async () => {
    try {
      const data = await getSEOItems();
      const seen = new Set<string>();
      const uniqueData = data.filter(item => {
        if (!item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      setSeoItems(uniqueData);
    } catch (e) {
      console.error("Error loading SEO items", e);
    }
  };

  React.useEffect(() => {
    fetchSEOItems();
  }, []);

  const handleAddSEO = () => {
    const newId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    setCurrentSEO({
      id: newId,
      text: "",
      type: "",
      status: 'progresso',
      createdAt: Date.now()
    });
    setIsEditing(true);
  };

  const handleEditSEO = (item: SEO) => {
    setCurrentSEO({ ...item });
    setIsEditing(true);
  };

  const handleSaveSEO = async () => {
    if (!currentSEO || !currentSEO.text || !currentSEO.type) return;

    try {
      setIsSaving(true);
      
      const itemToSave: SEO = { 
        ...currentSEO, 
        text: currentSEO.text.trim(),
        type: currentSEO.type.trim()
      };

      await saveSEOItem(itemToSave);
      
      // Update local state
      setSeoItems(prev => {
        const index = prev.findIndex(t => t.id === itemToSave.id);
        if (index >= 0) {
          const newItems = [...prev];
          newItems[index] = itemToSave;
          return newItems;
        } else {
          return [itemToSave, ...prev];
        }
      });

      // Update UI
      setIsEditing(false);
      setCurrentSEO(null);
      setSaveAlert(true);
      setTimeout(() => setSaveAlert(false), 2000);

      await fetchSEOItems();
    } catch (e: any) {
      console.error("Error saving SEO item:", e);
      alert(e.message || "Erro ao salvar item de SEO.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSEO = async (id: string) => {
    try {
      await deleteSEOItem(id);
      setSeoItems(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error("Error deleting SEO item", e);
      alert("Erro ao excluir item de SEO.");
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const filteredItems = seoItems.filter(t => 
    t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const types = Array.from(new Set(seoItems.map(t => t.type))).filter(Boolean);

  const StatusIndicator = ({ status }: { status: SEO['status'] }) => {
    switch (status) {
      case 'feito':
        return (
          <div className="relative flex items-center justify-center w-5 h-5">
            <motion.div 
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-full h-full rounded-full bg-green-400"
            />
            <div className="relative w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] border border-green-400" />
          </div>
        );
      case 'progresso':
        return <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)] border border-orange-300" />;
      case 'validar':
        return <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] border border-red-400" />;
      default:
        return null;
    }
  };

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
              SEO salvo com sucesso!
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            ref={searchInputRef}
            placeholder="Pesquisar SEO..." 
            className="pl-10 pr-10 h-11 border-slate-200 rounded-lg bg-white shadow-sm"
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
          onClick={handleAddSEO}
          className="w-full md:w-auto h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md px-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar SEO
        </Button>
      </div>

      {types.length > 0 && searchQuery === "" && (
        <div className="flex flex-wrap gap-2">
          {types.map(type => (
            <Badge 
              key={type} 
              variant="outline" 
              className="cursor-pointer hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors py-1 px-3"
              onClick={() => setSearchQuery(type)}
            >
              {type}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {filteredItems.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="h-40 flex flex-col items-center justify-center text-slate-400">
              <FileText className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">Nenhum item de SEO encontrado.</p>
            </CardContent>
          </Card>
        ) : (
            filteredItems.map((item) => {
              // Extract first line as task title, and the rest as description
              const lines = item.text ? item.text.split("\n").map(l => l.trim()).filter(Boolean) : [];
              const titleText = (lines.length > 1 && lines[0].length < 85) ? lines[0] : `Tarefa de Otimização SEO`;
              const descText = (lines.length > 1 && lines[0].length < 85) ? lines.slice(1).join("\n") : item.text;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="w-full"
                >
                  <Card className="border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative">
                    <div className="p-5 md:p-6 space-y-4">
                      {/* Top section: Category (Type), Status, and Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 text-xs font-semibold hover:bg-blue-50">
                            {item.type || "Geral"}
                          </Badge>
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/60 font-medium">
                            <StatusIndicator status={item.status} />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                              {item.status === 'feito' ? 'Feito' : item.status === 'progresso' ? 'Em Progresso' : 'A Validar'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCopyText(item.text, item.id)}
                            className="h-8 px-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1.5"
                            title="Copiar texto de SEO"
                          >
                            {copyStatus === item.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                                <span className="text-[11px] font-bold text-green-600">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold">Copiar</span>
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditSEO(item)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar SEO"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setDeleteId(item.id)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Excluir SEO"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Main Task Title */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-150 px-2 py-0.5 rounded">
                          Tarefa / Título
                        </span>
                        <h4 className="text-base font-bold text-slate-900 tracking-tight pt-1">
                          {titleText}
                        </h4>
                      </div>

                      {/* Description / SEO Text Box */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-150 px-2 py-0.5 rounded">
                          Texto Principal do SEO
                        </span>
                        
                        <div className="relative mt-1">
                          <div 
                            className={`transition-all duration-300 ease-in-out bg-slate-50/50 p-4 border border-slate-100 rounded-lg ${
                              expandedCardIds.has(item.id) ? "" : "max-h-[140px] overflow-hidden"
                            }`}
                          >
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                              {expandedCardIds.has(item.id) ? item.text : descText}
                            </p>
                          </div>
                          
                          {/* If text is long, show expand/collapse button */}
                          {(item.text.length > 200 || lines.length > 3) && (
                            <div className="flex justify-end pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(item.id)}
                                className="h-7 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-transparent font-bold flex items-center gap-1 p-0 px-2"
                              >
                                {expandedCardIds.has(item.id) ? (
                                  <>
                                    Recolher <ChevronUp className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    Ler mais <ChevronDown className="w-3 h-3" />
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
        )}
      </div>

      <AnimatePresence>
        {isEditing && currentSEO && (
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
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-black uppercase tracking-tight">
                    {seoItems.find(t => t.id === currentSEO.id) ? "Editar SEO" : "Novo SEO"}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Tag className="w-3 h-3 text-blue-500" /> Tipo de SEO
                      </Label>
                      <Input 
                        value={currentSEO.type}
                        onChange={(e) => setCurrentSEO({ ...currentSEO, type: e.target.value })}
                        placeholder="Ex: Titulo, Imagem, Conteudo"
                        className="h-11 border-slate-200 focus:border-blue-500 rounded-lg shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-blue-500" /> Status
                      </Label>
                      <Select 
                        value={currentSEO.status} 
                        onValueChange={(val: any) => setCurrentSEO({ ...currentSEO, status: val })}
                      >
                        <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 rounded-lg shadow-sm">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feito">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span>Feito</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="progresso">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-400" />
                              <span>Progresso</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="validar">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              <span>Validar</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Info className="w-3 h-3 text-blue-500" /> Texto / Conteúdo
                    </Label>
                    <Textarea 
                      value={currentSEO.text}
                      onChange={(e) => setCurrentSEO({ ...currentSEO, text: e.target.value })}
                      placeholder="Insira o texto do SEO aqui..."
                      className="min-h-[200px] border-slate-200 focus:border-blue-500 rounded-lg resize-none shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER FIXO */}
              <div className="shrink-0 p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex flex-row-reverse gap-3">
                <Button 
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tighter shadow-lg disabled:opacity-50"
                  disabled={!currentSEO.text || !currentSEO.type || isSaving}
                  onClick={handleSaveSEO}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando SEO...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      {seoItems.find(t => t.id === currentSEO.id) ? "Atualizar SEO" : "Salvar SEO"}
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

      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col p-6 m-auto border border-slate-100"
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-950">
                  Confirmar Exclusão
                </h3>
              </div>
              
              <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">
                Tem certeza que deseja excluir este item de SEO?
              </p>

              <div className="flex items-center gap-3 justify-end shrink-0">
                <Button 
                  variant="outline"
                  className="px-4 py-2 border-slate-200 text-slate-500 font-bold rounded-lg hover:bg-slate-50 min-w-[100px]"
                  onClick={() => setDeleteId(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg min-w-[100px] shadow-sm flex items-center justify-center gap-2"
                  onClick={async () => {
                    if (deleteId) {
                      await handleDeleteSEO(deleteId);
                      setDeleteId(null);
                    }
                  }}
                >
                  Excluir
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
