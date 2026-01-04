"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, X, ExternalLink, Flame } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

type NewsItem = {
  title: string;
  description: string;
  url: string;
  language: string;
};

export function TechFeed({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && news.length === 0) {
      fetchNews();
    }
  }, [isOpen]);

  async function fetchNews() {
    setLoading(true);
    try {
      const res = await fetch("/api/py/news");
      if (res.ok) {
        const data = await res.json();
        setNews(data);
      }
    } catch (e) {
      console.error("Failed to fetch news", e);
    }
    setLoading(false);
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-glass-border shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <h2 className="text-2xl font-bold">{t("trendingRepos")}</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-24 w-full bg-foreground/5 animate-pulse rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {news.map((item, index) => (
                      <motion.a
                        key={item.url}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors group relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-blue-500 group-hover:underline break-all pr-6">
                            {item.title}
                          </h3>
                          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4" />
                        </div>
                        <p className="text-sm text-foreground/60 line-clamp-2 mb-3">
                          {item.description}
                        </p>
                        {item.language && (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            <span className="text-xs text-foreground/40 font-medium">{item.language}</span>
                          </div>
                        )}
                      </motion.a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
