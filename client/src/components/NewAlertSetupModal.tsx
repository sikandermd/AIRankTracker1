import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Mail, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const alertSetupSchema = z.object({
  name: z.string().min(1, "Alert name is required"),
  selectedBrands: z.array(z.string()).min(1, "At least one brand must be selected"),
  customKeywords: z.array(z.string()).min(1, "At least one keyword must be added"),
  platforms: z.object({
    chatgpt: z.boolean().default(false),
    claude: z.boolean().default(false),
    gemini: z.boolean().default(false),
    perplexity: z.boolean().default(false),
  }),
  triggerConditions: z.object({
    newMentions: z.boolean().default(false),
    positionImprove: z.boolean().default(false),
    newPlatform: z.boolean().default(false),
    mentionIncrease: z.boolean().default(false),
  }),
  email: z.string().email("Please enter a valid email"),
  discordWebhook: z.string().url().optional().or(z.literal("")),
});

interface NewAlertSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewAlertSetupModal({ isOpen, onClose }: NewAlertSetupModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newKeyword, setNewKeyword] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [customBrands, setCustomBrands] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ["/api/brands"],
    enabled: isOpen,
  });

  const form = useForm<z.infer<typeof alertSetupSchema>>({
    resolver: zodResolver(alertSetupSchema),
    defaultValues: {
      name: "",
      selectedBrands: [],
      customKeywords: [],
      platforms: {
        chatgpt: false,
        claude: false,
        gemini: false,
        perplexity: false,
      },
      triggerConditions: {
        newMentions: false,
        positionImprove: false,
        newPlatform: false,
        mentionIncrease: false,
      },
      email: "",
      discordWebhook: "",
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/alerts/multi", data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alerts Created Successfully",
        description: response.message || `Successfully created ${response.count || 1} alerts`,
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      console.error("Alert creation error:", error);
      toast({
        title: "Error Creating Alerts",
        description: error.message || "Failed to create multi-brand alerts. Please check your selections.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof alertSetupSchema>) => {
    console.log("Creating multi-brand alert:", data);
    
    // Validate that at least one brand and keyword are selected
    if (!data.selectedBrands || data.selectedBrands.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one brand",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.customKeywords || data.customKeywords.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please add at least one keyword",
        variant: "destructive",
      });
      return;
    }
    
    const selectedPlatforms = Object.keys(data.platforms).filter(platform => data.platforms[platform as keyof typeof data.platforms]);
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one AI platform to monitor",
        variant: "destructive",
      });
      return;
    }
    
    // Convert form data to API format
    // Include custom brand names for brands that need to be created
    const customBrandData = data.selectedBrands
      .filter(id => id.startsWith('custom-'))
      .map(id => {
        const brand = customBrands.find(b => b.id === id);
        return brand ? { id: brand.id, name: brand.name } : null;
      })
      .filter(Boolean);

    const alertData = {
      name: data.name,
      selectedBrands: data.selectedBrands,
      customBrands: customBrandData,
      customKeywords: data.customKeywords,
      platforms: selectedPlatforms,
      triggerConditions: {
        mention_change: data.triggerConditions.newMentions,
        position_improve: data.triggerConditions.positionImprove,
        new_platform: data.triggerConditions.newPlatform,
        mention_increase: data.triggerConditions.mentionIncrease,
      },
      notificationMethods: {
        email: data.email,
        discordWebhook: data.discordWebhook || null,
      },
      isActive: true,
    };
    
    console.log("Submitting alert data:", alertData);
    createAlertMutation.mutate(alertData);
  };

  const addCustomKeyword = () => {
    if (newKeyword.trim()) {
      const currentKeywords = form.getValues("customKeywords") || [];
      form.setValue("customKeywords", [...currentKeywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeCustomKeyword = (index: number) => {
    const currentKeywords = form.getValues("customKeywords") || [];
    form.setValue("customKeywords", currentKeywords.filter((_, i) => i !== index));
  };

  const addCustomBrand = () => {
    if (newBrandName.trim()) {
      const brandId = `custom-${Date.now()}`;
      setCustomBrands([...customBrands, { id: brandId, name: newBrandName.trim() }]);
      setNewBrandName("");
    }
  };

  const removeCustomBrand = (brandId: string) => {
    setCustomBrands(customBrands.filter(brand => brand.id !== brandId));
    // Also remove from selection if selected
    const currentSelection = form.getValues("selectedBrands") || [];
    form.setValue("selectedBrands", currentSelection.filter(id => id !== brandId));
  };

  // Combine predefined and custom brands
  const allBrands = [...(brands as any[]), ...customBrands];

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold text-gray-900">
              🚀 Multi-Brand Alert Setup (NEW)
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-green-600 mt-2 font-medium">
            ✅ Select multiple brands and add multiple keywords for comprehensive monitoring
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            {/* Alert Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Alert Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Multi-Brand AI Monitoring" className="text-base" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Multi-Brand Selection */}
            <div className="space-y-3 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <FormLabel className="text-base font-semibold text-blue-800">
                📋 Brands (Select Multiple)
              </FormLabel>
              
              {/* Add Custom Brand Input */}
              <div className="flex space-x-2 mb-3">
                <Input
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Add custom brand name"
                  className="text-base bg-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomBrand();
                    }
                  }}
                  data-testid="input-custom-brand"
                />
                <Button 
                  type="button" 
                  onClick={addCustomBrand} 
                  size="sm" 
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  data-testid="button-add-custom-brand"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {allBrands.map((brand: any) => {
                  const isCustomBrand = brand.id.startsWith('custom-');
                  return (
                    <FormField
                      key={brand.id}
                      control={form.control}
                      name="selectedBrands"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 p-2 bg-white rounded border">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(brand.id)}
                              onCheckedChange={(checked) => {
                                const currentSelection = field.value || [];
                                if (checked) {
                                  field.onChange([...currentSelection, brand.id]);
                                } else {
                                  field.onChange(currentSelection.filter((id: string) => id !== brand.id));
                                }
                              }}
                              data-testid={`checkbox-brand-${brand.id}`}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium cursor-pointer flex-1">
                            {brand.name}
                            {isCustomBrand && <span className="ml-1 text-xs text-blue-600">(Custom)</span>}
                          </FormLabel>
                          {isCustomBrand && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomBrand(brand.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                              data-testid={`button-remove-custom-brand-${brand.id}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>
              <div className="text-sm text-blue-700 font-medium">
                Selected: {form.watch("selectedBrands")?.length || 0} brand(s)
              </div>
            </div>

            {/* Multi-Keyword Addition */}
            <div className="space-y-3 p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
              <FormLabel className="text-base font-semibold text-orange-800">
                🔍 Keywords (Add Multiple)
              </FormLabel>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Enter keyword and press Enter or click +"
                    className="text-base"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomKeyword();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={addCustomKeyword} 
                    size="sm" 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Display added keywords */}
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {(form.watch("customKeywords") || []).map((keyword, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-white border border-orange-300 p-3 rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-800">{keyword}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomKeyword(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="text-sm text-orange-700 font-medium">
                  Added: {form.watch("customKeywords")?.length || 0} keyword(s)
                </div>
              </div>
            </div>

            {/* AI Platforms */}
            <div className="space-y-3">
              <FormLabel className="text-base font-semibold">🤖 AI Platforms to Monitor</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="platforms.chatgpt"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">ChatGPT</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="platforms.claude"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Claude</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="platforms.gemini"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Gemini</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="platforms.perplexity"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Perplexity</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Trigger Conditions */}
            <div className="space-y-3">
              <FormLabel className="text-base font-semibold">⚡ Trigger Conditions</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="triggerConditions.newMentions"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">New Mentions</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="triggerConditions.positionImprove"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Position Improve</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="triggerConditions.newPlatform"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">New Platform</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="triggerConditions.mentionIncrease"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Mention Increase</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notification Methods */}
            <div className="space-y-3">
              <FormLabel className="text-base font-semibold">📧 Notification Methods</FormLabel>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="your@email.com" type="email" className="text-base" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discordWebhook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discord Webhook URL (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://discord.com/api/webhooks/..." className="text-base" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose} size="lg">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={createAlertMutation.isPending}
                size="lg"
              >
                {createAlertMutation.isPending ? "Creating..." : "🚀 Create Multi-Brand Alert"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}