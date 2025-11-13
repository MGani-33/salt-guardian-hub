import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, CheckCircle2, XCircle, AlertCircle, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemStatsCardsProps {
  stats: {
    total: number;
    online: number;
    offline: number;
    warning: number;
    systemsWithUpdates: number;
  } | undefined;
  isLoading: boolean;
}

const SystemStatsCards = ({ stats, isLoading }: SystemStatsCardsProps) => {
  const statCards = [
    {
      title: "Total Systems",
      value: stats?.total || 0,
      icon: Monitor,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Online",
      value: stats?.online || 0,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Offline",
      value: stats?.offline || 0,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Warning",
      value: stats?.warning || 0,
      icon: AlertCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Updates Available",
      value: stats?.systemsWithUpdates || 0,
      icon: Package,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="transition-all hover:shadow-lg hover:shadow-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`h-8 w-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SystemStatsCards;
