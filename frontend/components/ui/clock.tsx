"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

export function Clock() {
  const { language } = useLanguage();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-32" />;

  const locale = language === "zh" ? "zh-CN" : "en-US";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-10 select-none"
    >
      <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-foreground font-mono">
        {time.toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit' })}
      </h1>
      <p className="text-xl md:text-2xl text-foreground/60 mt-4 font-medium">
        {time.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </motion.div>
  );
}
