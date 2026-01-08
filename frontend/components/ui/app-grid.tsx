"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Code2, Database, Globe, Container, GitGraph, AppWindow, Zap, Box, Package, Clapperboard, Gamepad, Video, Apple, Smartphone, Plus, Pencil, Trash2, X, Download, ChevronDown, Upload, FileUp } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useOS } from "@/lib/hooks";

type Version = {
  version: string;
  url: string;
  group?: string; // "LTS", "Current", "Custom", etc.
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
  "Discord": Smartphone,
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Programming");
  const [homepageUrl, setHomepageUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  
  // Version management in form
  const [versions, setVersions] = useState<Version[]>([]);
  const [newVersionNum, setNewVersionNum] = useState("");
  const [newVersionUrl, setNewVersionUrl] = useState("");
  const [newVersionGroup, setNewVersionGroup] = useState("Custom");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTools = async () => {
    try {
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
    setHomepageUrl("");
    setIconUrl("");
    setVersions([]);
    setNewVersionNum("");
    setNewVersionUrl("");
    setNewVersionGroup("Custom");
    setEditingApp(null);
    setIsFormOpen(false);
  };

  const startEditing = (app: Tool) => {
    setName(app.name);
    setCategory(app.category);
    setHomepageUrl(app.homepage_url);
    setIconUrl(app.icon_url || "");
    setVersions(app.versions || []);
    // If no versions list but has single version, populate it
    if ((!app.versions || app.versions.length === 0) && app.version) {
        setVersions([{ 
            version: app.version, 
            url: app.smart_download_url || app.homepage_url,
            group: "Latest"
        }]);
    }
    setEditingApp(app);
    setIsFormOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/api/py/api/upload", {
            method: "POST",
            body: formData
        });
        if (res.ok) {
            const data = await res.json();
            setNewVersionUrl(data.url);
        } else {
            alert("Upload failed");
        }
    } catch (err) {
        console.error(err);
        alert("Upload failed");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addVersion = () => {
    if (!newVersionNum || !newVersionUrl) return;
    setVersions([...versions, { version: newVersionNum, url: newVersionUrl, group: newVersionGroup }]);
    setNewVersionNum("");
    setNewVersionUrl("");
  };

  const removeVersion = (idx: number) => {
    setVersions(versions.filter((_, i) => i !== idx));
  };

  const saveApp = async () => {
    if (!name) return;
    
    // Determine primary version (latest)
    const primaryVersion = versions.length > 0 ? versions[0].version : "";
    const primaryUrl = versions.length > 0 ? versions[0].url : homepageUrl;

    const payload = {
      name,
      category,
      homepage_url: homepageUrl || primaryUrl,
      icon_url: iconUrl,
      version: primaryVersion, // Legacy field support
      smart_download_url: primaryUrl, // Legacy field support
      versions_json: JSON.stringify(versions) // Backend expects stringified JSON for custom field
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
      // Reset expansion state (optional: expand LTS by default?)
      // For now, collapse all
      setExpandedGroups({});
    } else if (app.versions && app.versions.length === 1) {
      window.open(app.versions[0].url, "_blank");
    } else {
      window.open(app.smart_download_url || app.homepage_url, "_blank");
    }
  };

  const toggleGroup = (group: string) => {
      setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Group by category
  const categories = ["Programming", "Media", "Games", "Social", "Other"];
  const groupedApps = categories.reduce((acc, cat) => {
    const catApps = apps.filter(app => app.category === cat);
    if (catApps.length > 0) acc[cat] = catApps;
    return acc;
  }, {} as Record<string, Tool[]>);

  // Group versions for modal
  const getGroupedVersions = (app: Tool) => {
      if (!app.versions) return {};
      return app.versions.reduce((acc, ver) => {
          const group = ver.group || "Other";
          if (!acc[group]) acc[group] = [];
          acc[group].push(ver);
          return acc;
      }, {} as Record<string, Version[]>);
  };

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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm glass rounded-3xl p-6 z-50 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white/50 backdrop-blur-md p-2 -mx-2 rounded-xl z-10">
                    <div className="flex items-center gap-3">
                        {selectedAppForDownload.icon_url && <img src={selectedAppForDownload.icon_url} className="w-8 h-8 rounded-lg" alt={selectedAppForDownload.name} />}
                        <h2 className="text-xl font-bold">{selectedAppForDownload.name}</h2>
                    </div>
                    <button onClick={() => setSelectedAppForDownload(null)} className="p-1 hover:bg-foreground/5 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex flex-col gap-4">
                    {Object.entries(getGroupedVersions(selectedAppForDownload)).map(([group, versions]) => (
                        <div key={group} className="flex flex-col gap-2">
                             <button 
                                onClick={() => toggleGroup(group)}
                                className="flex items-center justify-between text-xs font-bold uppercase text-foreground/40 px-2 py-2 hover:text-foreground/70 transition-colors bg-foreground/5 rounded-lg w-full"
                             >
                                <span className="flex items-center gap-2">{group} <span className="opacity-50 text-[10px] font-normal">({versions.length})</span></span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedGroups[group] ? "rotate-180" : ""}`} />
                             </button>
                             
                             <AnimatePresence>
                                {expandedGroups[group] && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="flex flex-col gap-1 overflow-hidden pl-2 border-l-2 border-foreground/5"
                                    >
                                        {versions.map((ver, idx) => (
                                            <a 
                                                key={idx}
                                                href={ver.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-2 rounded-lg hover:bg-foreground/5 transition-colors group text-sm"
                                                onClick={() => setSelectedAppForDownload(null)}
                                            >
                                                <span className="font-mono font-medium">{ver.version}</span>
                                                <Download className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                                            </a>
                                        ))}
                                    </motion.div>
                                )}
                             </AnimatePresence>
                        </div>
                    ))}
                    {(!selectedAppForDownload.versions || selectedAppForDownload.versions.length === 0) && (
                        <p className="text-center opacity-50">No versions available.</p>
                    )}
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass rounded-3xl p-6 z-50 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{editingApp ? t("editApp") : t("addApp")}</h2>
                    <button onClick={resetForm} className="p-1 hover:bg-foreground/5 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-col gap-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                             <label className="text-xs font-bold opacity-50 uppercase">Homepage URL</label>
                             <input value={homepageUrl} onChange={e => setHomepageUrl(e.target.value)} className="bg-foreground/5 rounded-xl px-4 py-2 outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                             <label className="text-xs font-bold opacity-50 uppercase">{t("icon")} (URL)</label>
                             <input value={iconUrl} onChange={e => setIconUrl(e.target.value)} placeholder="https://..." className="bg-foreground/5 rounded-xl px-4 py-2 outline-none" />
                        </div>
                    </div>

                    <div className="h-px bg-foreground/10 my-2" />

                    {/* Version Management */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold opacity-50 uppercase flex items-center justify-between">
                            Versions
                            <span className="text-[10px] opacity-70">Top one is primary</span>
                        </label>
                        
                        {/* List Existing */}
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto p-1">
                            {versions.map((v, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-foreground/5 p-2 rounded-lg text-sm">
                                    <span className="font-bold w-20 truncate">{v.group || "Custom"}</span>
                                    <span className="font-mono w-20 truncate">{v.version}</span>
                                    <span className="flex-1 truncate opacity-50 text-xs">{v.url}</span>
                                    <button onClick={() => removeVersion(idx)} className="p-1 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>

                        {/* Add New */}
                        <div className="flex flex-col gap-2 bg-foreground/5 p-3 rounded-xl mt-2">
                             <div className="flex gap-2">
                                 <input value={newVersionGroup} onChange={e => setNewVersionGroup(e.target.value)} placeholder="Group (e.g. LTS)" className="bg-background/50 rounded-lg px-2 py-1 text-sm w-24" />
                                 <input value={newVersionNum} onChange={e => setNewVersionNum(e.target.value)} placeholder="Version (e.g. 1.0.0)" className="bg-background/50 rounded-lg px-2 py-1 text-sm w-24" />
                             </div>
                             <div className="flex gap-2 items-center">
                                 <input value={newVersionUrl} onChange={e => setNewVersionUrl(e.target.value)} placeholder="Download URL" className="bg-background/50 rounded-lg px-2 py-1 text-sm flex-1" />
                                 <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={handleFileUpload}
                                 />
                                 <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="p-1.5 bg-background/50 rounded-lg hover:bg-background/80"
                                    title="Upload File"
                                    disabled={isUploading}
                                 >
                                    {isUploading ? <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                                 </button>
                             </div>
                             <button onClick={addVersion} className="bg-foreground/10 hover:bg-foreground/20 text-xs font-bold py-1 rounded-lg">Add Version</button>
                        </div>
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
                        {((app.versions && app.versions.length === 1) || (!app.versions && app.version)) && (
                          <span className="absolute top-1 right-1 bg-blue-500 text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                            {app.versions ? app.versions[0].version : app.version}
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
