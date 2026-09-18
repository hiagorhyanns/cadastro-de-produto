import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Download, 
  Edit2, 
  Trash2, 
  Plus, 
  X, 
  Loader2, 
  Tag, 
  FileText,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEbooks, saveEbook, deleteEbook, EbookData } from "../services/firebaseService";

export function EbooksSubTab() {
  const [ebooks, setEbooks] = useState<EbookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEbook, setEditingEbook] = useState<EbookData | null>(null);
  const [tagsInput, setTagsInput] = useState("");

  const formatTitle = (rawTitle: string) => {
    if (!rawTitle) return "";
    const trimmed = rawTitle.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  // Fetch ebooks
  const fetchEbooks = async () => {
    setLoading(true);
    try {
      let data = await getEbooks();
      
      // Dual persistence check
      const localSaved = localStorage.getItem("guias_ebooks");
      if (localSaved) {
        const localData = JSON.parse(localSaved) as EbookData[];
        if (data.length === 0 && localData.length > 0) {
          data = localData;
        }
      }
      // Ensure every ebook has a valid ID and unique ID
      const seen = new Set<string>();
      const sanitizedData = data
        .map((ebook, idx) => ({
          ...ebook,
          id: ebook.id || (ebook.createdAt ? `ebook_${ebook.createdAt}_${idx}` : `ebook_${idx}`)
        }))
        .filter(ebook => {
          if (!ebook.id || seen.has(ebook.id)) return false;
          seen.add(ebook.id);
          return true;
        });

      setEbooks(sanitizedData);
      localStorage.setItem("guias_ebooks", JSON.stringify(sanitizedData));
    } catch (error) {
      console.error("Error fetching ebooks:", error);
      const localSaved = localStorage.getItem("guias_ebooks");
      if (localSaved) {
        const localData = JSON.parse(localSaved) as EbookData[];
        const seen = new Set<string>();
        const sanitized = localData
          .map((ebook, idx) => ({
            ...ebook,
            id: ebook.id || (ebook.createdAt ? `ebook_${ebook.createdAt}_${idx}` : `ebook_${idx}`)
          }))
          .filter(ebook => {
            if (!ebook.id || seen.has(ebook.id)) return false;
            seen.add(ebook.id);
            return true;
          });
        setEbooks(sanitized);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEbooks();
  }, []);

  const handleCreateEbook = () => {
    setEditingEbook({
      coverUrl: "",
      title: "",
      description: "",
      downloadUrl: "",
      tags: [],
      createdAt: Date.now()
    });
    setTagsInput("");
  };

  const handleEditEbook = (ebook: EbookData) => {
    setEditingEbook(ebook);
    setTagsInput((ebook.tags || []).join(", "));
  };

  const handleSaveEbook = async () => {
    if (!editingEbook) return;
    if (!editingEbook.title.trim()) {
      alert("Por favor, preencha o Nome do PDF.");
      return;
    }
    if (!editingEbook.description.trim()) {
      alert("Por favor, preencha a Descrição do PDF.");
      return;
    }
    if (!editingEbook.downloadUrl.trim()) {
      alert("Por favor, preencha o Link para baixar o PDF.");
      return;
    }

    // Process tags
    const tagsArray = tagsInput
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const formattedTitle = formatTitle(editingEbook.title);

    const ebookToSave: EbookData = {
      ...editingEbook,
      title: formattedTitle,
      tags: tagsArray
    };

    try {
      const saved = await saveEbook(ebookToSave);
      if (saved) {
        setEbooks(prev => {
          const index = prev.findIndex(e => e.id === saved.id);
          let updated: EbookData[] = [];
          if (index > -1) {
            updated = [...prev];
            updated[index] = saved;
          } else {
            updated = [saved, ...prev];
          }
          localStorage.setItem("guias_ebooks", JSON.stringify(updated));
          return updated;
        });
      }
      setEditingEbook(null);
    } catch (error) {
      console.error("Erro ao salvar no Firebase, salvando localmente:", error);
      const localId = editingEbook.id || "local_" + Date.now();
      const savedLocal: EbookData = {
        ...ebookToSave,
        id: localId
      };
      setEbooks(prev => {
        const index = prev.findIndex(e => e.id === savedLocal.id);
        let updated: EbookData[] = [];
        if (index > -1) {
          updated = [...prev];
          updated[index] = savedLocal;
        } else {
          updated = [savedLocal, ...prev];
        }
        localStorage.setItem("guias_ebooks", JSON.stringify(updated));
        return updated;
      });
      setEditingEbook(null);
    }
  };

  const handleDeleteEbook = async (e: React.MouseEvent, ebook: EbookData) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este PDF?")) return;
    
    const idToUse = ebook.id;
    let deletionSuccess = true;

    if (idToUse && !idToUse.startsWith("local_") && !idToUse.startsWith("ebook_")) {
      try {
        await deleteEbook(idToUse);
      } catch (error) {
        console.error("Erro ao excluir do Firebase:", error);
        deletionSuccess = false;
        alert("Ocorreu um erro ao excluir do Firebase. Verifique sua conexão.");
      }
    }
    
    if (deletionSuccess) {
      setEbooks(prev => {
        const updated = prev.filter(item => {
          if (idToUse && item.id === idToUse) return false;
          if (!idToUse && item.title === ebook.title && item.description === ebook.description) return false;
          return true;
        });
        localStorage.setItem("guias_ebooks", JSON.stringify(updated));
        return updated;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Guias Ebook</h2>
          <p className="text-sm text-slate-500 font-medium">Materiais em PDF para treinamento, consulta e apoio no cadastro de produtos</p>
        </div>
        <Button 
          onClick={handleCreateEbook}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-lg shadow-lg shadow-blue-100"
        >
          <Plus className="w-5 h-5 mr-1" />
          Salvar PDF
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Carregando Materiais...</p>
        </div>
      ) : ebooks.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 shadow-none rounded-2xl bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="font-bold text-slate-800">Nenhum PDF cadastrado ainda</h3>
              <p className="text-sm text-slate-400">Clique em ‘+ Salvar PDF’ no topo para adicionar o primeiro material.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="ebook-cards-container flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {ebooks.map((ebook) => (
              <motion.div
                key={ebook.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border border-slate-100 bg-white hover:border-slate-200 shadow-sm transition-all rounded-xl overflow-hidden">
                  <div className="p-4 md:p-6 flex flex-col sm:flex-row gap-6">
                    {/* Cover image or fallback badge */}
                    <div className="w-full sm:w-40 h-48 sm:h-52 rounded-lg border border-slate-100 bg-slate-50 flex-shrink-0 overflow-hidden relative group">
                      {ebook.coverUrl ? (
                        <img 
                          src={ebook.coverUrl} 
                          alt={ebook.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 text-slate-400 p-3 text-center">
                        <BookOpen className="w-10 h-10 text-slate-300 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">PDF de Apoio</span>
                      </div>
                    </div>

                    {/* Content details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight line-clamp-2">
                            {formatTitle(ebook.title)}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditEbook(ebook)}
                              className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteEbook(e, ebook)}
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                          {ebook.description}
                        </p>
                      </div>

                      {/* Tags & Action Button */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-1.5">
                          {ebook.tags && ebook.tags.length > 0 ? (
                            ebook.tags.map((tag, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="bg-slate-50 border-slate-200 text-slate-600 rounded-md py-0.5 px-2 text-[10px] font-bold uppercase tracking-wider"
                              >
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sem tags</span>
                          )}
                        </div>

                        <Button
                          onClick={() => window.open(ebook.downloadUrl, '_blank')}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 h-10 rounded-lg flex items-center gap-2 self-start sm:self-auto shadow-md shadow-blue-100"
                        >
                          <Download className="w-4 h-4" />
                          Baixar Ebook
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Editor/Creator Modal popup */}
      <AnimatePresence>
        {editingEbook && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop blurring effect matching system modals */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setEditingEbook(null)} 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
                <h3 className="font-black uppercase tracking-tight">
                  {editingEbook.id ? 'Editar PDF' : 'Cadastrar PDF'}
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setEditingEbook(null)} 
                  className="text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form Input Container */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">
                    Nome do PDF
                  </Label>
                  <Input 
                    value={editingEbook.title} 
                    onChange={e => setEditingEbook({...editingEbook, title: e.target.value})} 
                    placeholder="" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">
                    Descrição do PDF
                  </Label>
                  <Textarea 
                    value={editingEbook.description} 
                    onChange={e => setEditingEbook({...editingEbook, description: e.target.value})} 
                    rows={4} 
                    placeholder="" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">
                    Imagem de capa do PDF por link
                  </Label>
                  <Input 
                    value={editingEbook.coverUrl} 
                    onChange={e => setEditingEbook({...editingEbook, coverUrl: e.target.value})} 
                    placeholder="" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B5563]">
                    Link para baixar PDF
                  </Label>
                  <Input 
                    value={editingEbook.downloadUrl} 
                    onChange={e => setEditingEbook({...editingEbook, downloadUrl: e.target.value})} 
                    placeholder="" 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">
                      Tags do card
                    </Label>
                    <span className="text-[10px] text-slate-400 font-medium">Separe por vírgula</span>
                  </div>
                  <Input 
                    value={tagsInput} 
                    onChange={e => setTagsInput(e.target.value)} 
                    placeholder="" 
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingEbook(null)}>Cancelar</Button>
                <Button 
                  onClick={handleSaveEbook} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8"
                >
                  Salvar PDF
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
