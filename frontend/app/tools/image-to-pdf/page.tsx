"use client";

import { ImageToPdf } from "@/components/ui/image-to-pdf";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ImageToPdfPage() {
  return (
    <main className="min-h-screen p-8 relative overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/5 rounded-full blur-[100px]" />
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
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Image to PDF</h1>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ImageToPdf />
        </motion.div>
      </div>
    </main>
  );
}
