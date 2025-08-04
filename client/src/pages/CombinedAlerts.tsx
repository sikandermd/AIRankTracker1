import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Mail, TrendingUp, RefreshCw, Bell } from "lucide-react";

interface CombinedAlert {
  id: string;
  brandId: string;
  keywordId: string;
  brandName: string;
  keyword: string;
  email: string;
  alerts: Array<{
    type: 'mention_change' | 'position_improve' | 'new_platform' | 'mention_increase';
    platform: string;
    previousValue: string;
    currentValue: string;
    timestamp: string;
  }>;
  combinedAt: string;
  sent: boolean;
}

interface AlertStats {
  totalCombined: number;
  totalIndividual: number;
  sentToday: number;
  averagePerBatch: number;
}

export default function CombinedAlerts() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");

  const { data: combinedAlerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ["/api/combined-alerts", selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/combined-alerts?range=${selectedTimeRange}`);
      if (!response.ok) throw new Error("Failed to fetch combined alerts");
      return response.json() as Promise<CombinedAlert[]>;
    },
  });

  const { data: alertStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/combined-alerts/stats"],
    queryFn: async () => {
      const response = await fetch("/api/combined-alerts/stats");
      if (!response.ok) throw new Error("Failed to fetch alert stats");
      return response.json() as Promise<AlertStats>;
    },
  });

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'mention_change': return '🎉';
      case 'position_improve': return '📈';
      case 'new_platform': return '🚀';
      case 'mention_increase': return '📊';
      default: return '🔔';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'mention_change': return 'New Mention';
      case 'position_improve': return 'Position Improved';
      case 'new_platform': return 'New Platform';
      case 'mention_increase': return 'Mentions Increased';
      default: return 'Alert';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'mention_change': return 'bg-green-100 text-green-800';
      case 'position_improve': return 'bg-blue-100 text-blue-800';
      case 'new_platform': return 'bg-purple-100 text-purple-800';
      case 'mention_increase': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const forceSendPendingAlerts = async () => {
    try {
      const response = await fetch("/api/combined-alerts/force-send", {
        method: "POST",
      });
      if (response.ok) {
        refetchAlerts();
      }
    } catch (error) {
      console.error("Failed to force send alerts:", error);
    }
  };

  if (alertsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Combined Alerts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage your combined email alert system
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={forceSendPendingAlerts} variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Force Send Pending
          </Button>
          <Button onClick={() => refetchAlerts()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Combined</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats?.totalCombined || 0}</div>
            <p className="text-xs text-muted-foreground">Combined emails sent</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Individual Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats?.totalIndividual || 0}</div>
            <p className="text-xs text-muted-foreground">Total alerts processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats?.sentToday || 0}</div>
            <p className="text-xs text-muted-foreground">Emails sent today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Batch</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats?.averagePerBatch?.toFixed(1) || "0.0"}</div>
            <p className="text-xs text-muted-foreground">Alerts per email</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2">
        {[
          { value: "1d", label: "Last 24h" },
          { value: "7d", label: "Last 7 days" },
          { value: "30d", label: "Last 30 days" },
          { value: "all", label: "All time" }
        ].map((range) => (
          <Button
            key={range.value}
            variant={selectedTimeRange === range.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTimeRange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Combined Alerts List */}
      <div className="space-y-4">
        {combinedAlerts && combinedAlerts.length > 0 ? (
          combinedAlerts.map((combinedAlert) => (
            <Card key={combinedAlert.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {combinedAlert.brandName} - "{combinedAlert.keyword}"
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sent to: {combinedAlert.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={combinedAlert.sent ? "default" : "secondary"}>
                      {combinedAlert.sent ? "Sent" : "Pending"}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(combinedAlert.combinedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{combinedAlert.alerts.length} alerts combined</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>
                      Platforms: {[...new Set(combinedAlert.alerts.map(a => a.platform))].join(', ')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {combinedAlert.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getAlertTypeIcon(alert.type)}</span>
                          <div>
                            <Badge className={getAlertTypeColor(alert.type)}>
                              {getAlertTypeLabel(alert.type)}
                            </Badge>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {alert.platform}: {alert.previousValue} → {alert.currentValue}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No combined alerts found for the selected time range.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}