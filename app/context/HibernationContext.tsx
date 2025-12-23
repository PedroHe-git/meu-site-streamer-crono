// app/context/HibernationContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type HibernationContextType = {
  isHibernating: boolean;
  setIsHibernating: (value: boolean) => void;
};

const HibernationContext = createContext<HibernationContextType | undefined>(undefined);

export function HibernationProvider({ children }: { children: ReactNode }) {
  const [isHibernating, setIsHibernating] = useState(false);

  return (
    <HibernationContext.Provider value={{ isHibernating, setIsHibernating }}>
      {children}
    </HibernationContext.Provider>
  );
}

export function useHibernation() {
  const context = useContext(HibernationContext);
  if (!context) {
    throw new Error("useHibernation deve ser usado dentro de um HibernationProvider");
  }
  return context;
}