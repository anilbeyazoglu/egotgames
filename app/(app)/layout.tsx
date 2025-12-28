import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 hidden md:flex flex-col">
        <div className="p-4 h-14 border-b flex items-center">
          <Link href="/" className="font-bold tracking-tight">
            Egot Console
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground px-2">
                Menu
              </h4>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/community">Community</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/settings">Settings</Link>
              </Button>
            </div>
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/avatar-placeholder.png" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">User</p>
              <p className="text-xs text-muted-foreground">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center px-6 justify-between">
          <h1 className="font-semibold text-lg">Dashboard</h1>
          <Button variant="outline" size="sm">
            Feedback
          </Button>
        </header>
        <ScrollArea className="flex-1 p-6">{children}</ScrollArea>
      </main>
    </div>
  );
}
