import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RecentActivity() {
  const { data: activities } = useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
  });

  // Mock data for demonstration
  const mockActivities = [
    {
      id: "1",
      type: "improvement",
      message: 'Improved ranking for "CDP tools"',
      timestamp: "2 hours ago",
      color: "bg-green-400",
    },
    {
      id: "2", 
      type: "mention",
      message: "New mention detected on Claude",
      timestamp: "4 hours ago",
      color: "bg-yellow-400",
    },
    {
      id: "3",
      type: "loss",
      message: 'Lost visibility for "marketing automation"',
      timestamp: "6 hours ago", 
      color: "bg-red-400",
    },
    {
      id: "4",
      type: "tracking",
      message: "Started tracking 15 new keywords",
      timestamp: "8 hours ago",
      color: "bg-blue-400",
    },
  ];

  const displayActivities = activities || mockActivities;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-500 mt-1">Last 24 hours</p>
      </CardHeader>
      <CardContent className="p-6">
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
      </CardContent>
    </Card>
  );
}
