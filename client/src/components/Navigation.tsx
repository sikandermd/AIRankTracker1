import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { BarChart3, Home, Tag, Plus, Upload, FileSpreadsheet, Bell, FileText, ChevronDown, Key, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AddKeywordModal from "./AddKeywordModal";
import CSVImportModal from "./CSVImportModal";
import GoogleSheetsImportModal from "./GoogleSheetsImportModal";
import AlertSetupModal from "./AlertSetupModal";
import APIUsageIndicator from "./APIUsageIndicator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const Navigation = () => {
  const [location, setLocation] = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [apiEnabled, setApiEnabled] = useState(true);
  const { toast } = useToast();

  // Load API toggle state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('openai-api-enabled');
    if (savedState !== null) {
      setApiEnabled(savedState === 'true');
    }
  }, []);

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/keywords", label: "Keywords", icon: Tag },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const generateReport = async () => {
    try {
      const response = await fetch('/api/tracking-results/latest');
      const data = await response.json();
      
      if (data.length === 0) {
        toast({
          title: "No Data Available",
          description: "Start tracking keywords to generate reports",
          variant: "destructive",
        });
        return;
      }

      // Simple CSV generation
      const headers = ['Keyword', 'Platform', 'Mentioned', 'Position', 'Date'];
      const rows = data.map((item: any) => [
        item.keyword?.keyword || 'Unknown',
        item.aiPlatform,
        item.mentioned ? 'Yes' : 'No',
        item.position || 'None',
        new Date(item.createdAt).toLocaleDateString()
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai-ranking-report.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Report Generated",
        description: "Your tracking report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  const handleKeywordAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
  };

  const handleApiToggle = (enabled: boolean) => {
    setApiEnabled(enabled);
    
    // Store in localStorage for persistence
    localStorage.setItem('openai-api-enabled', enabled.toString());
    
    toast({
      title: enabled ? "OpenAI API Enabled" : "OpenAI API Disabled",
      description: enabled 
        ? "AI analysis will be performed during tracking" 
        : "Tracking will continue without AI analysis",
      variant: enabled ? "default" : "destructive",
    });
  };

  return (
    <TooltipProvider>
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
          
          {/* API Toggle and Quick Actions */}
          <div className="flex items-center space-x-4">
            {/* API Usage Indicator */}
            <APIUsageIndicator />
            
            {/* OpenAI API Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2 px-3 py-2 border rounded-lg bg-gray-50 cursor-pointer">
                  <Key className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">OpenAI API</span>
                  <Switch
                    checked={apiEnabled}
                    onCheckedChange={handleApiToggle}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <Badge variant={apiEnabled ? "success" : "secondary"} className={`text-xs ${
                    apiEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {apiEnabled ? "ON" : "OFF"}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">
                  {apiEnabled 
                    ? "OpenAI API is active - AI analysis enabled" 
                    : "OpenAI API is disabled - tracking without AI analysis"
                  }
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Quick Actions Dropdown */}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Quick Actions</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Keywords
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setShowCSVModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV File
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setShowSheetsModal(true)}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Import from Sheets
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={generateReport}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setShowAlertModal(true)}>
                <Bell className="w-4 h-4 mr-2" />
                Setup Alerts
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <AddKeywordModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onKeywordAdded={handleKeywordAdded}
      />
      
      <CSVImportModal 
        isOpen={showCSVModal} 
        onClose={() => setShowCSVModal(false)}
        onImportComplete={handleKeywordAdded}
      />
      
      <GoogleSheetsImportModal 
        isOpen={showSheetsModal} 
        onClose={() => setShowSheetsModal(false)}
        onImportComplete={handleKeywordAdded}
      />
      
      <AlertSetupModal 
        isOpen={showAlertModal} 
        onClose={() => setShowAlertModal(false)}
      />
    </TooltipProvider>
  );
};

export default Navigation;