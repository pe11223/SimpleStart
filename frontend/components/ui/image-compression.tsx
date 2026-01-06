"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, X, Loader2, ImageIcon, Sliders } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export function ImageCompression() {
  const { t } = useLanguage();
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [compressing, setCompressing] = useState(false);
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOriginalImage(file);
      setCompressedImage(null);
      setStats(null);
      // Auto compress with default quality
      compress(file, quality);
    }
  };

  const compress = async (file: File, q: number) => {
    setCompressing(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        const compressedDataUrl = canvas.toDataURL("image/jpeg", q);
        setCompressedImage(compressedDataUrl);
        
        // Calculate size
        const base64str = compressedDataUrl.split(',')[1];
        const blob = b64toBlob(base64str, "image/jpeg");
        setCompressedBlob(blob);
        setStats({
          original: file.size,
          compressed: blob.size
        });
        
        setCompressing(false);
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (e) {
      console.error("Compression failed", e);
      setCompressing(false);
    }
  };

  const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = parseFloat(e.target.value);
    setQuality(q);
    if (originalImage) {
      compress(originalImage, q);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-3xl mx-auto glass rounded-3xl p-8">
      <div className="flex flex-col gap-8">
        {!originalImage ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-64 border-2 border-dashed border-foreground/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-foreground/5 transition-colors"
          >
            <Upload className="w-12 h-12 text-foreground/40 mb-4" />
            <p className="text-foreground/60 font-medium text-lg">{t("clickToUpload")}</p>
            <p className="text-sm text-foreground/40">{t("supportedFormats")}</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold opacity-50 uppercase tracking-wider">{t("originalSize")}</h4>
              <div className="aspect-video rounded-2xl overflow-hidden bg-foreground/5 relative group">
                <img src={URL.createObjectURL(originalImage)} className="w-full h-full object-contain" alt="Original" />
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-md">
                  {formatSize(originalImage.size)}
                </div>
                <button 
                  onClick={() => setOriginalImage(null)}
                  className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold opacity-50 uppercase tracking-wider">{t("compressedSize")}</h4>
              <div className="aspect-video rounded-2xl overflow-hidden bg-foreground/5 relative flex items-center justify-center">
                {compressing ? (
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                ) : compressedImage ? (
                  <>
                    <img src={compressedImage} className="w-full h-full object-contain" alt="Compressed" />
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-blue-500 text-white text-xs rounded-full backdrop-blur-md font-bold">
                      {stats ? formatSize(stats.compressed) : "..."} 
                      {stats && <span className="ml-2 opacity-80">({Math.round((1 - stats.compressed / stats.original) * 100)}% off)</span>}
                    </div>
                  </>
                ) : (
                  <ImageIcon className="w-8 h-8 text-foreground/20" />
                )}
              </div>
            </div>
          </div>
        )}

        {originalImage && (
          <div className="flex flex-col gap-6 bg-foreground/5 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 opacity-50" />
                <span className="font-bold text-sm">{t("quality")}</span>
              </div>
              <span className="text-blue-500 font-mono font-bold text-sm">{Math.round(quality * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="1.0" 
              step="0.05" 
              value={quality} 
              onChange={handleQualityChange}
              className="w-full h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            
            <div className="flex justify-center mt-2">
              <a 
                href={compressedImage || "#"} 
                download={`compressed_${originalImage.name.split('.')[0]}.jpg`}
                className={`flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 ${!compressedImage || compressing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Download className="w-5 h-5" />
                {t("downloadCompressed")}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
