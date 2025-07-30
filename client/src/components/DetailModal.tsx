import { useQuery } from "@tanstack/react-query";
import { X, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X as XIcon } from "lucide-react";

interface DetailModalProps {
  keywordId: string;
  onClose: () => void;
}

export default function DetailModal({ keywordId, onClose }: DetailModalProps) {
  const { data: keywordAnalysis, isLoading } = useQuery({
    queryKey: ["/api/keywords", keywordId, "analysis"],
    enabled: !!keywordId,
  });

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading keyword analysis...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!keywordAnalysis) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Keyword analysis not found</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { keyword, brand, trackingResults } = keywordAnalysis as any;

  const getPlatformIcon = (platform: string) => {
    const icons = {
      gpt: "🤖",
      claude: "🧠", 
      gemini: "💎",
      perplexity: "🔍",
    };
    return icons[platform as keyof typeof icons] || "🤖";
  };

  const getStatusBadge = (mentioned: boolean) => {
    return mentioned ? (
      <Badge className="bg-green-100 text-green-800">
        <Check className="w-3 h-3 mr-1" />
        Mentioned
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XIcon className="w-3 h-3 mr-1" />
        Not Mentioned
      </Badge>
    );
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Keyword Detail: "{keyword?.keyword}"
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Platform Results */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Platform Results</h4>
            <div className="space-y-4">
              {trackingResults?.map((result: any) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="mr-2">{getPlatformIcon(result.aiPlatform)}</span>
                      <span className="font-medium capitalize">{result.aiPlatform}</span>
                    </div>
                    {getStatusBadge(result.mentioned)}
                  </div>
                  
                  {result.mentioned && (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        Position: {result.position} ({result.mentionCount} mentions)
                      </p>
                      {result.responseText && (
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {result.responseText.substring(0, 200)}...
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {!result.mentioned && result.competitorsMentioned?.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Competitors mentioned instead: {result.competitorsMentioned.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Historical Data */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Historical Performance</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">7 days ago</span>
                  <span className="text-sm font-medium text-green-600">↑ Improved</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">14 days ago</span>
                  <span className="text-sm font-medium text-gray-600">→ No change</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">30 days ago</span>
                  <span className="text-sm font-medium text-red-600">↓ Dropped</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
