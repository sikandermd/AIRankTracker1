import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InitialSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [keywordText, setKeywordText] = useState("");
  const [step, setStep] = useState(1);
  const [createdBrandId, setCreatedBrandId] = useState("");

  const createBrandMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest("/api/brands", "POST", data),
    onSuccess: (brand) => {
      setCreatedBrandId(brand.id);
      setStep(2);
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({
        title: "Brand Created",
        description: `${brand.name} has been added successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create brand",
        variant: "destructive",
      });
    },
  });

  const createKeywordMutation = useMutation({
    mutationFn: (data: { keyword: string; brandId: string; category?: string }) => 
      apiRequest("/api/keywords", "POST", data),
    onSuccess: () => {
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      toast({
        title: "Keyword Added",
        description: "Your first keyword has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create keyword",
        variant: "destructive",
      });
    },
  });

  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    
    createBrandMutation.mutate({
      name: brandName.trim(),
      description: brandDescription.trim() || undefined,
    });
  };

  const handleCreateKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordText.trim() || !createdBrandId) return;
    
    createKeywordMutation.mutate({
      keyword: keywordText.trim(),
      brandId: createdBrandId,
      category: "General",
    });
  };

  const sampleBrands = [
    { name: "OpenAI", description: "AI research company behind ChatGPT" },
    { name: "Anthropic", description: "AI safety company behind Claude" },
    { name: "Google", description: "Tech giant with Gemini AI" },
    { name: "Microsoft", description: "Technology company with Copilot" },
    { name: "Meta", description: "Social media and VR company" },
  ];

  const createSampleBrand = (brand: { name: string; description: string }) => {
    createBrandMutation.mutate(brand);
  };

  if (step === 3) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Check className="h-6 w-6 text-green-500" />
            Setup Complete!
          </CardTitle>
          <CardDescription>
            Your AI Ranking Tracker is ready to use. You can now start monitoring your brand visibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => window.location.reload()}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to AI Ranking Tracker</CardTitle>
          <CardDescription>
            Let's get you started by creating your first brand and keyword to track.
          </CardDescription>
        </CardHeader>
      </Card>

      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Create Your Brand</CardTitle>
              <CardDescription>
                Add your company or product that you want to monitor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBrand} className="space-y-4">
                <div>
                  <Label htmlFor="brandName">Brand Name *</Label>
                  <Input
                    id="brandName"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g., Acme Corp"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="brandDescription">Description (Optional)</Label>
                  <Input
                    id="brandDescription"
                    value={brandDescription}
                    onChange={(e) => setBrandDescription(e.target.value)}
                    placeholder="Brief description of your brand"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={createBrandMutation.isPending || !brandName.trim()}
                  className="w-full"
                >
                  {createBrandMutation.isPending ? "Creating..." : "Create Brand"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Start: Use Sample Brand</CardTitle>
              <CardDescription>
                Or choose from these example brands to get started quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sampleBrands.map((brand) => (
                  <Button
                    key={brand.name}
                    variant="outline"
                    onClick={() => createSampleBrand(brand)}
                    disabled={createBrandMutation.isPending}
                    className="w-full justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {brand.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Add Your First Keyword</CardTitle>
            <CardDescription>
              Enter a search term that you want to monitor across AI platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateKeyword} className="space-y-4">
              <div>
                <Label htmlFor="keyword">Keyword or Search Term *</Label>
                <Input
                  id="keyword"
                  value={keywordText}
                  onChange={(e) => setKeywordText(e.target.value)}
                  placeholder="e.g., best project management tool"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={createKeywordMutation.isPending || !keywordText.trim()}
                className="w-full"
              >
                {createKeywordMutation.isPending ? "Adding..." : "Add Keyword"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}