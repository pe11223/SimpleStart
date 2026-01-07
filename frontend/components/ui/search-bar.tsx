"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ALL_ENGINES } from "@/lib/constants";
import { Check, ChevronDown, ArrowRight, Star, ArrowUp, ArrowDown } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useLocalStorage } from "@/lib/hooks";

export function SearchBar({ enabledEngineIds: initialEnabledIds }: { enabledEngineIds?: string[] }) {
  const { t } = useLanguage();
  // State for enabled engines (persisted locally)
  const [enabledIds, setEnabledIds] = useState<string[]>(initialEnabledIds || ["google", "baidu", "github"]);
  const [defaultEngineId, setDefaultEngineId] = useLocalStorage("simplestart-default-engine", "google");
  
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

  // Derived active engines list (ORDER MATTERS - derived from enabledIds)
  // We must map enabledIds to the actual engine objects to preserve order
  const activeEngines = enabledIds
    .map(id => ALL_ENGINES.find(e => e.id === id))
    .filter((e): e is typeof ALL_ENGINES[0] => !!e);

  // Ensure we have at least one
  const validActiveEngines = activeEngines.length > 0 ? activeEngines : [ALL_ENGINES[0]];

  // Initialize selection to default engine on mount
  useEffect(() => {
    const defaultIndex = validActiveEngines.findIndex(e => e.id === defaultEngineId);
    if (defaultIndex !== -1) {
        setEngineIndex(defaultIndex);
    }
  }, [defaultEngineId, enabledIds.join(",")]); // Re-evaluate if default changes or list structure changes

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
    // If disabling the LAST enabled engine, prevent it
    if (enabledIds.length === 1 && enabledIds.includes(id)) return;

    let newSet;
    if (enabledIds.includes(id)) {
        newSet = enabledIds.filter(e => e !== id);
        // If we disabled the default engine, reset default to the first available
        if (id === defaultEngineId && newSet.length > 0) {
            setDefaultEngineId(newSet[0]);
        }
    } else {
        newSet = [...enabledIds, id];
    }
    
    saveEnabledIds(newSet);
    
    // Reset index if needed is handled by the effect
  };

  const selectEngineDirectly = (id: string) => {
    // If not enabled, enable it first
    if (!enabledIds.includes(id)) {
      saveEnabledIds([...enabledIds, id]);
    }
    setIsDropdownOpen(false);
    // Index update is handled by effect since enabledIds/default might change, 
    // but here we just want to temporarily select it.
    // However, the effect listens to enabledIds.
    // Let's force index update after render.
    setTimeout(() => {
        // Recalculate based on potentially new list
        const currentActive = enabledIds.includes(id) 
            ? enabledIds 
            : [...enabledIds, id];
        // We need to resolve the index in the *active* list
        // This is tricky because React state updates are async.
        // For now, simple selection is fine.
        const idx = activeEngines.findIndex(e => e.id === id); // This uses old state
        if (idx !== -1) setEngineIndex(idx);
    }, 0);
  };

  const moveEngine = (index: number, direction: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index + direction < 0 || index + direction >= enabledIds.length) return;
    
    const newIds = [...enabledIds];
    [newIds[index], newIds[index + direction]] = [newIds[index + direction], newIds[index]];
    saveEnabledIds(newIds);
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
              className="absolute top-full left-0 mt-4 w-72 glass rounded-2xl p-2 flex flex-col gap-1 shadow-2xl z-50 overflow-y-auto max-h-[400px]"
            >
               <div className="px-3 py-2 text-xs font-bold text-foreground/40 uppercase tracking-wider flex justify-between items-center">
                 <span>Search Engines</span>
                 <span className="text-[10px]">Drag or click arrows to sort</span>
               </div>
               
               {/* 1. Render ENABLED engines first (Sortable) */}
               {enabledIds.map((id, index) => {
                 const engine = ALL_ENGINES.find(e => e.id === id);
                 if (!engine) return null;
                 const isSelected = currentEngine.id === engine.id;
                 const isDefault = defaultEngineId === engine.id;

                 return (
                   <div 
                     key={engine.id}
                     className={cn(
                       "flex items-center gap-2 p-2 rounded-xl transition-colors group",
                       isSelected ? "bg-blue-500/10" : "hover:bg-foreground/5"
                     )}
                     onClick={() => {
                         setEngineIndex(index);
                         setIsDropdownOpen(false);
                     }}
                   >
                      {/* Sort Controls */}
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            className="p-0.5 hover:bg-foreground/10 rounded" 
                            disabled={index === 0}
                            onClick={(e) => moveEngine(index, -1, e)}
                        >
                            <ArrowUp className="w-3 h-3 opacity-50" />
                        </button>
                        <button 
                            className="p-0.5 hover:bg-foreground/10 rounded"
                            disabled={index === enabledIds.length - 1}
                            onClick={(e) => moveEngine(index, 1, e)}
                        >
                            <ArrowDown className="w-3 h-3 opacity-50" />
                        </button>
                      </div>

                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                          <engine.icon className="w-5 h-5 text-foreground/80" />
                      </div>
                      
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className={cn("text-sm font-medium truncate", isSelected ? "text-blue-500" : "text-foreground")}>
                            {engine.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                          {/* Default Toggle */}
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setDefaultEngineId(engine.id);
                            }}
                            className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                isDefault ? "text-yellow-500 bg-yellow-500/10" : "text-foreground/20 hover:text-yellow-500 hover:bg-yellow-500/10"
                            )}
                            title="Set as Default"
                          >
                             <Star className="w-4 h-4" fill={isDefault ? "currentColor" : "none"} />
                          </button>

                          {/* Enable/Disable Toggle */}
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleEngine(engine.id);
                            }}
                            className="p-1.5 rounded-lg text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                            title="Enabled"
                          >
                             <Check className="w-4 h-4" />
                          </button>
                      </div>
                   </div>
                 );
               })}

               {/* Divider if needed */}
               {ALL_ENGINES.length > enabledIds.length && (
                   <div className="h-px bg-foreground/10 my-1" />
               )}

               {/* 2. Render DISABLED engines */}
               {ALL_ENGINES.filter(e => !enabledIds.includes(e.id)).map((engine) => (
                   <div 
                     key={engine.id}
                     className="flex items-center gap-3 p-2 rounded-xl hover:bg-foreground/5 transition-colors opacity-60 hover:opacity-100"
                     onClick={() => toggleEngine(engine.id)}
                   >
                      <div className="w-6 h-6 ml-6 flex items-center justify-center"> {/* Spacing for sort arrows */}
                          <engine.icon className="w-4 h-4 grayscale" />
                      </div>
                      <span className="text-sm font-medium flex-1">{engine.name}</span>
                      <button className="p-1.5 rounded-lg border border-foreground/10 hover:border-foreground/30">
                          <PlusIcon className="w-4 h-4 text-foreground/40" />
                      </button>
                   </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}