import { Eye, TrendingUp, TrendingDown, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/types";

interface StatsOverviewProps {
  stats?: DashboardStats;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const defaultStats = {
    totalVisibility: 0,
    rankingImproved: 0,
    rankingDropped: 0,
    keywordsTracked: 0,
  };

  const displayStats = stats || defaultStats;

  const statCards = [
    {
      title: "Total Visibility",
      value: `${displayStats.totalVisibility}%`,
      icon: Eye,
      bgColor: "bg-blue-100",
      iconColor: "text-primary",
    },
    {
      title: "Ranking Improved",
      value: displayStats.rankingImproved.toString(),
      icon: TrendingUp,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Ranking Dropped",
      value: displayStats.rankingDropped.toString(),
      icon: TrendingDown,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      title: "Keywords Tracked",
      value: displayStats.keywordsTracked.toString(),
      icon: Hash,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.title}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
