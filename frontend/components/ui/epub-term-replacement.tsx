"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Download, Loader2, BookOpen, FileJson } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export function EpubTermReplacement() {
  const { t } = useLanguage();
  const [epubFiles, setEpubFiles] = useState<File[]>([]);
  const [glossaryFile, setGlossaryFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultStats, setResultStats] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const epubInputRef = useRef<HTMLInputElement>(null);
  const glossaryInputRef = useRef<HTMLInputElement>(null);

  const handleEpubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setEpubFiles(Array.from(e.target.files));
      setResultUrl(null);
      setResultStats(null);
      setError(null);
    }
  };

  const handleGlossaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGlossaryFile(e.target.files[0]);
      setResultUrl(null);
      setResultStats(null);
      setError(null);
    }
  };

  const processEpub = async () => {
    if (epubFiles.length === 0 || !glossaryFile) return;
    setProcessing(true);
    setError(null);
    setResultStats(null);

    const formData = new FormData();
    epubFiles.forEach(file => {
        formData.append("files", file);
    });
    formData.append("glossary_file", glossaryFile);

    try {
      const response = await fetch("/api/py/tools/epub-replace", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Processing failed");
      }

      // Get stats from header
      const statsHeader = response.headers.get("X-Processing-Stats");
      if (statsHeader) {
          try {
              setResultStats(decodeURIComponent(statsHeader));
          } catch (e) {
              setResultStats(statsHeader);
          }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (e: any) {
      console.error("EPUB processing failed", e);
      setError(e.message || "An unknown error occurred");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto glass rounded-3xl p-8">
      <div className="flex flex-col gap-6">
        
        {/* EPUB Upload */}
        <div 
          onClick={() => epubInputRef.current?.click()}
          className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${epubFiles.length > 0 ? 'border-blue-500 bg-blue-500/5' : 'border-foreground/20 hover:bg-foreground/5'}`}
        >
          <BookOpen className={`w-8 h-8 mb-2 ${epubFiles.length > 0 ? 'text-blue-500' : 'text-foreground/40'}`} />
          <p className="text-foreground/60 font-medium">
            {epubFiles.length > 0 ? `${epubFiles.length} file(s) selected` : t("uploadEpub")}
          </p>
          <input 
            type="file" 
            ref={epubInputRef} 
            onChange={handleEpubChange} 
            accept=".epub" 
            multiple
            className="hidden" 
          />
        </div>

        {/* Glossary Upload */}
        <div 
          onClick={() => glossaryInputRef.current?.click()}
          className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${glossaryFile ? 'border-green-500 bg-green-500/5' : 'border-foreground/20 hover:bg-foreground/5'}`}
        >
          <FileJson className={`w-8 h-8 mb-2 ${glossaryFile ? 'text-green-500' : 'text-foreground/40'}`} />
          <p className="text-foreground/60 font-medium">
            {glossaryFile ? glossaryFile.name : t("uploadGlossary")}
          </p>
          <p className="text-xs text-foreground/40 mt-1">.csv, .json</p>
          <input 
            type="file" 
            ref={glossaryInputRef} 
            onChange={handleGlossaryChange} 
            accept=".csv,.json,.txt" 
            className="hidden" 
          />
        </div>

        {/* Error Message */}
        {error && (
            <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm text-center">
                {error}
            </div>
        )}

        {/* Success Stats */}
        {resultStats && (
            <div className="p-4 bg-green-500/10 text-green-600 rounded-xl text-sm text-center font-medium whitespace-pre-wrap">
                {resultStats}
            </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center mt-4">
            {!resultUrl ? (
                <button
                    onClick={processEpub}
                    disabled={epubFiles.length === 0 || !glossaryFile || processing}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                    {processing ? t("processing") : t("processEpub")}
                </button>
            ) : (
                <a
                    href={resultUrl}
                    download={epubFiles.length === 1 ? `modified_${epubFiles[0].name}` : "batch_processed_epubs.zip"}
                    className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                    <Download className="w-5 h-5" />
                    {t("downloadModifiedEpub")}
                </a>
            )}
        </div>
      </div>
    </div>
  );
}
