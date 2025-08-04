import { useState } from "react";
import { Plus, FileText, Bell, BarChart3, FileSpreadsheet, Upload, Tag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddKeywordModal from "./AddKeywordModal";
import BulkUploadModal from "./BulkUploadModal";
import NewAlertSetupModal from "./NewAlertSetupModal";
import GoogleSheetsImportModal from "./GoogleSheetsImportModal";
import CSVImportModal from "./CSVImportModal";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function QuickActions() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

      const csv = generateCSVReport(data);
      downloadCSV(csv, 'ai-ranking-report.csv');
      
      toast({
        title: "Report Generated",
        description: "Your tracking report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  const generateCSVReport = (data: any[]) => {
    const headers = ['Keyword', 'Brand', 'Platform', 'Mentioned', 'Position', 'Mentions', 'Competitors', 'Date'];
    const rows = data.map(result => [
      result.keyword?.keyword || '',
      result.brand?.name || '',
      result.aiPlatform,
      result.mentioned ? 'Yes' : 'No',
      result.position || 'N/A',
      result.mentionCount,
      result.competitorsMentioned?.join('; ') || '',
      new Date(result.trackedAt).toLocaleDateString()
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const actions = [
    {
      icon: Plus,
      label: "Add New Keywords",
      onClick: () => setShowAddModal(true),
    },
    {
      icon: Upload,
      label: "Import CSV File",
      onClick: () => setShowCSVModal(true),
    },
    {
      icon: FileSpreadsheet,
      label: "Import from Sheets",
      onClick: () => setShowSheetsModal(true),
    },
    {
      icon: FileText,
      label: "Generate Report", 
      onClick: generateReport,
    },
    {
      icon: Bell,
      label: "Setup Alerts",
      onClick: () => setShowAlertModal(true),
    },
    {
      icon: BarChart3,
      label: "View Analytics",
      onClick: () => setLocation("/analytics"),
    },
    {
      icon: Tag,
      label: "Keywords Library",
      onClick: () => setLocation("/keywords"),
    },
  ];

  return (
    <>
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

      <AddKeywordModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
      
      <BulkUploadModal 
        isOpen={showBulkModal} 
        onClose={() => setShowBulkModal(false)} 
      />

      <NewAlertSetupModal 
        isOpen={showAlertModal} 
        onClose={() => setShowAlertModal(false)} 
      />

      <CSVImportModal 
        isOpen={showCSVModal} 
        onClose={() => setShowCSVModal(false)}
        onImportComplete={() => {
          // Refresh keywords data
          queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
          queryClient.invalidateQueries({ queryKey: ['/api/tracking-results/latest'] });
        }}
      />

      <GoogleSheetsImportModal 
        isOpen={showSheetsModal} 
        onClose={() => setShowSheetsModal(false)}
        onImportComplete={() => {
          // Refresh keywords data
          queryClient.invalidateQueries({ queryKey: ['/api/keywords'] });
          queryClient.invalidateQueries({ queryKey: ['/api/tracking-results/latest'] });
        }}
      />
    </>
  );
}
