import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Mail, MessageSquare, Bell, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Alert, Brand, Keyword } from "@shared/schema";

interface CreateAlertFormData {
  name: string;
  brandId: string;
  keywordId: string;
  platforms: string[];
  triggerConditions: {
    mentionChange: boolean;
    positionImprove: boolean;
    newPlatform: boolean;
    mentionIncrease: boolean;
  };
  notificationMethods: {
    email?: string;
    discord?: string;
  };
}

export default function AlertManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [formData, setFormData] = useState<CreateAlertFormData>({
    name: "",
    brandId: "",
    keywordId: "",
    platforms: [],
    triggerConditions: {
      mentionChange: true,
      positionImprove: true,
      newPlatform: true,
      mentionIncrease: false,
    },
    notificationMethods: {},
  });

  // Queries
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: keywords = [] } = useQuery<Keyword[]>({
    queryKey: ["/api/keywords"],
  });

  // Mutations
  const createAlertMutation = useMutation({
    mutationFn: (data: CreateAlertFormData) => apiRequest("/api/alerts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Alert Created",
        description: "Your brand monitoring alert has been set up successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create alert",
        variant: "destructive",
      });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/alerts/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert Deleted",
        description: "The alert has been removed successfully.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      brandId: "",
      keywordId: "",
      platforms: [],
      triggerConditions: {
        mentionChange: true,
        positionImprove: true,
        newPlatform: true,
        mentionIncrease: false,
      },
      notificationMethods: {},
    });
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.brandId || !formData.keywordId || formData.platforms.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select at least one platform.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.notificationMethods.email && !formData.notificationMethods.discord) {
      toast({
        title: "No Notification Method",
        description: "Please provide at least one notification method (email or Discord).",
        variant: "destructive",
      });
      return;
    }

    createAlertMutation.mutate(formData);
  };

  const getBrandName = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || "Unknown Brand";
  };

  const getKeywordText = (keywordId: string | null) => {
    if (!keywordId) return "Unknown Keyword";
    const keyword = keywords.find(k => k.id === keywordId);
    return keyword?.keyword || "Unknown Keyword";
  };

  const formatTriggerConditions = (conditions: any) => {
    const active = [];
    if (conditions.mentionChange) active.push("New Mentions");
    if (conditions.positionImprove) active.push("Position Improve");
    if (conditions.newPlatform) active.push("New Platform");
    if (conditions.mentionIncrease) active.push("Mention Increase");
    return active;
  };

  if (alertsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Alert Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Set up automated notifications when your brand visibility changes across AI platforms
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Brand Alert</DialogTitle>
              <DialogDescription>
                Set up automated notifications for brand visibility changes
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Alert Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Acme Corp - AI Tools"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Select value={formData.brandId} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, brandId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="keyword">Keyword</Label>
                <Select value={formData.keywordId} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, keywordId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select keyword" />
                  </SelectTrigger>
                  <SelectContent>
                    {keywords.map(keyword => (
                      <SelectItem key={keyword.id} value={keyword.id}>
                        "{keyword.keyword}" - {getBrandName(keyword.brandId || "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>AI Platforms to Monitor</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {["gpt", "claude", "gemini", "perplexity"].map(platform => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Switch
                        checked={formData.platforms.includes(platform)}
                        onCheckedChange={() => handlePlatformToggle(platform)}
                      />
                      <Label className="capitalize">{platform === "gpt" ? "ChatGPT" : platform}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Trigger Conditions</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.triggerConditions.mentionChange}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          triggerConditions: { ...prev.triggerConditions, mentionChange: checked }
                        }))
                      }
                    />
                    <Label>New Mentions</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.triggerConditions.positionImprove}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          triggerConditions: { ...prev.triggerConditions, positionImprove: checked }
                        }))
                      }
                    />
                    <Label>Position Improve</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.triggerConditions.newPlatform}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          triggerConditions: { ...prev.triggerConditions, newPlatform: checked }
                        }))
                      }
                    />
                    <Label>New Platform</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.triggerConditions.mentionIncrease}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          triggerConditions: { ...prev.triggerConditions, mentionIncrease: checked }
                        }))
                      }
                    />
                    <Label>Mention Increase</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label>Notification Methods</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label htmlFor="email" className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.notificationMethods.email || ""}
                      onChange={(e) => 
                        setFormData(prev => ({
                          ...prev,
                          notificationMethods: { ...prev.notificationMethods, email: e.target.value }
                        }))
                      }
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="discord" className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Discord Webhook URL
                    </Label>
                    <Input
                      id="discord"
                      value={formData.notificationMethods.discord || ""}
                      onChange={(e) => 
                        setFormData(prev => ({
                          ...prev,
                          notificationMethods: { ...prev.notificationMethods, discord: e.target.value }
                        }))
                      }
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createAlertMutation.isPending}>
                  {createAlertMutation.isPending ? "Creating..." : "Create Alert"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Alerts Set Up
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
              Create your first alert to get notified when your brand visibility changes
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Alert
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {alert.isActive ? (
                        <Bell className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-gray-400" />
                      )}
                      {alert.name}
                    </CardTitle>
                    <CardDescription>
                      Monitoring {getBrandName(alert.brandId)} for "{getKeywordText(alert.keywordId)}"
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={alert.isActive ? "default" : "secondary"}>
                      {alert.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAlertMutation.mutate(alert.id)}
                      disabled={deleteAlertMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Platforms</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {alert.platforms.map(platform => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform === "gpt" ? "ChatGPT" : platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Triggers</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formatTriggerConditions(alert.triggerConditions).map(condition => (
                        <Badge key={condition} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Notifications</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {alert.notificationMethods.email && (
                        <Badge variant="outline" className="text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Badge>
                      )}
                      {alert.notificationMethods.discord && (
                        <Badge variant="outline" className="text-xs">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Discord
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {alert.lastTriggered && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Last triggered: {new Date(alert.lastTriggered).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}