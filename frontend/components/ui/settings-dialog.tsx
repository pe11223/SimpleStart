"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Sun, Moon, Languages, Calendar as CalendarIcon, ToggleRight, ToggleLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/language-context";

export function SettingsDialog({ 
  onCalendarToggle 
}: { 
  onCalendarToggle?: (enabled: boolean) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  // Module states
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("gemini-show-calendar");
    if (saved) {
      const val = JSON.parse(saved);
      setShowCalendar(val);
      onCalendarToggle?.(val);
    }
  }, []);

  const toggleCalendar = () => {
    const newVal = !showCalendar;
    setShowCalendar(newVal);
    localStorage.setItem("gemini-show-calendar", JSON.stringify(newVal));
    onCalendarToggle?.(newVal);
  };

  return (
    <>
      <div className="fixed top-8 right-8 z-30 opacity-20 hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-glass-border shadow-2xl rounded-3xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5" /> {t("settings")}
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-foreground/5 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modules Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-4">{t("modules")}</h3>
                <div 
                  onClick={toggleCalendar}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-foreground/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 opacity-70" />
                    <span className="font-medium">{t("calendarModule")}</span>
                  </div>
                  {showCalendar ? (
                    <ToggleRight className="w-6 h-6 text-blue-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-foreground/30" />
                  )}
                </div>
              </div>

              {/* Language Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-4">{t("language")}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLanguage("en")}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border ${language === 'en' ? 'bg-foreground/5 border-foreground/20' : 'border-transparent hover:bg-foreground/5'}`}
                  >
                    <span className="font-medium">English</span>
                  </button>
                  <button
                    onClick={() => setLanguage("zh")}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border ${language === 'zh' ? 'bg-foreground/5 border-foreground/20' : 'border-transparent hover:bg-foreground/5'}`}
                  >
                    <span className="font-medium">中文</span>
                  </button>
                </div>
              </div>

              {/* Theme Section */}
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-4">{t("appearance")}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border ${theme === 'light' ? 'bg-foreground/5 border-foreground/20' : 'border-transparent hover:bg-foreground/5'}`}
                  >
                    <Sun className="w-4 h-4" /> {t("light")}
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border ${theme === 'dark' ? 'bg-foreground/5 border-foreground/20' : 'border-transparent hover:bg-foreground/5'}`}
                  >
                    <Moon className="w-4 h-4" /> {t("dark")}
                  </button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
