import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Upload, CheckCircle2, AlertCircle, Info, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const csvImportSchema = z.object({
  csvFile: z.any().refine((file) => file?.length > 0, "Please select a CSV file"),
});

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export default function CSVImportModal({ 
  isOpen, 
  onClose, 
  onImportComplete 
}: CSVImportModalProps) {
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof csvImportSchema>>({
    resolver: zodResolver(csvImportSchema),
  });

  const downloadTemplate = () => {
    const csvContent = `Keyword,Category,Brand,Platforms
best cdp tools,Product,Segment,all
customer data platform,Product,Segment,gpt,claude
marketing automation,General,HubSpot,all
email marketing,General,Mailchimp,gpt,gemini`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keywords_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').slice(0, 5); // Preview first 5 rows
        const preview = lines.map(line => line.split(',').map(cell => cell.trim()));
        setCsvPreview(preview);
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 1 && values[0]) { // At least keyword is required
        data.push({
          keyword: values[0] || '',
          category: values[1] || null,
          brand: values[2] || 'Default Brand',
          platforms: values[3] || 'all'
        });
      }
    }
    return data;
  };

  const onSubmit = async (data: z.infer<typeof csvImportSchema>) => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const file = data.csvFile[0];
      const text = await file.text();
      const keywords = parseCSV(text);

      if (keywords.length === 0) {
        throw new Error('No valid keywords found in CSV file');
      }

      // Process keywords in batches
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const keywordData of keywords) {
        try {
          const response = await fetch('/api/keywords', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(keywordData),
          });

          if (response.ok) {
            imported++;
          } else {
            const errorData = await response.json();
            if (errorData.message?.includes('duplicate') || errorData.message?.includes('exists')) {
              skipped++;
            } else {
              errors.push(`${keywordData.keyword}: ${errorData.message || 'Failed to import'}`);
            }
          }
        } catch (error) {
          errors.push(`${keywordData.keyword}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const result = { imported, skipped, errors };
      setImportResult(result);
      
      if (imported > 0) {
        toast({
          title: "CSV Import Successful",
          description: `Imported ${imported} keywords${skipped > 0 ? `, skipped ${skipped}` : ''}`,
        });
        
        if (onImportComplete) {
          onImportComplete();
        }
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setImportResult(null);
    setCsvPreview([]);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Import Keywords from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with your keywords to import them in bulk
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-blue-900">Need a template?</p>
              <p className="text-xs text-blue-700">Download our CSV template to get started</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="text-blue-700 border-blue-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
          </div>

          {/* Instructions */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>CSV Format:</strong> Keyword, Category, Brand, Platforms (comma-separated)
              <br />
              <strong>Example:</strong> best cdp tools,Product,Segment,all
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="csvFile"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>CSV File</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          onChange(e.target.files);
                          handleFileChange(e);
                        }}
                        disabled={isImporting}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CSV Preview */}
              {csvPreview.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">CSV Preview:</h4>
                  <div className="text-xs font-mono text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                    {csvPreview.map((row, i) => (
                      <div key={i} className={`grid grid-cols-4 gap-2 ${i === 0 ? 'font-bold border-b pb-1' : ''}`}>
                        {row.slice(0, 4).map((cell, j) => (
                          <div key={j} className="truncate">{cell}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div className="space-y-2">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center text-blue-800">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      <span className="font-medium">Import Complete</span>
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      <div>✓ Imported: {importResult.imported} keywords</div>
                      {importResult.skipped > 0 && (
                        <div>↷ Skipped: {importResult.skipped} (duplicates)</div>
                      )}
                    </div>
                  </div>

                  {importResult.errors?.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium">Errors:</div>
                        <div className="text-sm mt-1 max-h-20 overflow-y-auto">
                          {importResult.errors.slice(0, 3).map((error: string, i: number) => (
                            <div key={i}>• {error}</div>
                          ))}
                          {importResult.errors.length > 3 && (
                            <div>... and {importResult.errors.length - 3} more</div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button 
                  type="submit" 
                  disabled={isImporting || !form.formState.isValid}
                  className="bg-primary hover:bg-blue-700"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import CSV
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}