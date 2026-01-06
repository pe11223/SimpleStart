"use client";

import { useState } from "react";
import { Plus, X, Globe, Folder, ExternalLink, ChevronRight, FolderPlus, ArrowLeft, Trash2, Link as LinkIcon, AlertTriangle, Search, LayoutGrid, List, ShoppingCart, Gamepad, Code2, Music, Book, Video, Film } from "lucide-react";
import { useLocalStorage } from "@/lib/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  type: 'link' | 'folder';
  title: string;
  url?: string;
  icon?: string;
  parentId: string | null;
  createdAt: number;
  clickCount?: number;
};

// Helper for smart icons
const getFolderIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("shop") || lower.includes("buy") || lower.includes("store") || lower.includes("购物") || lower.includes("商城") || lower.includes("买")) return ShoppingCart;
  if (lower.includes("game") || lower.includes("play") || lower.includes("游戏") || lower.includes("电竞")) return Gamepad;
  if (lower.includes("code") || lower.includes("dev") || lower.includes("git") || lower.includes("编程") || lower.includes("开发") || lower.includes("代码")) return Code2;
  if (lower.includes("music") || lower.includes("audio") || lower.includes("音乐") || lower.includes("音频")) return Music;
  if (lower.includes("video") || lower.includes("movie") || lower.includes("media") || lower.includes("tv") || lower.includes("视频") || lower.includes("电影") || lower.includes("影视")) return Video;
  if (lower.includes("read") || lower.includes("book") || lower.includes("study") || lower.includes("阅读") || lower.includes("书籍") || lower.includes("学习")) return Book;
  return Folder;
};

export function BookmarkManager() {
  const { t } = useLanguage();
  const [items, setItems] = useLocalStorage<Item[]>("simplestart-enhanced-bookmarks", []);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // UI States
  const [isAdding, setIsAdding] = useState<'link' | 'folder' | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [isFetchingIcon, setIsFetchingIcon] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // New Features States
  const [searchQuery, setSearchQuery] = useState("");
  const [isFlatView, setIsFlatView] = useState(false);

  const currentFolder = items.find(item => item.id === currentFolderId);

  // Derived Items Logic
  let displayItems: Item[] = [];

  if (searchQuery.trim()) {
    // Search Mode: Flatten and filter
    displayItems = items.filter(item => 
      item.type === 'link' && item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  } else if (isFlatView) {
    // Flat View: Show all links sorted by click count
    displayItems = items
      .filter(item => item.type === 'link')
      .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
  } else {
    // Standard View: Show children of current folder
    displayItems = items.filter(item => item.parentId === currentFolderId);
  }

  // Breadcrumbs
  const getBreadcrumbs = () => {
    const crumbs = [];
    let curr = currentFolder;
    while (curr) {
      crumbs.unshift(curr);
      curr = items.find(i => i.id === curr?.parentId);
    }
    return crumbs;
  };

  const addItem = async () => {
    if (!newItemTitle.trim()) return;
    
    // Create new item immediately (Optimistic UI)
    const newId = Date.now().toString();
    const url = isAdding === 'link' ? (newItemUrl.startsWith("http") ? newItemUrl : `https://${newItemUrl}`) : undefined;
    
    const newItem: Item = {
      id: newId,
      type: isAdding === 'folder' ? 'folder' : 'link',
      title: newItemTitle,
      url,
      // Temporarily use UOMG for immediate display while we fetch the cached version
      icon: undefined, 
      parentId: currentFolderId,
      createdAt: Date.now(),
      clickCount: 0
    };

    // Update State Immediately
    setItems([...items, newItem]);
    resetForm();

    // Background Fetch for Icon (if it's a link)
    if (isAdding === 'link' && url) {
        try {
            const res = await fetch(`/api/py/api/favicon?url=${encodeURIComponent(url)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.icon) {
                    // Update the specific item with the fetched icon
                    setItems((prevItems: Item[]) => prevItems.map(item => 
                        item.id === newId ? { ...item, icon: data.icon } : item
                    ));
                }
            }
        } catch (e) {
            console.error("Icon fetch failed", e);
        }
    }
  };

  const handleLinkClick = (item: Item) => {
    if (item.type === 'link' && item.url) {
      // Increment click count
      const updatedItems = items.map(i => 
        i.id === item.id ? { ...i, clickCount: (i.clickCount || 0) + 1 } : i
      );
      setItems(updatedItems);
      window.open(item.url, '_blank');
    } else if (item.type === 'folder') {
      setCurrentFolderId(item.id);
      setSearchQuery(""); // Clear search on navigation
    }
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const deleteRecursive = (itemId: string, currentList: Item[]): Item[] => {
      const item = currentList.find(i => i.id === itemId);
      if (!item) return currentList;
      
      let updatedList = currentList.filter(i => i.id !== itemId);
      if (item.type === 'folder') {
        const children = currentList.filter(i => i.parentId === itemId);
        children.forEach(child => {
          updatedList = deleteRecursive(child.id, updatedList);
        });
      }
      return updatedList;
    };

    setItems(deleteRecursive(itemToDelete, items));
    setItemToDelete(null);
  };

  const resetForm = () => {
    setNewItemTitle("");
    setNewItemUrl("");
    setIsAdding(null);
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-3xl relative">
      {/* Header / Controls */}
      <div className="flex flex-col gap-4 mb-4">
        {/* Top Bar: Breadcrumbs (Left) + Search/Toggle (Right) */}
        <div className="flex items-center justify-between">
          {/* Breadcrumbs (Hidden in Search/Flat mode) */}
          {!searchQuery && !isFlatView ? (
            <div className="flex items-center gap-2 text-sm text-foreground/60 overflow-hidden">
              <button 
                onClick={() => setCurrentFolderId(null)}
                className={cn("hover:text-foreground transition-colors shrink-0", currentFolderId === null && "font-bold text-foreground")}
              >
                {t("root")}
              </button>
              {getBreadcrumbs().map(folder => (
                <div key={folder.id} className="flex items-center gap-2 shrink-0">
                  <ChevronRight className="w-4 h-4 opacity-50" />
                  <button 
                    onClick={() => setCurrentFolderId(folder.id)}
                    className={cn("hover:text-foreground transition-colors max-w-[100px] truncate", currentFolderId === folder.id && "font-bold text-foreground")}
                  >
                    {folder.title}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm font-bold text-foreground/80">
              {searchQuery ? `${t("searchBookmarks")}` : t("mostVisited")}
            </div>
          )}

          <div className="flex items-center gap-2">
             {/* Search Input */}
             <div className="relative group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchBookmarks")}
                  className="bg-foreground/5 rounded-full pl-9 pr-4 py-1.5 text-sm outline-none w-32 focus:w-48 transition-all border border-transparent focus:border-blue-500/30"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-foreground/10 rounded-full">
                    <X className="w-3 h-3" />
                  </button>
                )}
             </div>

             {/* Flat View Toggle */}
             <button
               onClick={() => {
                 setIsFlatView(!isFlatView);
                 setSearchQuery("");
               }}
               className={cn("p-2 rounded-xl transition-colors", isFlatView ? "bg-blue-500 text-white" : "bg-foreground/5 hover:bg-foreground/10 text-foreground/70")}
               title={t("flatView")}
             >
               {isFlatView ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
             </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          
          {/* Items */}
          {displayItems.map(item => {
            const Icon = item.type === 'folder' ? getFolderIcon(item.title) : LinkIcon;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative flex flex-col items-center p-4 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-pointer select-none"
                onClick={() => handleLinkClick(item)}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-zinc-800 shadow-sm mb-3 overflow-hidden">
                  {item.type === 'folder' ? (
                    <Icon className="w-7 h-7 text-yellow-500" fill="currentColor" strokeWidth={1.5} />
                  ) : (
                    <img 
                      src={item.icon && item.icon.startsWith("data:image") ? item.icon : `https://api.uomg.com/api/get.favicon?url=${item.url}`}
                      alt={item.title}
                      className="w-8 h-8"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes("favicon.ico")) {
                            try {
                              const urlObj = new URL(item.url || "");
                              target.src = `${urlObj.origin}/favicon.ico`;
                            } catch {
                              target.style.display = 'none';
                            }
                        } else {
                            target.style.display = 'none';
                        }
                      }}
                    />
                  )}
                  {/* Click Count Badge (Flat View Only) */}
                  {isFlatView && (item.clickCount || 0) > 0 && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] px-1 rounded-bl-lg font-bold">
                      {item.clickCount}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-center line-clamp-2 w-full text-foreground/80 group-hover:text-foreground transition-colors">{item.title}</span>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete(item.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}

          {/* Create New Buttons (Only in Normal View) */}
          {!isAdding && !searchQuery && !isFlatView && (
            <>
              {/* Only allow creating folders at Root level */}
              {currentFolderId === null && (
                <button
                  onClick={() => setIsAdding('folder')}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-foreground/10 hover:border-foreground/30 hover:bg-foreground/5 transition-all gap-3 group"
                >
                  <FolderPlus className="w-8 h-8 text-foreground/40 group-hover:text-blue-500 transition-colors" />
                  <span className="text-sm font-medium text-foreground/60">{t("createFolder")}</span>
                </button>
              )}
              <button
                onClick={() => setIsAdding('link')}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-foreground/10 hover:border-foreground/30 hover:bg-foreground/5 transition-all gap-3 group"
              >
                <Plus className="w-8 h-8 text-foreground/40 group-hover:text-green-500 transition-colors" />
                <span className="text-sm font-medium text-foreground/60">{t("addBookmark")}</span>
              </button>
            </>
          )}

          {/* Form */}
          {isAdding && (
            <div className="col-span-2 md:col-span-3 lg:col-span-4 bg-foreground/5 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{isAdding === 'folder' ? t("createFolder") : t("addBookmark")}</h3>
                <button onClick={resetForm}><X className="w-5 h-5 opacity-50" /></button>
              </div>
              <div className="flex flex-col gap-3">
                <input
                  autoFocus
                  placeholder={isAdding === 'folder' ? t("folderName") : t("titlePlaceholder")}
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  className="bg-background/50 rounded-xl px-4 py-2 outline-none border border-transparent focus:border-blue-500 transition-colors"
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                />
                {isAdding === 'link' && (
                  <input
                    placeholder={t("urlPlaceholder")}
                    value={newItemUrl}
                    onChange={e => setNewItemUrl(e.target.value)}
                    className="bg-background/50 rounded-xl px-4 py-2 outline-none border border-transparent focus:border-blue-500 transition-colors"
                    onKeyDown={e => e.key === 'Enter' && addItem()}
                  />
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={resetForm} className="px-4 py-2 rounded-xl hover:bg-foreground/10 text-sm font-medium">{t("cancel")}</button>
                  <button 
                    onClick={addItem} 
                    className="px-6 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold shadow-lg hover:shadow-blue-500/20 transition-all"
                  >
                    {t("add")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {displayItems.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center h-48 opacity-30">
            {searchQuery ? <Search className="w-12 h-12 mb-2" /> : <Folder className="w-12 h-12 mb-2" />}
            <p>{searchQuery ? "No results found" : t("emptyFolder")}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl"
            onClick={(e) => e.stopPropagation()} 
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-foreground/10 rounded-2xl p-6 shadow-2xl max-w-xs w-full m-4"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">{t("confirmDelete")}</h3>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setItemToDelete(null)}
                    className="flex-1 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 font-medium"
                  >
                    {t("cancel")}
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                  >
                    {t("confirm")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
