"use client";

import { ArrowLeft, Briefcase, FileText, Image as ImageIcon, Code2, Wrench } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

export default function ToolsPage() {
  const { t } = useLanguage();

  const TOOLS_CATEGORIES = [
    {
      title: "PDF Tools",
      tools: [
        { 
          name: "Image to PDF", 
          desc: t("imageToPdf"), 
          icon: FileText, 
          href: "/tools/image-to-pdf" 
        }
      ]
    },
    {
      title: "Image Tools",
      tools: [
        { 
          name: t("comingSoon"), 
          desc: "Image compression & resizing.", 
          icon: ImageIcon, 
          href: "#" 
        }
      ]
    },
    {
      title: "Dev Tools",
      tools: [
        { 
          name: t("comingSoon"), 
          desc: "JSON Formatter, Base64 converter.", 
          icon: Code2, 
          href: "#" 
        }
      ]
    }
  ];

  return (
    <main className="min-h-screen p-8 relative overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <Link 
            href="/" 
            className="p-3 rounded-2xl glass hover:bg-foreground/5 transition-colors text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
              <Briefcase className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t("localTools")}</h1>
          </div>
        </header>

        <div className="flex flex-col gap-12">
          {TOOLS_CATEGORIES.map((cat, catIndex) => (
            <section key={cat.title}>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: catIndex * 0.1 }}
                className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground/80"
              >
                {cat.title}
              </motion.h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.tools.map((tool, index) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: catIndex * 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Link
                      href={tool.href}
                      className={`block p-6 rounded-3xl glass group transition-transform ${tool.href === '#' ? 'opacity-50 pointer-events-none grayscale' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-foreground/5 text-foreground group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          <tool.icon className="w-6 h-6" />
                        </div>
                        <Wrench className="w-4 h-4 text-foreground/20" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{tool.name}</h3>
                      <p className="text-sm text-foreground/60">{tool.desc}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
