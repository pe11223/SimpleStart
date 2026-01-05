"use client";

import { AppGrid } from "@/components/ui/app-grid";
import { ArrowLeft, Rocket } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

export default function AppsPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen p-8 relative overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-3 rounded-2xl glass hover:bg-foreground/5 transition-colors text-foreground"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                <Rocket className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{t("appCenter")}</h1>
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
            <AppGrid />
        </motion.div>
      </div>
    </main>
  );
}
