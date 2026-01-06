"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Upload, FileText, Download, X, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import { useLanguage } from "@/lib/language-context";

type ImageItem = {
  id: string;
  file: File;
  preview: string;
};

export function ImageToPdf() {
  const { t } = useLanguage();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [converting, setConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9) + Date.now(),
        file,
        preview: URL.createObjectURL(file)
      }));
      setImages((prev) => [...prev, ...newFiles]);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find(img => img.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  const clearImages = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const convertToPdf = async () => {
    if (images.length === 0) return;
    setConverting(true);

    try {
      const doc = new jsPDF();
      
      for (let i = 0; i < images.length; i++) {
        if (i > 0) doc.addPage();
        
        const image = images[i].file;
        const imgData = await readFileAsDataURL(image);
        const imgProps = await getImageProperties(imgData);
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Calculate aspect ratio fit
        const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
        const width = imgProps.width * ratio;
        const height = imgProps.height * ratio;
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;
        
        doc.addImage(imgData, "JPEG", x, y, width, height);
      }
      
      doc.save("converted_images.pdf");
    } catch (e) {
      console.error("PDF generation failed", e);
      alert("Failed to generate PDF");
    } finally {
      setConverting(false);
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getImageProperties = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = url;
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto glass rounded-3xl p-8">
      <div className="flex flex-col items-center gap-6">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-foreground/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-foreground/5 transition-colors"
        >
          <Upload className="w-10 h-10 text-foreground/40 mb-2" />
          <p className="text-foreground/60 font-medium">{t("clickToUpload")}</p>
          <p className="text-sm text-foreground/40">{t("supportedFormats")}</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {images.length > 0 && (
            <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-foreground/40 uppercase font-bold tracking-wider">{t("dragToOrder")}</p>
                    <button onClick={clearImages} className="text-xs text-red-500 hover:bg-red-500/10 px-2 py-1 rounded flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> {t("clearImages")}
                    </button>
                </div>
                <Reorder.Group axis="y" values={images} onReorder={setImages} className="w-full flex flex-col gap-3">
                    {images.map((item, index) => (
                        <Reorder.Item 
                            key={item.id} 
                            value={item} 
                            className="relative flex items-center gap-4 p-3 bg-foreground/5 rounded-xl group cursor-grab active:cursor-grabbing hover:bg-foreground/10 transition-colors"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background/50 text-foreground/50 text-xs font-bold">
                                {index + 1}
                            </div>
                            <div className="relative group/preview shrink-0">
                                <div className="h-16 w-16 rounded-lg overflow-hidden bg-background">
                                    <img 
                                        src={item.preview} 
                                        alt="preview" 
                                        className="w-full h-full object-cover pointer-events-none" 
                                    />
                                </div>
                                {/* Large Preview Tooltip */}
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-[36rem] h-[36rem] bg-white dark:bg-zinc-800 rounded-xl shadow-xl overflow-hidden hidden group-hover/preview:block z-[100] pointer-events-none border border-border">
                                    <img 
                                        src={item.preview} 
                                        alt="large preview" 
                                        className="w-full h-full object-contain bg-checkered p-2" 
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.file.name}</p>
                                <p className="text-xs text-foreground/40">{(item.file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button 
                                onClick={() => removeImage(item.id)}
                                className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            </div>
        )}

        {images.length > 0 && (
          <button
            onClick={convertToPdf}
            disabled={converting}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-4"
          >
            {converting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {converting ? t("converting") : t("downloadPdf")}
          </button>
        )}
      </div>
    </div>
  );
}
