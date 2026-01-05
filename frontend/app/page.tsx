"use client";

import { Clock } from "@/components/ui/clock";
import { SearchBar } from "@/components/ui/search-bar";
import { TechFeed } from "@/components/ui/tech-feed";
import { SettingsDialog } from "@/components/ui/settings-dialog";
import { CalendarWidget } from "@/components/ui/calendar-widget";
import { BookmarkManager } from "@/components/ui/bookmark-manager";
import Link from "next/link";
import { Store, Briefcase, LayoutGrid, X, Book, Newspaper } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { t } = useLanguage();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);
  const [showTechFeed, setShowTechFeed] = useState(false);

  // Global Shortcut for Bookmarks (Ctrl/Cmd + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setShowBookmarksModal(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <SettingsDialog onCalendarToggle={setShowCalendar} />
      
      {/* Top Left Launcher */}
      <div className="fixed top-8 left-8 z-30">
        <button 
          onClick={() => setIsLauncherOpen(!isLauncherOpen)}
          className={`w-12 h-12 rounded-2xl glass flex items-center justify-center text-foreground hover:bg-foreground/5 transition-all ${isLauncherOpen ? 'bg-foreground/10' : ''}`}
        >
          <AnimatePresence mode="wait">
            {isLauncherOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <LayoutGrid className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {isLauncherOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -20 }}
              className="absolute top-16 left-0 flex flex-col gap-4"
            >
              <div className="glass rounded-2xl p-2 flex flex-col gap-2 shadow-2xl min-w-[180px]">
                <Link 
                  href="/apps"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors pr-6 group whitespace-nowrap"
                >
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                     <Store className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">{t("appCenter")}</span>
                </Link>
                
                <Link 
                  href="/tools"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors pr-6 group whitespace-nowrap"
                >
                   <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                     <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">{t("localTools")}</span>
                </Link>

                <div className="h-px bg-foreground/10 mx-2 my-1" />
                
                <button 
                  onClick={() => {
                    setIsLauncherOpen(false);
                    setShowTechFeed(true);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors pr-6 group whitespace-nowrap w-full text-left"
                >
                   <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors">
                     <Newspaper className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">{t("trendingRepos")}</span>
                </button>

                <button 
                  onClick={() => {
                    setIsLauncherOpen(false);
                    setShowBookmarksModal(true);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors pr-6 group whitespace-nowrap w-full text-left"
                >
                   <div className="p-2 bg-green-500/10 text-green-500 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors">
                     <Book className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">{t("bookmarks")}</span>
                  <span className="ml-auto text-[10px] opacity-40 font-mono hidden group-hover:inline-block">Ctrl+B</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bookmarks Modal (Shortcut Summoned) */}
      <AnimatePresence>
        {showBookmarksModal && (
          <>
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowBookmarksModal(false)}
               className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 glass rounded-3xl p-6 shadow-2xl w-full max-w-3xl"
            >
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Book className="w-5 h-5 opacity-70" />
                    {t("bookmarks")}
                  </h2>
                  <button onClick={() => setShowBookmarksModal(false)} className="p-1 hover:bg-foreground/5 rounded-full">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               <BookmarkManager />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-5xl flex flex-col items-center gap-6 pb-8">
        <div className="scale-90 origin-bottom">
           <Clock />
        </div>
        <SearchBar />
        
        {/* Calendar Module */}
        <AnimatePresence>
          {showCalendar && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: 20 }}
              className="w-full max-w-2xl glass rounded-3xl p-4"
            >
              <CalendarWidget />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TechFeed isOpen={showTechFeed} onClose={() => setShowTechFeed(false)} />
      
      <footer className="absolute bottom-4 text-center w-full text-foreground/20 text-sm font-mono pointer-events-none">
        SimpleStart &copy; 2026
      </footer>
    </main>
  );
}