import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here's what you've been working on.
          </p>
        </div>
        <Button size="lg" className="shadow-lg">
          + New Project
        </Button>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-4">My Games</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Example Project Card */}
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader className="p-0">
              <div className="aspect-video bg-muted relative rounded-t-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  Preview
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg">The Lost Crown</CardTitle>
                <Badge variant="secondary">Draft</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                A fantasy RPG where you search for the lost crown of the king.
              </p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <span className="text-xs text-muted-foreground">
                Last edited 2h ago
              </span>
              <Button
                variant="default"
                size="sm"
                asChild
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 hover:bg-indigo-700"
              >
                <Link href="/editor/123">Edit</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* New Project Placeholder */}
          <Card className="border-dashed flex flex-col items-center justify-center p-8 hover:bg-muted/50 transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
            <div className="text-4xl mb-2">+</div>
            <p className="font-medium">Create New Game</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
