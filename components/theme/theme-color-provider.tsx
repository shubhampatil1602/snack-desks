"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeColorContextType = {
  themeColor: string;
  setThemeColor: (color: string) => void;
};

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(
  undefined,
);

export function ThemeColorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeColor, setThemeColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme-color") || "claude";
    }
    return "claude";
  });

  useEffect(() => {
    if (themeColor === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeColor);
    }
    
    localStorage.setItem("theme-color", themeColor);
  }, [themeColor]);

  return (
    <ThemeColorContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export function useThemeColor() {
  const context = useContext(ThemeColorContext);
  if (!context)
    throw new Error("useThemeColor must be used within ThemeColorProvider");
  return context;
}
