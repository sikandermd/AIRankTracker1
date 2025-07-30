import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Eye, MessageSquare, TrendingUp, Users, Hash } from "lucide-react";
import { PlatformIcon } from "./PlatformIcons";

interface ResponsePreviewProps {
  result: {
    keyword: string;
    brand: string;
    platform: string;
    mentioned: boolean;
    position: 'top' | 'middle' | 'bottom' | null;
    mentionCount: number;
    competitors: string[];
    confidence: number;
    responseText?: string;
  };
}

export default function ResponsePreview({ result }: ResponsePreviewProps) {
  const [showDialog, setShowDialog] = useState(false);

  const getPositionColor = (position: string | null) => {
    switch (position) {
      case 'top': return 'bg-green-100 text-green-800';
      case 'middle': return 'bg-yellow-100 text-yellow-800';
      case 'bottom': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionText = (position: string | null) => {
    switch (position) {
      case 'top': return 'Top Position';
      case 'middle': return 'Middle Position';
      case 'bottom': return 'Bottom Position';
      default: return 'Not Mentioned';
    }
  };

  const highlightBrandMentions = (text: string, brand: string) => {
    if (!text || !brand) return text;
    
    const regex = new RegExp(`(${brand})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-blue-200 text-blue-900 font-semibold px-1 rounded">
          {part}
        </mark> : 
        part
    );
  };

  const highlightCompetitors = (text: string, competitors: string[]) => {
    if (!text || !competitors.length) return highlightBrandMentions(text, result.brand);
    
    let highlightedText = text;
    competitors.forEach((competitor) => {
      const regex = new RegExp(`(${competitor})`, 'gi');
      highlightedText = highlightedText.replace(regex, `<span class="bg-orange-200 text-orange-900 font-medium px-1 rounded">$1</span>`);
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-1">
          <Eye className="w-3 h-3" />
          <span className="text-xs">Preview</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <PlatformIcon platform={result.platform} className="w-5 h-5" />
            <span>AI Response Analysis for "{result.keyword}"</span>
          </DialogTitle>
          <DialogDescription>
            Complete response text and analysis breakdown for {result.brand} on {result.platform}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Analysis Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Analysis Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Brand Status</div>
                  <Badge className={result.mentioned ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {result.mentioned ? 'Mentioned' : 'Not Mentioned'}
                  </Badge>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Position</div>
                  <Badge className={getPositionColor(result.position)}>
                    {getPositionText(result.position)}
                  </Badge>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Mentions</div>
                  <div className="flex items-center justify-center space-x-1">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-bold text-blue-600">{result.mentionCount}</span>
                  </div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Competitors</div>
                  <div className="flex items-center justify-center space-x-1">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span className="text-lg font-bold text-orange-600">{result.competitors.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competitors Found */}
          {result.competitors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Competitors Mentioned</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.competitors.map((competitor, index) => (
                    <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                      {competitor}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Response Text */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Complete AI Response</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Platform:</strong> {result.platform}</div>
                  <div><strong>Query:</strong> "{result.keyword}"</div>
                  <div><strong>Analyzing for brand:</strong> {result.brand}</div>
                  <div><strong>Confidence Score:</strong> {Math.round(result.confidence * 100)}%</div>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-700 mb-3">Response Text with Highlights:</h4>
                  <div className="text-sm leading-relaxed space-y-2">
                    <div className="mb-2 text-xs text-gray-500">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 mr-2">
                        {result.brand} mentions
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-orange-100 text-orange-800">
                        Competitor mentions
                      </span>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4 bg-white p-3 rounded">
                      {result.responseText ? (
                        <div>
                          {highlightBrandMentions(
                            highlightCompetitors(result.responseText, result.competitors).toString(),
                            result.brand
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">
                          Response text not available for this result.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-700">How Analysis Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• <strong>Position:</strong> Determined by where your brand appears in the response (top/middle/bottom)</p>
                <p>• <strong>Mentions:</strong> Count of how many times your brand is explicitly mentioned</p>
                <p>• <strong>Competitors:</strong> Other brands identified in the same response</p>
                <p>• <strong>Analysis:</strong> Performed by OpenAI GPT-4o for accurate brand recognition</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}