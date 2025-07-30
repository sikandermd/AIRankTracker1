import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Mail, MessageSquare, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const alertSetupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  discordWebhook: z.string().url("Please enter a valid Discord webhook URL").optional().or(z.literal("")),
  alertTypes: z.object({
    rankingChange: z.boolean().default(true),
    newMention: z.boolean().default(true),
    competitorAlert: z.boolean().default(false),
    weeklyReport: z.boolean().default(true),
  }),
  frequency: z.enum(["immediate", "daily", "weekly"]).default("daily"),
});

interface AlertSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AlertSetupModal({ isOpen, onClose }: AlertSetupModalProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof alertSetupSchema>>({
    resolver: zodResolver(alertSetupSchema),
    defaultValues: {
      email: "",
      discordWebhook: "",
      alertTypes: {
        rankingChange: true,
        newMention: true,
        competitorAlert: false,
        weeklyReport: true,
      },
      frequency: "daily",
    },
  });

  const onSubmit = (data: z.infer<typeof alertSetupSchema>) => {
    console.log("Alert setup:", data);
    
    toast({
      title: "Alerts Configured",
      description: "Your alert preferences have been saved successfully",
    });
    
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Setup Alerts
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Bell className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <p className="text-sm text-gray-600">
                  Get notified about ranking changes, new mentions, and competitor activities
                </p>
              </div>

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
                    <FormLabel className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Discord Webhook (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://discord.com/api/webhooks/..." />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Summary</SelectItem>
                        <SelectItem value="weekly">Weekly Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Alert Types</FormLabel>
                
                <FormField
                  control={form.control}
                  name="alertTypes.rankingChange"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Ranking Changes (position up/down)
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alertTypes.newMention"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        New Brand Mentions
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alertTypes.competitorAlert"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Competitor Activity
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alertTypes.weeklyReport"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Weekly Summary Report
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-blue-700"
              >
                <Bell className="w-4 h-4 mr-2" />
                Save Alerts
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}