// app/components/theme-provider.tsx (Versão Corrigida)

"use client"

import * as React from "react"
// 1. Importa o componente diretamente
import { ThemeProvider as NextThemesProvider } from "next-themes"
// 2. Importa o tipo diretamente da lib principal
import { ThemeProviderProps } from "next-themes" 

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}