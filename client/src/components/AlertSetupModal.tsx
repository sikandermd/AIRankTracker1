import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Mail, Plus, Trash2, ChevronDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const alertSetupSchema = z.object({
  name: z.string().min(1, "Alert name is required"),
  selectedBrand: z.string().min(1, "Please select a brand"),
  keyword: z.string().min(1, "Please enter a keyword"),
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

interface AlertSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AlertSetupModal({ isOpen, onClose }: AlertSetupModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ["/api/brands"],
    enabled: isOpen,
  });

  const form = useForm<z.infer<typeof alertSetupSchema>>({
    resolver: zodResolver(alertSetupSchema),
    defaultValues: {
      name: "",
      selectedBrand: "",
      keyword: "",
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
    mutationFn: (data: any) => apiRequest("/api/alerts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert Created",
        description: "Your brand alert has been set up successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create alert",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof alertSetupSchema>) => {
    console.log("Creating alert:", data);
    
    // Convert form data to API format
    const alertData = {
      name: data.name,
      brandId: data.selectedBrand,
      keyword: data.keyword,
      platforms: Object.keys(data.platforms).filter(platform => data.platforms[platform as keyof typeof data.platforms]),
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
    
    createAlertMutation.mutate(alertData);
  };



  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Create Brand Alert
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Set up automated notifications for brand visibility changes
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
                  <FormLabel>Alert Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Acme Corp - AI Tools" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Brand Selection */}
            <FormField
              control={form.control}
              name="selectedBrand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(brands as any[]).map((brand: any) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Keyword Input */}
            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keyword</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter keyword to monitor" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* AI Platforms */}
            <div className="space-y-3">
              <FormLabel>AI Platforms to Monitor</FormLabel>
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
              <FormLabel>Trigger Conditions</FormLabel>
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
              <FormLabel>Notification Methods</FormLabel>
              
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
                      <Input {...field} placeholder="your@email.com" type="email" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discordWebhook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discord Webhook URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://discord.com/api/webhooks/..." />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#FB9A4E] hover:bg-[#e8894a]"
                disabled={createAlertMutation.isPending}
              >
                {createAlertMutation.isPending ? "Creating..." : "Create Alert"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}