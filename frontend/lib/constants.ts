import { Github } from "lucide-react";
import { GoogleIcon, BaiduIcon, BingIcon, BilibiliIcon } from "@/components/icons";

export const ALL_ENGINES = [
  { id: "google", name: "Google", url: "https://www.google.com/search?q=", icon: GoogleIcon, placeholder: "Search Google..." },
  { id: "baidu", name: "Baidu", url: "https://www.baidu.com/s?wd=", icon: BaiduIcon, placeholder: "百度一下..." },
  { id: "github", name: "GitHub", url: "https://github.com/search?q=", icon: Github, placeholder: "Search Repositories..." },
  { id: "bing", name: "Bing", url: "https://www.bing.com/search?q=", icon: BingIcon, placeholder: "Search Bing..." },
  { id: "bilibili", name: "Bilibili", url: "https://search.bilibili.com/all?keyword=", icon: BilibiliIcon, placeholder: "搜索哔哩哔哩..." },
];
