import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Code2, Database, Globe, Container, GitGraph, AppWindow, Zap, Box, Package, Clapperboard, Gamepad, Video, Apple, Smartphone } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useOS } from "@/lib/hooks";

type Tool = {
  id?: number;
  name: string;
  category: string;
  url: string;
  version?: string;
  smart_download_url?: string;
  icon?: any;
  platforms?: string[]; // "win", "mac", "mobile"
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

  useEffect(() => {
    async function fetchTools() {
      try {
        const res = await fetch("http://212.64.81.175:8000/tools");
        if (res.ok) {
          const data = await res.json();
          let mappedApps: Tool[] = [];

          if (data && data.length > 0) {
            mappedApps = data.map((item: any) => ({
              name: item.name,
              category: item.category || "Programming",
              url: item.smart_download_url || item.homepage_url,
              version: item.version,
              icon: ICON_MAP[item.name] || AppWindow,
              platforms: ["win"] // Assume crawled backend apps are Windows for now
            }));
          }

          // Inject Platform Specific Mock Data for Demo
          if (os === "mac") {
             mappedApps = [
               { name: "Xcode", category: "Programming", url: "#", icon: ICON_MAP["Xcode"], platforms: ["mac"] },
               { name: "VS Code", category: "Programming", url: "https://code.visualstudio.com/download", icon: ICON_MAP["VS Code"], platforms: ["mac", "win"] },
               { name: "Docker", category: "Programming", url: "https://docs.docker.com/desktop/install/mac-install/", icon: ICON_MAP["Docker"], platforms: ["mac", "win"] }
             ];
          } else if (os === "mobile") {
             mappedApps = [
               { name: "TikTok", category: "Social", url: "#", icon: ICON_MAP["TikTok"], platforms: ["mobile"] },
               { name: "WeChat", category: "Social", url: "#", icon: ICON_MAP["WeChat"], platforms: ["mobile"] }
             ];
          } else {
             // Windows / Other - Keep fetched apps
             // Maybe add "platforms: ['win']" to them implicitly
          }

          setApps(mappedApps);
        }
      } catch (e) {
        console.log("Failed to fetch tools.", e);
      }
    }
    fetchTools();
  }, [os]);

  // Group by category
  const categories = ["Programming", "Media", "Games", "Social", "Other"];
  const groupedApps = categories.reduce((acc, cat) => {
    const catApps = apps.filter(app => {
        return app.category === cat;
    });
    
    if (catApps.length > 0) acc[cat] = catApps;
    return acc;
  }, {} as Record<string, Tool[]>);

  return (
    <div className="flex flex-col gap-12 w-full">
      {Object.keys(groupedApps).length === 0 && (
         <div className="text-center opacity-50 py-10">No apps found for your device ({os}).</div>
      )}
      
      {Object.entries(groupedApps).map(([category, categoryApps]) => {
        if (categoryApps.length === 0) return null;
        
        // Translate category
        const translatedCategory = t(category.toLowerCase() as any) || category;

        return (
          <div key={category} className="flex flex-col gap-6">
             <div className="flex items-center gap-3 border-b border-foreground/10 pb-2">
                <h2 className="text-xl font-bold text-foreground/80">{translatedCategory}</h2>
                <span className="text-xs font-mono text-foreground/40 bg-foreground/5 px-2 py-1 rounded-md">{categoryApps.length}</span>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 w-full">
              {categoryApps.map((app, index) => {
                const Icon = ICON_MAP[app.name] || AppWindow;
                return (
                  <motion.a
                    key={app.name + index}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-3 group"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl glass flex flex-col items-center justify-center text-foreground/80 group-hover:bg-foreground/5 transition-colors relative">
                      <Icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
                      {app.version && (
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                          {app.version}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground/70 text-center">{app.name}</span>
                  </motion.a>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}