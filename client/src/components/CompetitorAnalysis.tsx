import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CompetitorAnalysis() {
  const { data: competitorData } = useQuery({
    queryKey: ["/api/competitor-analysis"],
  });

  // Mock data for demonstration since we don't have real competitor data yet
  const mockCompetitors = [
    {
      name: "Segment",
      mentions: 12,
      visibility: 85,
      change: 12,
      initial: "S",
      color: "bg-red-100 text-red-600",
    },
    {
      name: "Mixpanel", 
      mentions: 8,
      visibility: 72,
      change: -3,
      initial: "M",
      color: "bg-purple-100 text-purple-600",
    },
    {
      name: "Amplitude",
      mentions: 6,
      visibility: 68,
      change: 0,
      initial: "A", 
      color: "bg-green-100 text-green-600",
    },
    {
      name: "HubSpot",
      mentions: 4,
      visibility: 45,
      change: 8,
      initial: "H",
      color: "bg-orange-100 text-orange-600",
    },
  ];

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-3 h-3 mr-1 text-red-600" />;
    } else if (change < 0) {
      return <TrendingDown className="w-3 h-3 mr-1 text-green-600" />;
    } else {
      return <Minus className="w-3 h-3 mr-1 text-gray-500" />;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-red-600";
    if (change < 0) return "text-green-600";
    return "text-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Competitor Analysis</h3>
        <p className="text-sm text-gray-500 mt-1">Who's ranking instead</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {mockCompetitors.map((competitor, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 ${competitor.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-xs font-medium">{competitor.initial}</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{competitor.name}</p>
                  <p className="text-xs text-gray-500">{competitor.mentions} mentions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{competitor.visibility}%</p>
                <p className={`text-xs ${getChangeColor(competitor.change)} flex items-center`}>
                  {getChangeIcon(competitor.change)}
                  {competitor.change > 0 ? '+' : ''}{competitor.change}%
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <Button 
          variant="ghost" 
          className="w-full mt-4 text-sm text-primary hover:text-blue-700 font-medium"
        >
          View Full Analysis 
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
