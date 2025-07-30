import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CompetitorAnalysis() {
  const { data: competitorData } = useQuery({
    queryKey: ["/api/competitor-analysis"],
  });

  // Process real competitor data from API
  const processedCompetitors = competitorData ? competitorData.map((comp: any) => ({
    name: comp.competitorBrand,
    mentions: comp.mentionCount,
    visibility: comp.visibilityScore,
    change: 0, // Would be calculated from historical data
    initial: comp.competitorBrand.charAt(0),
    color: "bg-gray-100 text-gray-600",
  })) : [];

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
        {processedCompetitors.length > 0 ? (
          <div className="space-y-4">
            {processedCompetitors.map((competitor, index) => (
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
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No competitor data available.</p>
            <p className="text-xs mt-1">Start tracking keywords to see competitor analysis.</p>
          </div>
        )}
        
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
