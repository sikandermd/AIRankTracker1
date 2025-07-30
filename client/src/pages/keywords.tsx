import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Filter, Tag, Building, Calendar, Trash2, Edit, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AddKeywordModal from "@/components/AddKeywordModal";
import { useToast } from "@/hooks/use-toast";

interface Keyword {
  id: string;
  keyword: string;
  category?: string;
  brandId: string;
  brand?: { name: string; slug: string };
  createdAt: string;
  trackGpt?: boolean;
  trackClaude?: boolean;
  trackGemini?: boolean;
  trackPerplexity?: boolean;
}

export default function KeywordsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
  const { toast } = useToast();

  // Fetch keywords
  const { data: keywords = [], isLoading: keywordsLoading, refetch: refetchKeywords } = useQuery({
    queryKey: ['/api/keywords'],
  });

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ['/api/brands'],
  });

  // Filter keywords
  const filteredKeywords = keywords.filter((keyword: Keyword) => {
    const matchesSearch = keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === "all" || keyword.brandId === selectedBrand;
    const matchesCategory = selectedCategory === "all" || keyword.category === selectedCategory;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(keywords.map((k: Keyword) => k.category).filter(Boolean))];

  const getPlatformBadges = (keyword: Keyword) => {
    const platforms = [];
    if (keyword.trackGpt) platforms.push("GPT");
    if (keyword.trackClaude) platforms.push("Claude");
    if (keyword.trackGemini) platforms.push("Gemini");
    if (keyword.trackPerplexity) platforms.push("Perplexity");
    return platforms.length > 0 ? platforms : ["All"];
  };

  const deleteKeyword = async (keywordId: string) => {
    try {
      const response = await fetch(`/api/keywords/${keywordId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Keyword Deleted",
          description: "Keyword has been removed successfully",
        });
        refetchKeywords();
      } else {
        throw new Error('Failed to delete keyword');
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete the keyword",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Keywords Library</h1>
          <p className="text-gray-600 mt-2">Manage and organize all your tracked keywords</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Keyword
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Keywords</p>
                <p className="text-2xl font-bold text-gray-900">{keywords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Brands</p>
                <p className="text-2xl font-bold text-gray-900">{brands.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Search className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Filtered</p>
                <p className="text-2xl font-bold text-gray-900">{filteredKeywords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand: any) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedBrand("all");
                setSelectedCategory("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keywords List */}
      <Card>
        <CardHeader>
          <CardTitle>Keywords ({filteredKeywords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {keywordsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-600">Loading keywords...</p>
            </div>
          ) : filteredKeywords.length === 0 ? (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No keywords found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedBrand !== "all" || selectedCategory !== "all" 
                  ? "Try adjusting your filters" 
                  : "Get started by adding your first keyword"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredKeywords.map((keyword: Keyword) => (
                <div
                  key={keyword.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {keyword.keyword}
                        </h3>
                        {keyword.category && (
                          <Badge variant="secondary">{keyword.category}</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          {keyword.brand?.name || 'Unknown Brand'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(keyword.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-sm text-gray-600">Platforms:</span>
                        {getPlatformBadges(keyword).map((platform, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedKeyword(keyword)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Keyword Details</DialogTitle>
                          </DialogHeader>
                          {selectedKeyword && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Keyword</label>
                                <p className="text-lg">{selectedKeyword.keyword}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Category</label>
                                <p>{selectedKeyword.category || 'No category'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Brand</label>
                                <p>{selectedKeyword.brand?.name || 'Unknown'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Tracking Platforms</label>
                                <div className="flex space-x-2 mt-1">
                                  {getPlatformBadges(selectedKeyword).map((platform, index) => (
                                    <Badge key={index} variant="outline">{platform}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Created</label>
                                <p>{formatDate(selectedKeyword.createdAt)}</p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteKeyword(keyword.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Keyword Modal */}
      <AddKeywordModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onKeywordAdded={() => {
          refetchKeywords();
          setShowAddModal(false);
        }}
      />
    </div>
  );
}