"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ALL_ENGINES } from "@/lib/constants";
import { Check, ChevronDown, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export function SearchBar({ enabledEngineIds: initialEnabledIds }: { enabledEngineIds?: string[] }) {
  const { t } = useLanguage();
  // State for enabled engines (persisted locally)
  const [enabledIds, setEnabledIds] = useState<string[]>(initialEnabledIds || ["google", "baidu", "github"]);
  
  // State for current selected engine index relative to *enabled* list
  const [engineIndex, setEngineIndex] = useState(0);
  
  // Search query
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper to get translated placeholder
  const getPlaceholder = (id: string) => {
    const key = `search${id.charAt(0).toUpperCase() + id.slice(1)}` as any;
    // Fallback if key doesn't exist in translations (though we defined them)
    return t(key) === key ? `Search ${id}...` : t(key);
  };

  // Load persistence
  useEffect(() => {
    const saved = localStorage.getItem("simplestart-enabled-engines");
    if (saved) {
      try {
        setEnabledIds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved engines", e);
      }
    }
  }, []);

  const saveEnabledIds = (ids: string[]) => {
    setEnabledIds(ids);
    localStorage.setItem("simplestart-enabled-engines", JSON.stringify(ids));
  };

  // Derived active engines list
  const activeEngines = ALL_ENGINES.filter(e => enabledIds.includes(e.id));
  // Ensure we have at least one
  const validActiveEngines = activeEngines.length > 0 ? activeEngines : [ALL_ENGINES[0]];

  // Current engine object
  const currentEngine = validActiveEngines[engineIndex] || validActiveEngines[0];

  // Handle engine switching via Tab
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      setEngineIndex((prev) => (prev + 1) % validActiveEngines.length);
    }
    if (e.key === "Enter" && query.trim()) {
      window.open(currentEngine.url + encodeURIComponent(query), "_blank");
      setQuery("");
    }
  };

  // Global shortcut '/'
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown as any);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown as any);
  }, [isFocused]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleEngine = (id: string) => {
    const newSet = enabledIds.includes(id)
      ? enabledIds.filter(e => e !== id)
      : [...enabledIds, id];
    
    // Allow empty? Maybe not.
    if (newSet.length === 0) return; 

    saveEnabledIds(newSet);
    
    // If we disabled the current engine, reset index
    if (id === currentEngine.id && enabledIds.includes(id)) {
       setEngineIndex(0);
    }
  };

  const selectEngineDirectly = (id: string) => {
    // If not enabled, enable it first
    if (!enabledIds.includes(id)) {
      saveEnabledIds([...enabledIds, id]);
    }
    
    setIsDropdownOpen(false);
    
    const futureEnabled = enabledIds.includes(id) ? enabledIds : [...enabledIds, id];
    const futureActive = ALL_ENGINES.filter(e => futureEnabled.includes(e.id));
    const newIndex = futureActive.findIndex(e => e.id === id);
    if (newIndex !== -1) setEngineIndex(newIndex);
  };

  return (
    <>
      {/* Focus Backdrop */}
      <AnimatePresence>
        {(isFocused || isDropdownOpen) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/50 backdrop-blur-md z-40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className={cn("w-full max-w-2xl mx-auto relative", (isFocused || isDropdownOpen) ? "z-50" : "z-10")} ref={dropdownRef}>
        <motion.div
          className={cn(
            "glass rounded-3xl p-2 flex items-center gap-3 transition-all duration-300 relative",
            isFocused || isDropdownOpen ? "shadow-2xl scale-[1.02]" : "shadow-lg"
          )}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Engine Icon / Dropdown Trigger */}
          <div 
            className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-foreground/5 text-foreground shrink-0 overflow-hidden cursor-pointer hover:bg-foreground/10 transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <AnimatePresence mode="wait">
               <currentEngine.icon className="w-6 h-6" />
            </AnimatePresence>
            
            <div className="absolute bottom-1 right-1">
               <ChevronDown className="w-2 h-2 opacity-50" />
            </div>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={getPlaceholder(currentEngine.id)}
            className="flex-1 bg-transparent border-none outline-none text-xl placeholder:text-foreground/40 text-foreground h-12 min-w-0"
          />

          {/* Mobile Submit Button */}
          <button
            onClick={() => {
              if (query.trim()) {
                window.open(currentEngine.url + encodeURIComponent(query), "_blank");
                setQuery("");
              }
            }}
            className="md:hidden p-2 bg-foreground/10 rounded-xl active:bg-foreground/20 transition-colors shrink-0"
          >
            <ArrowRight className="w-5 h-5 opacity-60" />
          </button>

          <div className="pr-4 hidden md:flex items-center gap-2 text-xs text-foreground/40 font-mono">
            <span className="bg-foreground/10 px-2 py-1 rounded-md">TAB</span>
            <span>{t("tabToSwitch")}</span>
          </div>
        </motion.div>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-4 w-64 glass rounded-2xl p-2 flex flex-col gap-1 shadow-2xl z-50 overflow-y-auto max-h-[300px]"
            >
               <div className="px-3 py-2 text-xs font-bold text-foreground/40 uppercase tracking-wider">
                 Select Search Engine
               </div>
               {ALL_ENGINES.map((engine) => {
                 const isEnabled = enabledIds.includes(engine.id);
                 const isSelected = currentEngine.id === engine.id;
                 
                 return (
                   <div 
                     key={engine.id}
                     className={cn(
                       "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                       isSelected ? "bg-blue-500/10 text-blue-500" : "hover:bg-foreground/5 text-foreground"
                     )}
                     onClick={() => selectEngineDirectly(engine.id)}
                   >
                      <div 
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                          isEnabled ? "bg-blue-500 border-blue-500" : "border-foreground/20 hover:border-foreground/40"
                        )}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent selection when just toggling checkbox
                          toggleEngine(engine.id);
                        }}
                      >
                        {isEnabled && <Check className="w-3 h-3 text-white" />}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-1">
                        <engine.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{engine.name}</span>
                      </div>
                   </div>
                 );
               })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}