import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Upload, Download, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkUploadModal({ isOpen, onClose }: BulkUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBrand, setSelectedBrand] = useState("");
  const { toast } = useToast();

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !selectedBrand) {
        throw new Error("Please select a file and brand");
      }

      const text = await selectedFile.text();
      const keywords = text.split('\n').map(line => line.trim()).filter(line => line);

      return apiRequest("POST", "/api/keywords/track", {
        keywords,
        brandId: selectedBrand,
        platforms: ['gpt', 'claude', 'gemini', 'perplexity'],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tracking-results/latest"] });
      toast({
        title: "Keywords Uploaded",
        description: "Your keywords have been uploaded and tracking has started",
      });
      setSelectedFile(null);
      setSelectedBrand("");
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload keywords",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'text/plain' || file.name.endsWith('.txt'))) {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a .txt file",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const template = `best CDP tools
customer data platform
marketing automation
customer engagement platform
analytics tools
data activation platform`;
    
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keywords-template.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Bulk Upload Keywords
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              Upload a .txt file with one keyword per line
            </p>
            
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="mb-4"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Brand
              </label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Brand" />
                </SelectTrigger>
                <SelectContent>
                  {(brands as any)?.map((brand: any) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : "Click to upload .txt file"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || !selectedBrand || uploadMutation.isPending}
              className="bg-primary hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadMutation.isPending ? "Uploading..." : "Upload & Track"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}