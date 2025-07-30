import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Key, DollarSign, CheckCircle, XCircle, Info } from "lucide-react";

export default function APIUsageIndicator() {
  const [showDialog, setShowDialog] = useState(false);

  const { data: usageData } = useQuery({
    queryKey: ["/api/usage/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getKeyStatusIcon = (status: string) => {
    return status === 'Available' ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getKeyStatusColor = (status: string) => {
    return status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          <Key className="w-4 h-4" />
          <span className="text-xs">API Status</span>
          <Info className="w-3 h-3 text-gray-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>API Usage & Data Sources</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* API Key Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>API Key Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {usageData?.apiKeys && Object.entries(usageData.apiKeys).map(([platform, status]) => (
                  <div key={platform} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getKeyStatusIcon(status as string)}
                      <span className="font-medium capitalize">{platform}</span>
                    </div>
                    <Badge className={`text-xs ${getKeyStatusColor(status as string)}`}>
                      {status as string}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Sources Explained</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usageData?.dataSource && Object.entries(usageData.dataSource).map(([platform, source]) => (
                  <div key={platform} className="p-3 border rounded-lg">
                    <div className="font-medium capitalize text-gray-900 mb-1">{platform}</div>
                    <div className="text-sm text-gray-600">{source as string}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          {usageData?.usage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Current Session Usage</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{usageData.usage.totalCalls}</div>
                    <div className="text-sm text-gray-600">Total API Calls</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{usageData.usage.successfulCalls}</div>
                    <div className="text-sm text-gray-600">Successful Calls</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{usageData.usage.totalTokens}</div>
                    <div className="text-sm text-gray-600">Tokens Used</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">${usageData.usage.estimatedCost?.toFixed(4) || '0.0000'}</div>
                    <div className="text-sm text-gray-600">Estimated Cost</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transparency Note */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Complete Transparency</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Your OpenAI API Key:</strong> Used only for ChatGPT responses and analysis</p>
              <p>• <strong>Other Platforms:</strong> Currently showing simulated responses (need respective API keys)</p>
              <p>• <strong>Data Analysis:</strong> All position and mention data comes from OpenAI GPT-4o analysis</p>
              <p>• <strong>Cost Tracking:</strong> Real-time token usage and cost estimation</p>
              <p>• <strong>No Hidden Charges:</strong> You only pay for what your API key is used for</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}