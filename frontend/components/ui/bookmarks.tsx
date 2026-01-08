"use client";

import { useState } from "react";
import { Plus, X, Globe, ExternalLink, Star, Bot, Wrench, Server } from "lucide-react";
import { useLocalStorage } from "@/lib/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

import { cn } from "@/lib/utils";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  icon?: string;
  category?: "ai" | "tools" | "server" | "other"; 
};

export function Bookmarks({ className }: { className?: string }) {
  const { t } = useLanguage();
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>("simplestart-bookmarks", []);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "ai" | "tools" | "server">("all");

  const addBookmark = async () => {
    if (!newTitle || !newUrl) return;
    setIsLoading(true);
    const url = newUrl.startsWith("http") ? newUrl : `https://${newUrl}`;
    
    let icon = "";
    try {
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
      icon,
      category: activeCategory === "all" ? "other" : activeCategory
    }]);
    
    setNewTitle("");
    setNewUrl("");
    setIsAdding(false);
    setIsLoading(false);
  };

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  // Filter logic:
  // "all" -> Shows everything (Aggregate view)
  // "ai" -> Shows only AI
  // "tools" -> Shows only Tools
  const displayedBookmarks = activeCategory === "all" 
    ? bookmarks 
    : bookmarks.filter(b => b.category === activeCategory);

  return (
    <div className={cn("flex flex-col gap-2 p-2 w-64", className)}>
      <div className="flex items-center justify-between px-2 pb-2 border-b border-foreground/10">
        <div className="flex items-center gap-1">
           <button 
             onClick={() => setActiveCategory("all")}
             className={cn("p-1.5 rounded-lg transition-colors flex items-center gap-1", activeCategory === "all" ? "bg-foreground/10 text-foreground" : "text-foreground/40 hover:text-foreground/70")}
             title={t("bookmarks")}
           >
             <Star className="w-3.5 h-3.5" />
             <span className="text-[10px] font-bold uppercase tracking-wider">{t("bookmarks")}</span>
           </button>
           <button 
             onClick={() => setActiveCategory("ai")}
             className={cn("p-1.5 rounded-lg transition-colors", activeCategory === "ai" ? "bg-blue-500/10 text-blue-500" : "text-foreground/40 hover:text-foreground/70")}
             title={t("ai") || "AI"}
           >
             <Bot className="w-3.5 h-3.5" />
           </button>
           <button 
             onClick={() => setActiveCategory("tools")}
             className={cn("p-1.5 rounded-lg transition-colors", activeCategory === "tools" ? "bg-orange-500/10 text-orange-500" : "text-foreground/40 hover:text-foreground/70")}
             title={t("tools") || "Tools"}
           >
             <Wrench className="w-3.5 h-3.5" />
           </button>
           <button 
             onClick={() => setActiveCategory("server")}
             className={cn("p-1.5 rounded-lg transition-colors", activeCategory === "server" ? "bg-green-500/10 text-green-500" : "text-foreground/40 hover:text-foreground/70")}
             title="Server"
           >
             <Server className="w-3.5 h-3.5" />
           </button>
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
            <div className="text-[10px] opacity-50 px-1 uppercase tracking-wider">
               {t("addingTo")} {activeCategory === "all" ? t("bookmarks") : activeCategory === "ai" ? "AI" : activeCategory === "tools" ? "Tools" : "Server"}
            </div>
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
        {displayedBookmarks.length === 0 && !isAdding && (
           <div className="text-xs opacity-40 italic p-2 text-center">
             {activeCategory === "all" ? t("addBookmark") : `${t("emptyFolder")}`}
           </div>
        )}
        {displayedBookmarks.map((b) => (
          <div key={b.id} className="group flex items-center justify-between p-2 hover:bg-foreground/5 rounded-xl transition-colors">
            <a 
              href={b.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <div className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                {b.icon && b.icon.startsWith("data:image") ? (
                  <img src={b.icon} alt="" className="w-5 h-5 object-contain" onError={(e) => {e.currentTarget.src = `https://api.uomg.com/api/get.favicon?url=${b.url}`}} />
                ) : (
                  <img src={`https://api.uomg.com/api/get.favicon?url=${b.url}`} alt="" className="w-5 h-5 object-contain" onError={(e) => {(e.target as HTMLImageElement).style.display = 'none'}} />
                )}
                
                {/* Small indicator for category if viewing ALL */}
                {activeCategory === "all" && b.category === "ai" && (
                   <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full flex items-center justify-center border border-white dark:border-zinc-900">
                     <Bot className="w-1.5 h-1.5 text-white" />
                   </div>
                )}
                {activeCategory === "all" && b.category === "tools" && (
                   <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full flex items-center justify-center border border-white dark:border-zinc-900">
                     <Wrench className="w-1.5 h-1.5 text-white" />
                   </div>
                )}
                {activeCategory === "all" && b.category === "server" && (
                   <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full flex items-center justify-center border border-white dark:border-zinc-900">
                     <Server className="w-1.5 h-1.5 text-white" />
                   </div>
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