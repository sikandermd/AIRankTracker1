import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RecentActivity() {
  const { data: activities } = useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
  });

  const displayActivities = activities || [];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-500 mt-1">Last 24 hours</p>
      </CardHeader>
      <CardContent className="p-6">
        {displayActivities.length > 0 ? (
          <div className="space-y-4">
            {(displayActivities as any).map((activity: any) => (
              <div key={activity.id} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 ${activity.color} rounded-full mt-2`}></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No recent activity.</p>
            <p className="text-xs mt-1">Activity will appear here after you start tracking keywords.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
