import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Egot Admin",
  description: "Administration console",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider className="dark bg-neutral-950 w-full">
          <div className="flex min-h-screen w-full bg-neutral-950 text-white">
            <AdminSidebar />
            <main className="flex min-w-0 flex-1 flex-col">
              <header className="flex h-16 items-center justify-between border-b border-white/10 px-6">
                <div className="flex items-center gap-3">
                  <SidebarTrigger />
                  <div className="leading-tight">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      Superuser
                    </p>
                    <h1 className="text-lg font-semibold">Control room</h1>
                  </div>
                </div>
                <Badge variant="outline" className="border-white/20 text-white">
                  Basic auth active
                </Badge>
              </header>
              <div className="flex-1 overflow-auto p-6">{children}</div>
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
