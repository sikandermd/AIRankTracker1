import { Plus, FileText, Bell, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuickActions() {
  const actions = [
    {
      icon: Plus,
      label: "Add New Keywords",
      onClick: () => console.log("Add keywords"),
    },
    {
      icon: FileText,
      label: "Generate Report", 
      onClick: () => console.log("Generate report"),
    },
    {
      icon: Bell,
      label: "Setup Alerts",
      onClick: () => console.log("Setup alerts"),
    },
    {
      icon: BarChart3,
      label: "View Analytics",
      onClick: () => console.log("View analytics"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full justify-start h-12 text-left font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
            onClick={action.onClick}
          >
            <action.icon className="w-4 h-4 text-primary mr-3" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
