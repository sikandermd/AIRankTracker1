import { useState } from "react";
import { Plus, FileText, Bell, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddKeywordModal from "./AddKeywordModal";
import BulkUploadModal from "./BulkUploadModal";
import { useToast } from "@/hooks/use-toast";

export default function QuickActions() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
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
      icon: FileText,
      label: "Generate Report", 
      onClick: generateReport,
    },
    {
      icon: Bell,
      label: "Setup Alerts",
      onClick: () => toast({
        title: "Coming Soon",
        description: "Alert setup functionality will be available soon",
      }),
    },
    {
      icon: BarChart3,
      label: "View Analytics",
      onClick: () => toast({
        title: "Coming Soon", 
        description: "Advanced analytics dashboard will be available soon",
      }),
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
    </>
  );
}
