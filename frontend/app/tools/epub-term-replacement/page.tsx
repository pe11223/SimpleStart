"use client";

import { EpubTermReplacement } from "@/components/ui/epub-term-replacement";
import { ArrowLeft, BookOpen, HelpCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { useLanguage } from "@/lib/language-context";

export default function EpubTermReplacementPage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen p-8 relative overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <Link 
            href="/tools" 
            className="p-3 rounded-2xl glass hover:bg-foreground/5 transition-colors text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t("epubTermReplacement")}</h1>
            <div className="relative group cursor-help">
                <HelpCircle className="w-5 h-5 text-foreground/40 hover:text-foreground/80 transition-colors" />
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-64 p-3 bg-foreground/90 text-background text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    {t("epubHelp")}
                </div>
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <p className="text-foreground/60">{t("epubTermReplacementDesc")}</p>
          </div>
          <EpubTermReplacement />
        </motion.div>
      </div>
    </main>
  );
}