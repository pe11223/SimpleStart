"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, Code2, Database, Globe, Container, GitGraph, 
  AppWindow, Zap, Box, Package, Clapperboard, Gamepad, 
  Video, Apple, Smartphone, Plus, Pencil, Trash2, X,
  ChevronDown, Download
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useOS } from "@/lib/hooks";

type Version = {
  version: string;
  date: string;
  url: string;
};

type Tool = {
  id?: number;
  name: string;
  category: string;
  homepage_url: string;
  description?: string;
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
  "Xcode": Apple,
  "TikTok": Smartphone,
  "WeChat": Smartphone
};

export function AppGrid() {
  const { t } = useLanguage();
  const os = useOS();
  const [apps, setApps] = useState<Tool[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

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

  // Group by category
  const categories = ["Programming", "Media", "Games", "Social", "Other"];
  const groupedApps = categories.reduce((acc, cat) => {
    const catApps = apps.filter(app => app.category === cat);
    if (catApps.length > 0) acc[cat] = catApps;
    return acc;
  }, {} as Record<string, Tool[]>);

  return (
    <div className="flex flex-col gap-12 w-full">
      {Object.entries(groupedApps).map(([category, categoryApps]) => (
          <div key={category} className="flex flex-col gap-6">
             <div className="flex items-center gap-3 border-b border-foreground/10 pb-2">
                <h2 className="text-xl font-bold text-foreground/80">{t(category.toLowerCase() as any) || category}</h2>
                <span className="text-xs font-mono text-foreground/40 bg-foreground/5 px-2 py-1 rounded-md">{categoryApps.length}</span>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
              {categoryApps.map((app, index) => {
                const Icon = ICON_MAP[app.name] || AppWindow;
                const latestVersion = app.versions?.[0];
                
                return (
                  <motion.div 
                    key={app.name + index} 
                    className="relative group glass rounded-3xl p-4 flex gap-4 hover:bg-foreground/5 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center shrink-0 overflow-hidden shadow-lg border border-white/10">
                        {app.icon_url ? (
                            <img src={app.icon_url} className="w-10 h-10 object-contain" alt={app.name} />
                        ) : (
                            <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                        )}
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-base truncate">{app.name}</h3>
                            {latestVersion && (
                                <span className="text-[9px] font-mono opacity-50 bg-foreground/10 px-1.5 py-0.5 rounded shrink-0">
                                    {latestVersion.version}
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] opacity-60 line-clamp-2 mt-1 mb-3">
                            {app.description || t("noDescription") || "No description available"}
                        </p>
                        
                        <div className="mt-auto flex gap-2">
                            {latestVersion ? (
                                <div className="relative group/btn flex-1">
                                    <a 
                                        href={latestVersion.url}
                                        className="flex items-center justify-center gap-2 bg-blue-500 text-white text-[11px] font-bold py-2 rounded-xl w-full hover:bg-blue-600 transition-colors"
                                    >
                                        <Download className="w-3 h-3" />
                                        {t("download") || "Download"}
                                    </a>
                                    
                                    {/* Version Dropdown */}
                                    {(app.versions?.length || 0) > 1 && (
                                        <div className="absolute bottom-full left-0 w-full mb-2 glass rounded-xl p-1 opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all z-10 shadow-xl flex flex-col gap-1">
                                            <div className="px-2 py-1 text-[9px] font-bold opacity-30 uppercase tracking-wider">{t("otherVersions") || "Other Versions"}</div>
                                            {app.versions?.slice(1).map((v, i) => (
                                                <a 
                                                    key={i} 
                                                    href={v.url}
                                                    className="flex items-center justify-between px-2 py-1.5 hover:bg-foreground/5 rounded-lg text-[10px]"
                                                >
                                                    <span className="font-mono opacity-70">{v.version}</span>
                                                    <Download className="w-3 h-3 opacity-50" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <a 
                                    href={app.homepage_url} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 bg-foreground/10 text-foreground text-[11px] font-bold py-2 rounded-xl w-full hover:bg-foreground/20 transition-colors"
                                >
                                    <Globe className="w-3 h-3" />
                                    {t("website") || "Website"}
                                </a>
                            )}
                        </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
      ))}
    </div>
  );
}