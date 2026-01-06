"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Sun, Moon, Languages, Calendar as CalendarIcon, ToggleRight, ToggleLeft, Paintbrush, HelpCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/language-context";

export function SettingsDialog({ 
  showCalendar,
  onCalendarToggle 
}: { 
  showCalendar: boolean;
  onCalendarToggle: (enabled: boolean) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  // Module states
  const [bgTheme, setBgTheme] = useState("default");

  useEffect(() => {
    // Load Background
    const savedBg = localStorage.getItem("gemini-bg-theme");
    if (savedBg) {
      setBgTheme(savedBg);
      applyBgTheme(savedBg);
    }
  }, []);

  const toggleCalendar = () => {
    onCalendarToggle(!showCalendar);
  };

  const applyBgTheme = (themeName: string) => {
    // Remove all previous classes
    document.documentElement.classList.remove("bg-blue-purple", "bg-green-red", "bg-yellow-blue", "bg-full-color");
    
    if (themeName !== "default") {
      document.documentElement.classList.add(`bg-${themeName}`);
    }
  };

  const changeBgTheme = (themeName: string) => {
    setBgTheme(themeName);
    applyBgTheme(themeName);
    localStorage.setItem("simplestart-bg-theme", themeName);
    window.dispatchEvent(new Event("bg-theme-change"));
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
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Settings className="w-5 h-5" /> {t("settings")}
                    </h2>
                    <div className="relative group cursor-help">
                        <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-foreground/80 transition-colors" />
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground/90 text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            v0.1.1
                        </div>
                    </div>
                </div>
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
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-4">{t("appearance")}</h3>
                <div className="flex gap-2 mb-4">
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

                {/* Background Color Picker */}
                <div className="flex flex-col gap-2">
                   <div className="flex items-center gap-2 mb-1">
                      <Paintbrush className="w-4 h-4 opacity-70" />
                      <span className="text-xs font-bold text-foreground/50 uppercase">{t("backgroundColor")}</span>
                   </div>
                   <div className="grid grid-cols-5 gap-2">
                      <button 
                        onClick={() => changeBgTheme("default")}
                        title="Default (Blue-Pink)"
                        className={`h-8 rounded-full bg-gradient-to-br from-blue-500 to-pink-500 border-2 ${bgTheme === 'default' ? 'border-white shadow-lg scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`} 
                      />
                      <button 
                        onClick={() => changeBgTheme("blue-purple")}
                        title="Blue-Purple"
                        className={`h-8 rounded-full bg-gradient-to-br from-blue-700 to-purple-800 border-2 ${bgTheme === 'blue-purple' ? 'border-white shadow-lg scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`} 
                      />
                      <button 
                        onClick={() => changeBgTheme("green-red")}
                        title="Green-Red"
                        className={`h-8 rounded-full bg-gradient-to-br from-green-700 to-red-800 border-2 ${bgTheme === 'green-red' ? 'border-white shadow-lg scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`} 
                      />
                      <button 
                        onClick={() => changeBgTheme("yellow-blue")}
                        title="Yellow-Blue"
                        className={`h-8 rounded-full bg-gradient-to-br from-yellow-600 to-blue-800 border-2 ${bgTheme === 'yellow-blue' ? 'border-white shadow-lg scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`} 
                      />
                      <button 
                        onClick={() => changeBgTheme("full-color")}
                        title="Full Color"
                        className={`h-8 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 border-2 ${bgTheme === 'full-color' ? 'border-white shadow-lg scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`} 
                      />
                   </div>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
