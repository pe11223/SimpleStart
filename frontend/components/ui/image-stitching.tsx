"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Upload, Download, X, Loader2, LayoutGrid, ArrowLeftRight, ArrowUpDown, Trash2, Plus } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

type StitchItem = {
  id: string;
  file: File;
  preview: string;
};

export function ImageStitching() {
  const { t } = useLanguage();
  const [items, setItems] = useState<StitchItem[]>([]);
  const [direction, setDirection] = useState<"horizontal" | "vertical">("horizontal");
  const [scale, setScale] = useState(1);
  const [stitchedUrl, setStitchedUrl] = useState<string | null>(null);
  const [stitching, setStitching] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9) + Date.now(),
        file,
        preview: URL.createObjectURL(file)
      }));
      setItems((prev) => [...prev, ...newFiles]);
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearItems = () => {
    items.forEach(i => URL.revokeObjectURL(i.preview));
    setItems([]);
  };

  useEffect(() => {
    if (items.length >= 2) {
      stitchImages();
    } else {
      setStitchedUrl(null);
    }
  }, [items, direction, scale]);

  const stitchImages = async () => {
    if (items.length < 2) return;
    setStitching(true);

    try {
      const loadImg = (item: StitchItem): Promise<HTMLImageElement> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = item.preview;
        });
      };

      const loadedImages = await Promise.all(items.map(loadImg));
      
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (direction === "horizontal") {
        const targetHeight = Math.max(...loadedImages.map(img => img.height));
        const scaledWidths = loadedImages.map(img => img.width * (targetHeight / img.height));
        const totalWidth = scaledWidths.reduce((a, b) => a + b, 0);
        
        canvas.width = totalWidth * scale;
        canvas.height = targetHeight * scale;
        
        ctx.scale(scale, scale);
        let currentX = 0;
        loadedImages.forEach((img, idx) => {
          const w = scaledWidths[idx];
          ctx.drawImage(img, currentX, 0, w, targetHeight);
          currentX += w;
        });
      } else {
        const targetWidth = Math.max(...loadedImages.map(img => img.width));
        const scaledHeights = loadedImages.map(img => img.height * (targetWidth / img.width));
        const totalHeight = scaledHeights.reduce((a, b) => a + b, 0);
        
        canvas.width = targetWidth * scale;
        canvas.height = totalHeight * scale;
        
        ctx.scale(scale, scale);
        let currentY = 0;
        loadedImages.forEach((img, idx) => {
          const h = scaledHeights[idx];
          ctx.drawImage(img, 0, currentY, targetWidth, h);
          currentY += h;
        });
      }

      setStitchedUrl(canvas.toDataURL("image/png"));
    } catch (e) {
      console.error("Stitching failed", e);
    } finally {
      setStitching(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto glass rounded-3xl p-8">
      <div className="flex flex-col gap-8">
        {/* Upload Section */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-foreground/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-foreground/5 transition-colors"
        >
          <Plus className="w-8 h-8 text-foreground/40 mb-2" />
          <p className="text-foreground/60 font-medium">{t("clickToUpload")}</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Selected Images Reorder Grid */}
        {items.length > 0 && (
            <div className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-xs text-foreground/40 uppercase font-bold tracking-wider">{t("dragToOrder")}</p>
                    <button onClick={clearItems} className="text-xs text-red-500 hover:bg-red-500/10 px-2 py-1 rounded flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> {t("clearImages")}
                    </button>
                </div>
                <Reorder.Group axis="x" values={items} onReorder={setItems} className="flex gap-4 overflow-x-auto pb-4 pr-4 scrollbar-hide">
                    {items.map((item) => (
                        <Reorder.Item 
                          key={item.id} 
                          value={item} 
                          className="relative flex-shrink-0 w-32 aspect-square rounded-xl overflow-hidden bg-foreground/10 group cursor-grab active:cursor-grabbing"
                        >
                            <img 
                                src={item.preview} 
                                alt="preview" 
                                className="w-full h-full object-cover pointer-events-none" 
                            />
                            <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeItem(item.id);
                                }}
                                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            </div>
        )}

        {items.length >= 2 && (
          <div className="flex flex-col gap-6 bg-foreground/5 p-6 rounded-3xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2 p-1 bg-background/50 rounded-2xl">
                <button 
                  onClick={() => setDirection("horizontal")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${direction === 'horizontal' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-foreground/5'}`}
                >
                  <ArrowLeftRight className="w-4 h-4" /> {t("horizontal")}
                </button>
                <button 
                  onClick={() => setDirection("vertical")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${direction === 'vertical' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-foreground/5'}`}
                >
                  <ArrowUpDown className="w-4 h-4" /> {t("vertical")}
                </button>
              </div>

              <div className="flex items-center gap-4 flex-1 max-w-xs">
                <span className="text-xs font-bold opacity-50 uppercase shrink-0">{t("scale")}</span>
                <input 
                  type="range" min="0.1" max="2" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="font-mono text-sm font-bold w-12 text-right">{Math.round(scale * 100)}%</span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black/5 flex items-center justify-center p-4 min-h-[300px] border border-foreground/5 shadow-inner">
              {stitching ? (
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              ) : stitchedUrl ? (
                <div className="max-w-full max-h-[600px] overflow-auto rounded-lg">
                   <img src={stitchedUrl} className="max-w-none shadow-2xl" alt="Result" />
                </div>
              ) : (
                <p className="text-sm opacity-30 italic">Upload at least 2 images to stitch...</p>
              )}
            </div>

            <div className="flex justify-center">
              <a 
                href={stitchedUrl || "#"} 
                download="stitched_image.png"
                className={`flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 ${!stitchedUrl || stitching ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Download className="w-5 h-5" />
                {t("downloadStitched")}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}