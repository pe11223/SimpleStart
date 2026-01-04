"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Download, X, Image as ImageIcon, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

export function ImageToPdf() {
  const [images, setImages] = useState<File[]>([]);
  const [converting, setConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const convertToPdf = async () => {
    if (images.length === 0) return;
    setConverting(true);

    try {
      const doc = new jsPDF();
      
      for (let i = 0; i < images.length; i++) {
        if (i > 0) doc.addPage();
        
        const image = images[i];
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
          <p className="text-foreground/60 font-medium">Click to upload images</p>
          <p className="text-sm text-foreground/40">JPG, PNG supported</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {images.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-foreground/10 group"
              >
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="preview" 
                  className="w-full h-full object-cover" 
                />
                <button 
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {images.length > 0 && (
          <button
            onClick={convertToPdf}
            disabled={converting}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {converting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {converting ? "Converting..." : "Download PDF"}
          </button>
        )}
      </div>
    </div>
  );
}
