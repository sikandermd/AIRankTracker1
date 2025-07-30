import { useLocation } from "wouter";
import { BarChart3, Home, Tag, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/keywords", label: "Keywords", icon: Tag },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-bold text-gray-900">AI Ranking Tracker</h1>
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location === item.path ? "default" : "ghost"}
                onClick={() => setLocation(item.path)}
                className="flex items-center space-x-2"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;