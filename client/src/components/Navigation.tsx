import { useState } from "react";
import { useLocation } from "wouter";
import { BarChart3, Home, Tag, Plus, Upload, FileSpreadsheet, Bell, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import AddKeywordModal from "./AddKeywordModal";
import CSVImportModal from "./CSVImportModal";
import GoogleSheetsImportModal from "./GoogleSheetsImportModal";
import AlertSetupModal from "./AlertSetupModal";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const Navigation = () => {
  const [location, setLocation] = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const { toast } = useToast();

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

  return (
    <>
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
    </>
  );
};

export default Navigation;