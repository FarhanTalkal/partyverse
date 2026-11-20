import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { CosmicBackdrop } from "@/components/ui/CosmicBackdrop";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PartyVerse — Family party games online",
  description:
    "Play Brain Battle, Chaos Challenge, Bluff & Betray, and Mind Match with friends and family — room codes, no downloads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("partyverse.theme");if(t==="light"){document.documentElement.classList.remove("dark");document.documentElement.dataset.theme="light";}else{document.documentElement.classList.add("dark");document.documentElement.dataset.theme=t==="dark"?"dark":"dark";}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${display.variable} ${body.variable} font-body antialiased`}
        suppressHydrationWarning
      >
        <CosmicBackdrop />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
