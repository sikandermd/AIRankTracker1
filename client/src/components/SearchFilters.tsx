import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PlatformIcon, getPlatformName, getPlatformColor } from "./PlatformIcons";
import DataSourceWarning from "./DataSourceWarning";
import QueryWarning from "./QueryWarning";
import type { SearchFilters as SearchFiltersType } from "@/lib/types";

const searchSchema = z.object({
  keywords: z.string().min(1, "Please enter at least one keyword"),
  brandIds: z.array(z.string()).min(1, "Please select at least one brand"),
  platforms: z.array(z.string()).min(1, "Please select at least one platform"),
  dateRange: z.string(),
});

interface SearchFiltersProps {
  onSearch: (filters: SearchFiltersType) => void;
  isSearching?: boolean;
}

const AI_PLATFORMS = [
  { id: 'gpt', name: 'ChatGPT' },
  { id: 'claude', name: 'Claude' },
  { id: 'gemini', name: 'Gemini' },
  { id: 'perplexity', name: 'Perplexity' },
];

export default function SearchFilters({ onSearch, isSearching = false }: SearchFiltersProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
  });

  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      keywords: "",
      brandIds: [],
      platforms: [],
      dateRange: "7",
    },
  });

  const onSubmit = async (data: z.infer<typeof searchSchema>) => {
    try {
      const keywords = data.keywords.split(',').map(k => k.trim()).filter(k => k);
      
      // Track keywords for each selected brand
      for (const brandId of data.brandIds) {
        await apiRequest("POST", "/api/keywords/track", {
          keywords,
          brandId: brandId,
          platforms: data.platforms,
        });
      }

      // Prepare search filters for parent component with multiple brands
      const searchFilters: SearchFiltersType = {
        keywords,
        brandId: data.brandIds[0] || "",
        brandIds: data.brandIds,
        platforms: data.platforms,
        dateRange: data.dateRange,
      };

      onSearch(searchFilters);
      
      toast({
        title: "Search Started",
        description: `Tracking ${keywords.length} keywords for ${data.brandIds.length} brands across ${data.platforms.length} platforms`,
      });
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Failed to start keyword tracking",
        variant: "destructive",
      });
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    const newPlatforms = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter(p => p !== platformId)
      : [...selectedPlatforms, platformId];
    
    setSelectedPlatforms(newPlatforms);
    form.setValue('platforms', newPlatforms);
  };

  const removePlatform = (platformId: string) => {
    const newPlatforms = selectedPlatforms.filter(p => p !== platformId);
    setSelectedPlatforms(newPlatforms);
    form.setValue('platforms', newPlatforms);
  };

  const handleBrandToggle = (brandId: string) => {
    const newBrands = selectedBrands.includes(brandId)
      ? selectedBrands.filter(b => b !== brandId)
      : [...selectedBrands, brandId];
    
    setSelectedBrands(newBrands);
    form.setValue('brandIds', newBrands);
  };

  const clearFilters = () => {
    form.reset();
    setSelectedPlatforms([]);
    setSelectedBrands([]);
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Search & Track Brand Visibility
          </h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Search Bar */}
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          placeholder="Enter keywords (e.g., best CDP tools, customer data platform)"
                          className="pl-10 h-12"
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Brand Selection */}
                <div>
                  <FormLabel className="text-sm font-medium text-gray-700 mb-3 block">Brands</FormLabel>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {brands?.map((brand: any) => (
                      <div key={brand.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`brand-${brand.id}`}
                          checked={selectedBrands.includes(brand.id)}
                          onCheckedChange={() => handleBrandToggle(brand.id)}
                        />
                        <label
                          htmlFor={`brand-${brand.id}`}
                          className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
                        >
                          {brand.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedBrands.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedBrands.map((brandId) => {
                        const brand = brands?.find((b: any) => b.id === brandId);
                        return (
                          <Badge key={brandId} variant="secondary" className="text-xs">
                            {brand?.name}
                            <button
                              type="button"
                              onClick={() => handleBrandToggle(brandId)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* AI Platforms */}
                <FormField
                  control={form.control}
                  name="platforms"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        AI Platforms
                      </FormLabel>
                      <div className="space-y-2">
                        {AI_PLATFORMS.map((platform) => (
                          <FormField
                            key={platform.id}
                            control={form.control}
                            name="platforms"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={selectedPlatforms.includes(platform.id)}
                                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer flex items-center space-x-2">
                                  <PlatformIcon platform={platform.id} className="w-4 h-4" />
                                  <span>{getPlatformName(platform.id)}</span>
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                {/* Date Range */}
                <FormField
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Date Range
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="7">Last 7 days</SelectItem>
                          <SelectItem value="30">Last 30 days</SelectItem>
                          <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* Query Information */}
              {form.getValues('keywords') && form.getValues('keywords').trim() && (
                <QueryWarning keyword={form.getValues('keywords')} />
              )}

              {/* Data Source Warning */}
              <DataSourceWarning platforms={selectedPlatforms} />

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-blue-700"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Tracking...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search & Track
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      // Access parent's bulk upload modal
                      const event = new CustomEvent('openBulkUpload');
                      window.dispatchEvent(event);
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Upload
                  </Button>
                </div>
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Selected Platform Chips */}
        {selectedPlatforms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedPlatforms.map((platformId) => {
              return (
                <Badge key={platformId} variant="secondary" className={`${getPlatformColor(platformId)} flex items-center gap-2`}>
                  <PlatformIcon platform={platformId} className="w-3 h-3" />
                  <span>{getPlatformName(platformId)}</span>
                  <button
                    onClick={() => removePlatform(platformId)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
