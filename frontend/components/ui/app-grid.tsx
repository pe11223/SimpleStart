"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Code2, Database, Globe, Container, GitGraph, AppWindow, Zap, Box, Package, Clapperboard, Gamepad, Video, Apple, Smartphone, Plus, Pencil, Trash2, X, Download, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useOS } from "@/lib/hooks";

type Version = {
  version: string;
  url: string;
};

type Tool = {
  id?: number;
  name: string;
  category: string;
  homepage_url: string;
  version?: string;
  smart_download_url?: string;
  icon_url?: string;
  versions?: Version[];
};

const ICON_MAP: Record<string, any> = {
  "VS Code": Code2,
  "Git": GitGraph,
  "Docker": Container,
  "Postman": Globe,
  "Terminal": Terminal,
  "Database": Database,
  "Node.js": Zap,
  "Python": Box,
  "NPM": Package,
  "VLC Media Player": Clapperboard,
  "OBS Studio": Video,
  "Steam": Gamepad,
  "Epic Games": Gamepad,
  "Discord": Smartphone, // Using Smartphone as a generic social icon if needed, or maybe something else
  "Xcode": Apple,
  "TikTok": Smartphone,
  "WeChat": Smartphone
};

export function AppGrid({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useLanguage();
  const os = useOS();
  const [apps, setApps] = useState<Tool[]>([]);
  const [editingApp, setEditingApp] = useState<Tool | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // State for version selection modal
  const [selectedAppForDownload, setSelectedAppForDownload] = useState<Tool | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Programming");
  const [version, setVersion] = useState("");
  const [url, setUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  const fetchTools = async () => {
    try {
      // Use proxy path defined in next.config.ts
      const res = await fetch("/api/py/tools");
      if (res.ok) {
        const data = await res.json();
        setApps(data);
      }
    } catch (e) {
      console.log("Failed to fetch tools.", e);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const resetForm = () => {
    setName("");
    setCategory("Programming");
    setVersion("");
    setUrl("");
    setIconUrl("");
    setEditingApp(null);
    setIsFormOpen(false);
  };

  const startEditing = (app: Tool) => {
    setName(app.name);
    setCategory(app.category);
    setVersion(app.version || "");
    setUrl(app.smart_download_url || app.homepage_url);
    setIconUrl(app.icon_url || "");
    setEditingApp(app);
    setIsFormOpen(true);
  };

  const saveApp = async () => {
    if (!name || !url) return;
    
    const payload = {
      name,
      category,
      version,
      homepage_url: url,
      smart_download_url: url,
      icon_url: iconUrl
    };

    try {
      const method = editingApp?.id ? "PUT" : "POST";
      const path = editingApp?.id ? `/tools/${editingApp.id}` : "/tools";
      
      const res = await fetch(`/api/py${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchTools();
        resetForm();
      }
    } catch (e) {
      console.error("Failed to save app", e);
    }
  };

  const handleAppClick = (app: Tool) => {
    if (app.versions && app.versions.length > 1) {
      setSelectedAppForDownload(app);
    } else if (app.versions && app.versions.length === 1) {
      window.open(app.versions[0].url, "_blank");
    } else {
      window.open(app.smart_download_url || app.homepage_url, "_blank");
    }
  };

  // Group by category
  const categories = ["Programming", "Media", "Games", "Social", "Other"];
  const groupedApps = categories.reduce((acc, cat) => {
    const catApps = apps.filter(app => app.category === cat);
    if (catApps.length > 0) acc[cat] = catApps;
    return acc;
  }, {} as Record<string, Tool[]>);

  return (
    <div className="flex flex-col gap-12 w-full">
      {isAdmin && (
        <div className="flex justify-end -mb-8">
           <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
           >
             <Plus className="w-5 h-5" /> {t("addApp")}
           </button>
        </div>
      )}

      {/* Version Selection Modal */}
      <AnimatePresence>
        {selectedAppForDownload && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedAppForDownload(null)} 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm glass rounded-3xl p-6 z-50 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        {selectedAppForDownload.icon_url && <img src={selectedAppForDownload.icon_url} className="w-8 h-8 rounded-lg" alt={selectedAppForDownload.name} />}
                        <h2 className="text-xl font-bold">{selectedAppForDownload.name}</h2>
                    </div>
                    <button onClick={() => setSelectedAppForDownload(null)} className="p-1 hover:bg-foreground/5 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-foreground/60 mb-2">Select a version to download:</p>
                    {selectedAppForDownload.versions?.map((ver, idx) => (
                        <a 
                            key={idx}
                            href={ver.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-colors group"
                            onClick={() => setSelectedAppForDownload(null)}
                        >
                            <span className="font-mono font-medium">{ver.version}</span>
                            <Download className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                        </a>
                    ))}
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Form Overlay */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass rounded-3xl p-6 z-50 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{editingApp ? t("editApp") : t("addApp")}</h2>
                    <button onClick={resetForm} className="p-1 hover:bg-foreground/5 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold opacity-50 uppercase">{t("appName")}</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="bg-foreground/5 rounded-xl px-4 py-2 outline-none border border-transparent focus:border-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold opacity-50 uppercase">{t("category")}</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="bg-foreground/5 rounded-xl px-4 py-2 outline-none">
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-bold opacity-50 uppercase">{t("version")}</label>
                            <input value={version} onChange={e => setVersion(e.target.value)} placeholder="v1.0.0" className="bg-foreground/5 rounded-xl px-4 py-2 outline-none" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs font-bold opacity-50 uppercase">{t("icon")} (URL)</label>
                            <input value={iconUrl} onChange={e => setIconUrl(e.target.value)} placeholder="https://..." className="bg-foreground/5 rounded-xl px-4 py-2 outline-none" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold opacity-50 uppercase">{t("downloadUrl")}</label>
                        <input value={url} onChange={e => setUrl(e.target.value)} className="bg-foreground/5 rounded-xl px-4 py-2 outline-none" />
                    </div>
                    <button onClick={saveApp} className="bg-blue-500 text-white font-bold py-3 rounded-xl mt-4 shadow-lg shadow-blue-500/20">{t("save")}</button>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {Object.entries(groupedApps).map(([category, categoryApps]) => (
          <div key={category} className="flex flex-col gap-6">
             <div className="flex items-center gap-3 border-b border-foreground/10 pb-2">
                <h2 className="text-xl font-bold text-foreground/80">{t(category.toLowerCase() as any) || category}</h2>
                <span className="text-xs font-mono text-foreground/40 bg-foreground/5 px-2 py-1 rounded-md">{categoryApps.length}</span>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 w-full">
              {categoryApps.map((app, index) => {
                const Icon = ICON_MAP[app.name] || AppWindow;
                return (
                  <div key={app.name + index} className="relative group">
                    <motion.div
                      onClick={() => handleAppClick(app)}
                      className="flex flex-col items-center gap-3 cursor-pointer"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl glass flex flex-col items-center justify-center text-foreground/80 group-hover:bg-foreground/5 transition-colors relative overflow-hidden">
                        {app.icon_url ? (
                            <img src={app.icon_url} className="w-full h-full object-cover" alt={app.name} />
                        ) : (
                            <Icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
                        )}
                        {app.versions && app.versions.length > 1 && (
                          <span className="absolute top-1 right-1 bg-foreground/80 text-[9px] text-background px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                            {app.versions.length}
                          </span>
                        )}
                        {!app.versions && app.version && (
                          <span className="absolute top-1 right-1 bg-blue-500 text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                            {app.version}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground/70 text-center">{app.name}</span>
                    </motion.div>
                    
                    {isAdmin && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); startEditing(app); }}
                            className="absolute -top-2 -right-2 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 border border-foreground/10"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
      ))}
    </div>
  );
}