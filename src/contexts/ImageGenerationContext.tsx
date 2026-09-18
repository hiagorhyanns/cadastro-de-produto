import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { generateProductContent, type ProductData, type GenerationResult } from '../lib/gemini';

interface ImageGenerationContextType {
  loading: boolean;
  result: GenerationResult | null;
  error: string | null;
  quotaError: { exceeded: boolean; retryTime?: string } | null;
  preview: string | null;
  filename: string | null;
  formData: {
    altura: string;
    largura: string;
    profundidade: string;
    peso: string;
    descricao: string;
  };
  setPreview: (preview: string | null) => void;
  setFilename: (filename: string | null) => void;
  setFormData: React.Dispatch<React.SetStateAction<{
    altura: string;
    largura: string;
    profundidade: string;
    peso: string;
    descricao: string;
  }>>;
  startGeneration: (
    mode?: 'principal' | 'ambientada' | 'beneficios' | 'publicitaria' | 'medidas' | 'outros' | 'componentes' | 'cor',
    extra?: { imageTecnico?: string | null; mimeTypeTecnico?: string | null; detalhesTecnicos?: string }
  ) => Promise<void>;
  clearResult: () => void;
  setQuotaError: (val: { exceeded: boolean; retryTime?: string } | null) => void;
}

const ImageGenerationContext = createContext<ImageGenerationContextType | undefined>(undefined);

export const ImageGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<{ exceeded: boolean; retryTime?: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    altura: "",
    largura: "",
    profundidade: "",
    peso: "",
    descricao: ""
  });

  const startGeneration = async (
    mode: 'principal' | 'ambientada' | 'beneficios' | 'publicitaria' | 'medidas' | 'outros' | 'componentes' | 'cor' = 'principal',
    extra?: { imageTecnico?: string | null; mimeTypeTecnico?: string | null; detalhesTecnicos?: string }
  ) => {
    if (!preview) {
      setError("Por favor, envie uma imagem do produto.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    setQuotaError(null);
    try {
      const data: ProductData = {
        image: preview,
        mimeType: preview.split(";")[0].split(":")[1],
        ...formData,
        filename: filename || undefined,
        mode
      };
      if (extra?.imageTecnico) {
        data.imageTecnico = extra.imageTecnico;
      }
      if (extra?.mimeTypeTecnico) {
        data.mimeTypeTecnico = extra.mimeTypeTecnico;
      }
      if (extra?.detalhesTecnicos) {
        data.detalhesTecnicos = extra.detalhesTecnicos;
      }
      const res = await generateProductContent(data);
      setResult(res);
    } catch (err: any) {
      console.warn("Generation status notice:", err?.message || err);
      const isQuota = err?.message?.includes("429") || 
                     err?.message?.includes("quota") || 
                     err?.message?.includes("QUOTA_EXCEEDED") ||
                     err?.status === 429;
      
      const isBusy = err?.message?.includes("503") ||
                    err?.message?.includes("demand") ||
                    err?.status === 503;
      
      const isKeyError = err?.message?.includes("API key expired") || 
                        err?.message?.includes("API key invalid") ||
                        err?.message?.includes("INVALID_ARGUMENT");

      if (isQuota || err?.message?.includes("Limite de geração")) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 15); // Standardized to 15 mins for better UX
        const retryTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setQuotaError({ exceeded: true, retryTime });
        setError("Limite de geração atingido ou billing/API key não configurado corretamente. Verifique a cota do projeto Gemini/Google Cloud.");
      } else if (isBusy) {
        setError("O servidor está muito ocupado no momento (alta demanda). Por favor, aguarde alguns instantes e tente novamente.");
      } else if (isKeyError) {
        setError("Chave de API expirada ou inválida. Por favor, verifique as configurações da AI Studio e renove sua chave Gemini.");
      } else {
        setError(err?.message || "Ocorreu um erro ao gerar o conteúdo. Verifique sua conexão e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
    setQuotaError(null);
  };

  const value = React.useMemo(() => ({
    loading,
    result,
    error,
    quotaError,
    preview,
    filename,
    formData,
    setPreview,
    setFilename,
    setFormData,
    startGeneration,
    clearResult,
    setQuotaError
  }), [loading, result, error, quotaError, preview, filename, formData]);

  return (
    <ImageGenerationContext.Provider value={value}>
      {children}
    </ImageGenerationContext.Provider>
  );
};

export const useImageGeneration = () => {
  const context = useContext(ImageGenerationContext);
  if (context === undefined) {
    throw new Error('useImageGeneration must be used within an ImageGenerationProvider');
  }
  return context;
};
