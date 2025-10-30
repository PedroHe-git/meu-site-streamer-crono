// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "@/app/components/theme-provider";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] });

// 🔹 Metadados do site
export const metadata: Metadata = {
  title: "Meu Cronograma",
  description: "Organize seus filmes, séries e animes.",
};


const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Script do Microsoft Clarity — carrega apenas em produção */}
        {clarityId && process.env.NODE_ENV === "production" && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityId}");`,
            }}
          />
        )}
      </head>

      <body className={`${inter.className} bg-background text-foreground`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <main>{children}</main>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
