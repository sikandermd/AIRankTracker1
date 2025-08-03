import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, TrendingUp, TrendingDown, Globe } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { OrganicKeyword } from "@shared/schema";

const countries = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
];

export default function OrganicKeywords() {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [domain, setDomain] = useState('');
  const [keyword, setKeyword] = useState('');
  const { toast } = useToast();

  const { data: organicKeywords, isLoading } = useQuery<OrganicKeyword[]>({
    queryKey: ['/api/organic-keywords'],
  });

  const addKeywordMutation = useMutation({
    mutationFn: async (data: { keyword: string; domain: string; country: string }) => {
      const response = await apiRequest('POST', '/api/organic-keywords', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organic-keywords'] });
      setKeyword('');
      setDomain('');
      toast({
        title: "Success",
        description: "Organic keyword added for tracking",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add organic keyword",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const domains = Array.from(new Set(organicKeywords?.map(kw => kw.domain) || []));
      const keywords = organicKeywords?.map(kw => kw.keyword) || [];
      
      const response = await apiRequest('POST', '/api/organic-keywords/sync', {
        domain: domains[0], // Use first domain for now
        keywords,
        country: selectedCountry.toLowerCase()
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/organic-keywords'] });
      toast({
        title: "Sync Complete",
        description: `Updated ${data.updated} keywords. Keywords not showing positions are not ranking in top 100.`,
      });
    },
    onError: (error: any) => {
      console.log('Sync error:', error);
      toast({
        title: "Search Console Permission Required", 
        description: "Add service account email to your Google Search Console property. See Setup Guide for instructions.",
        variant: "destructive",
      });
    },
  });

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, position }: { id: string; position: number }) => {
      const response = await apiRequest('PATCH', `/api/organic-keywords/${id}`, {
        currentPosition: position
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organic-keywords'] });
      toast({
        title: "Position Updated",
        description: "Keyword position updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update position",
        variant: "destructive",
      });
    },
  });

  const handleAddKeyword = () => {
    if (!keyword.trim() || !domain.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both keyword and domain",
        variant: "destructive",
      });
      return;
    }
    addKeywordMutation.mutate({
      keyword: keyword.trim(),
      domain: domain.trim(),
      country: selectedCountry,
    });
  };

  const getPositionBadge = (current: number | null, previous: number | null) => {
    if (!current) return <Badge variant="outline" className="text-gray-500">Not in Top 100</Badge>;
    
    const isImprovement = previous && current < previous;
    const isDecline = previous && current > previous;
    
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant={current <= 3 ? "default" : current <= 10 ? "secondary" : "outline"}
          className={`${current <= 3 ? "bg-green-600 text-white" : current <= 10 ? "bg-blue-600 text-white" : "bg-gray-600 text-white"}`}
        >
          #{current}
        </Badge>
        {isImprovement && <TrendingUp className="h-4 w-4 text-green-500" />}
        {isDecline && <TrendingDown className="h-4 w-4 text-red-500" />}
      </div>
    );
  };

  const getCountryFlag = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    return country ? country.flag : '🌍';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organic Keywords</h1>
          <p className="text-muted-foreground">Track your website's organic search rankings</p>
        </div>
        <div className="flex gap-2">
          {organicKeywords && organicKeywords.length > 0 && (
            <Button 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {syncMutation.isPending ? 'Syncing...' : 'Sync with Search Console'}
            </Button>
          )}
          <Button
            onClick={() => {
              fetch('/api/organic-keywords/auto-track', { method: 'POST' })
                .then(() => {
                  toast({
                    title: "Auto-tracking Started",
                    description: "Automatically checking positions for all keywords. This may take a few minutes.",
                  });
                })
                .catch(() => {
                  toast({
                    title: "Error",
                    description: "Failed to start automatic tracking",
                    variant: "destructive"
                  });
                });
            }}
            className="bg-[#FB9A4E] hover:bg-[#e8864a] text-white"
          >
            🤖 Auto-Check All
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              toast({
                title: "Setup Instructions",
                description: "Fix JSON format in Secrets. See SEARCH_CONSOLE_SETUP.md",
                duration: 5000,
              });
            }}
          >
            Setup Guide
          </Button>
        </div>
      </div>

      {/* Add Keyword Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Organic Keyword
          </CardTitle>
          <CardDescription>
            Add keywords to track. Manual tracking with "Set Position" buttons works immediately. Google Search Console sync may miss some rankings due to data lag.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Keyword</label>
              <Input
                placeholder="e.g., best email marketing software"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Domain</label>
              <Input
                placeholder="e.g., yourwebsite.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div className="w-48">
              <label className="text-sm font-medium">Country</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAddKeyword}
              disabled={addKeywordMutation.isPending}
              className="bg-[#FB9A4E] hover:bg-[#e8864a]"
            >
              {addKeywordMutation.isPending ? 'Adding...' : 'Track Keyword'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keywords List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Tracked Keywords
          </CardTitle>
          <CardDescription>
            {organicKeywords?.length || 0} keywords being monitored
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading keywords...</p>
            </div>
          ) : !organicKeywords?.length ? (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Keywords Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first organic keyword to start tracking rankings
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {organicKeywords.map((kw) => (
                <div key={kw.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg">{kw.keyword}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCountryFlag(kw.country)}</span>
                          <Badge variant="outline" className="text-xs">
                            {countries.find(c => c.code === kw.country)?.name || kw.country}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="text-xs bg-blue-50">
                          {kw.domain}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">Search Engine:</span> 
                          <span className="capitalize">{kw.searchEngine}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">Status:</span>
                          {!kw.currentPosition ? (
                            <span className="text-red-600">Not ranking in top 100</span>
                          ) : (
                            <span className="text-green-600">Ranking at position #{kw.currentPosition}</span>  
                          )}
                        </div>
                        {kw.searchVolume && kw.searchVolume > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">Volume:</span>
                            <span>{kw.searchVolume.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">Updated:</span>
                          <span>{new Date(kw.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Current Position</div>
                        {getPositionBadge(kw.currentPosition, kw.previousPosition)}
                      </div>
                      {kw.previousPosition && (
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground mb-1">Previous</div>
                          <Badge variant="outline">#{kw.previousPosition}</Badge>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant={!kw.currentPosition ? "default" : "outline"}
                        className={!kw.currentPosition ? "bg-[#FB9A4E] hover:bg-[#e8864a] text-white" : ""}
                        disabled={updatePositionMutation.isPending}
                        onClick={() => {
                          const position = prompt(`Enter current position for "${kw.keyword}" (1-100):`);
                          if (position && !isNaN(Number(position)) && Number(position) >= 1 && Number(position) <= 100) {
                            updatePositionMutation.mutate({
                              id: kw.id,
                              position: Number(position)
                            });
                          } else if (position) {
                            toast({
                              title: "Invalid Position",
                              description: "Please enter a number between 1 and 100",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        {updatePositionMutation.isPending ? "Updating..." : (!kw.currentPosition ? "Set Position" : "Update")}
                      </Button>
                    </div>
                  </div>
                  {kw.url && kw.url.trim() && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Landing Page:</span>
                        <a href={kw.url.startsWith('http') ? kw.url : `https://${kw.url}`} 
                           target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-blue-600 hover:underline">
                          {kw.url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Ranking Details */}
                  {kw.currentPosition && (
                    <div className="mt-3 pt-3 border-t bg-green-50 p-3 rounded">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-700">Current Ranking:</span>
                          <span className="font-bold text-green-800">Position #{kw.currentPosition}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-700">Country:</span>
                          <span>{getCountryFlag(kw.country)} {countries.find(c => c.code === kw.country)?.name || kw.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-700">Domain:</span>
                          <span>{kw.domain}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}