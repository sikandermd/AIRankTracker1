import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const addKeywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  brandId: z.string().min(1, "Please select a brand"),
  category: z.string().optional(),
  trackGpt: z.boolean().default(true),
  trackClaude: z.boolean().default(true),
  trackGemini: z.boolean().default(true),
  trackPerplexity: z.boolean().default(true),
});

interface AddKeywordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeywordAdded?: () => void;
}

export default function AddKeywordModal({ isOpen, onClose, onKeywordAdded }: AddKeywordModalProps) {
  const { toast } = useToast();

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
  });

  const form = useForm<z.infer<typeof addKeywordSchema>>({
    resolver: zodResolver(addKeywordSchema),
    defaultValues: {
      keyword: "",
      brandId: "",
      category: "",
      trackGpt: true,
      trackClaude: true,
      trackGemini: true,
      trackPerplexity: true,
    },
  });

  const addKeywordMutation = useMutation({
    mutationFn: (data: z.infer<typeof addKeywordSchema>) =>
      apiRequest("POST", "/api/keywords", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tracking-results/latest"] });
      toast({
        title: "Keyword Added",
        description: "Your keyword has been added successfully",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add keyword",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof addKeywordSchema>) => {
    addKeywordMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Add New Keyword
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keyword</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., best CDP tools" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(brands as any)?.map((brand: any) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., CDP Tools" />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Track on Platforms</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="trackGpt"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">🤖 ChatGPT</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trackClaude"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">🧠 Claude</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trackGemini"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">💎 Gemini</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trackPerplexity"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">🔍 Perplexity</FormLabel>
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
                disabled={addKeywordMutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {addKeywordMutation.isPending ? "Adding..." : "Add Keyword"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}