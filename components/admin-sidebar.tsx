"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  FolderKanban,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";

const navItems = [
  {
    title: "Dashboard",
    url: "/su/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    url: "/su/users",
    icon: Users,
  },
  {
    title: "User Games",
    url: "/su/user-games",
    icon: Gamepad2,
  },
  {
    title: "Asset Library",
    url: "/su/asset-library",
    icon: FolderKanban,
  },
  {
    title: "Transactions",
    url: "/su/transactions",
    icon: Receipt,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-white/10 bg-neutral-950 text-white">
      <SidebarHeader className="border-b border-white/10 p-4">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <div className="relative h-10 w-10 rounded-lg bg-white/10">
            <Image
              src="/logo.png"
              alt="EgotGames Logo"
              fill
              className="object-contain p-1.5"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm uppercase tracking-[0.2em] text-neutral-400">
              SU
            </span>
            <span className="text-base">Egot Admin</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url || pathname?.startsWith(`${item.url}/`)}
                className="hover:bg-white/10 hover:text-white data-[active=true]:bg-white/10 data-[active=true]:text-white transition-colors"
              >
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Basic access enabled</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
