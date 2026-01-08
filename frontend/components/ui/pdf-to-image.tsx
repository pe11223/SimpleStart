"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Download, Loader2, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export function PdfToImage() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResultUrl(null);
      setError(null);
    }
  };

  const convertPdf = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/py/tools/pdf-to-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Conversion failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (e: any) {
      console.error("PDF conversion failed", e);
      setError(e.message || "An unknown error occurred");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto glass rounded-3xl p-8">
      <div className="flex flex-col gap-6">
        
        {/* PDF Upload */}
        <div 
          onClick={() => inputRef.current?.click()}
          className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-red-500 bg-red-500/5' : 'border-foreground/20 hover:bg-foreground/5'}`}
        >
          <FileText className={`w-10 h-10 mb-2 ${file ? 'text-red-500' : 'text-foreground/40'}`} />
          <p className="text-foreground/60 font-medium">
            {file ? file.name : t("uploadPdf")}
          </p>
          <input 
            type="file" 
            ref={inputRef} 
            onChange={handleFileChange} 
            accept=".pdf" 
            className="hidden" 
          />
        </div>

        {/* Error Message */}
        {error && (
            <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm text-center">
                {error}
            </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center mt-4">
            {!resultUrl ? (
                <button
                    onClick={convertPdf}
                    disabled={!file || processing}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                    {processing ? t("converting") : t("convert")}
                </button>
            ) : (
                <a
                    href={resultUrl}
                    download={`${file?.name.replace('.pdf', '')}_images.zip`}
                    className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                    <Download className="w-5 h-5" />
                    {t("downloadImages")}
                </a>
            )}
        </div>
      </div>
    </div>
  );
}
