"use client";

import { useState, useEffect } from "react";

export type OS = "win" | "mac" | "mobile" | "other";

export function useOS(): OS {
  const [os, setOS] = useState<OS>("other");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      setOS("mobile");
    } else if (/mac|macintosh|mac os x/i.test(ua)) {
      setOS("mac");
    } else if (/win|windows/i.test(ua)) {
      setOS("win");
    } else {
      setOS("other");
    }
  }, []);

  return os;
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.log(error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Handle functional updates
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}
