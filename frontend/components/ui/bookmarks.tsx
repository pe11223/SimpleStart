"use client";

import { useState } from "react";
import { Plus, X, Globe, ExternalLink, Star } from "lucide-react";
import { useLocalStorage } from "@/lib/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

import { cn } from "@/lib/utils";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  icon?: string;
};

export function Bookmarks({ className }: { className?: string }) {
  const { t } = useLanguage();
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>("simplestart-bookmarks", []);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addBookmark = async () => {
    if (!newTitle || !newUrl) return;
    setIsLoading(true);
    const url = newUrl.startsWith("http") ? newUrl : `https://${newUrl}`;
    
    let icon = "";
    try {
      // Fetch favicon from backend via Next.js proxy
      // The rewrite rule in next.config.ts maps /api/py/:path* -> http://127.0.0.1:8000/:path*
      // So /api/py/api/favicon maps to http://127.0.0.1:8000/api/favicon
      const res = await fetch(`/api/py/api/favicon?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.icon) {
          icon = data.icon;
        }
      }
    } catch (e) {
      console.error("Failed to fetch favicon", e);
    }

    setBookmarks([...bookmarks, { 
      id: Date.now().toString(), 
      title: newTitle, 
      url, 
      icon 
    }]);
    
    setNewTitle("");
    setNewUrl("");
    setIsAdding(false);
    setIsLoading(false);
  };

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  return (
    <div className={cn("flex flex-col gap-2 p-2 w-64", className)}>
      <div className="flex items-center justify-between px-2 pb-2 border-b border-foreground/10">
        <div className="flex items-center gap-2 text-foreground/70">
           <Star className="w-4 h-4" />
           <span className="text-xs font-bold uppercase tracking-wider">{t("bookmarks")}</span>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 hover:bg-foreground/5 rounded-full"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col gap-2 bg-foreground/5 p-2 rounded-xl overflow-hidden"
          >
            <input 
              className="bg-transparent border-b border-foreground/10 text-sm p-1 outline-none"
              placeholder={t("titlePlaceholder")}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input 
              className="bg-transparent border-b border-foreground/10 text-sm p-1 outline-none"
              placeholder={t("urlPlaceholder")}
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBookmark()}
            />
            <button 
              onClick={addBookmark}
              disabled={isLoading}
              className="bg-blue-500 text-white text-xs font-bold py-1 rounded-lg mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : t("add")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
        {bookmarks.length === 0 && !isAdding && (
           <div className="text-xs opacity-40 italic p-2 text-center">{t("addBookmark")}</div>
        )}
        {bookmarks.map((b) => (
          <div key={b.id} className="group flex items-center justify-between p-2 hover:bg-foreground/5 rounded-xl transition-colors">
            <a 
              href={b.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <div className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                {b.icon && b.icon.startsWith("data:image") ? (
                  <img src={b.icon} alt="" className="w-5 h-5 object-contain" onError={(e) => {e.currentTarget.src = `https://api.uomg.com/api/get.favicon?url=${b.url}`}} />
                ) : (
                  <img src={`https://api.uomg.com/api/get.favicon?url=${b.url}`} alt="" className="w-5 h-5 object-contain" onError={(e) => {(e.target as HTMLImageElement).style.display = 'none'}} />
                )}
              </div>
              <span className="text-sm truncate">{b.title}</span>
            </a>
            <button 
              onClick={() => removeBookmark(b.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
