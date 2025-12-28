import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Gamepad2, Users, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("Dashboard.overview");

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-neutral-900 border-white/10 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              {t("totalGames")}
            </CardTitle>
            <Gamepad2 className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-neutral-500">{t("totalGamesTrend")}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-white/10 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              {t("activePlayers")}
            </CardTitle>
            <Users className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350</div>
            <p className="text-xs text-neutral-500">
              {t("activePlayersTrend")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-white/10 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              {t("assetUsage")}
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-neutral-500">{t("assetUsageTrend")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">
          {t("yourProjects")}
        </h2>
        <Button
          asChild
          className="bg-white text-black hover:bg-neutral-200 font-bold"
        >
          <Link href="/create">
            <Plus className="mr-2 h-4 w-4" /> {t("newProject")}
          </Link>
        </Button>
      </div>

      {/* Projects Grid (Placeholder) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="bg-neutral-900 border-white/10 text-white hover:border-white/30 transition-colors cursor-pointer group"
          >
            <CardHeader>
              <CardTitle>Project Alpha {i}</CardTitle>
              <CardDescription className="text-neutral-500">
                {t("lastEdited", { days: 2 })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full rounded-md bg-neutral-800 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-neutral-600 group-hover:text-neutral-400 transition-colors">
                  <Gamepad2 className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
