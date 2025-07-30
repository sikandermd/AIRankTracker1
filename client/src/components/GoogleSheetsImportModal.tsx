import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

const importSchema = z.object({
  spreadsheetUrl: z.string().url("Please enter a valid Google Sheets URL"),
  range: z.string().default("A:D"),
});

interface GoogleSheetsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export default function GoogleSheetsImportModal({ 
  isOpen, 
  onClose, 
  onImportComplete 
}: GoogleSheetsImportModalProps) {
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [sheetInfo, setSheetInfo] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof importSchema>>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      spreadsheetUrl: "",
      range: "A:D",
    },
  });

  const getSheetInfo = async (url: string) => {
    try {
      const response = await fetch('/api/sheets/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spreadsheetUrl: url }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSheetInfo(data);
    } catch (error) {
      console.error('Failed to get sheet info:', error);
      setSheetInfo(null);
    }
  };

  const onSubmit = async (data: z.infer<typeof importSchema>) => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/sheets/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setImportResult(result);
      
      if (result.imported > 0) {
        toast({
          title: "Import Successful",
          description: `Imported ${result.imported} keywords${result.skipped > 0 ? `, skipped ${result.skipped}` : ''}`,
        });
        
        if (onImportComplete) {
          onImportComplete();
        }
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import keywords",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setImportResult(null);
    setSheetInfo(null);
    form.reset();
    onClose();
  };

  const urlValue = form.watch("spreadsheetUrl");

  // Auto-fetch sheet info when URL changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (urlValue && urlValue.includes('docs.google.com/spreadsheets')) {
        getSheetInfo(urlValue);
      } else {
        setSheetInfo(null);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [urlValue]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Import Keywords from Google Sheets
          </DialogTitle>
          <DialogDescription>
            Import keywords directly from your Google Sheets spreadsheet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Expected format:</strong> Column A: Keywords, Column B: Category, Column C: Brand, Column D: Platforms (optional)
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="spreadsheetUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Sheets URL</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        disabled={isImporting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sheet Range</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="A:D (columns A to D)"
                        disabled={isImporting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sheet Info */}
              {sheetInfo && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center text-green-800">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    <span className="font-medium">Sheet found: {sheetInfo.title}</span>
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    {sheetInfo.sheets?.map((sheet: any) => (
                      <div key={sheet.title}>
                        {sheet.title}: {sheet.rowCount} rows × {sheet.columnCount} columns
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
                        <div>↷ Skipped: {importResult.skipped} (duplicates or empty)</div>
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
                      Import Keywords
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {/* Sample Format */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Sample Sheet Format:</h4>
            <div className="text-xs font-mono text-gray-600 space-y-1">
              <div className="grid grid-cols-4 gap-2">
                <div className="font-bold">Keyword</div>
                <div className="font-bold">Category</div>
                <div className="font-bold">Brand</div>
                <div className="font-bold">Platforms</div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>best cdp tools</div>
                <div>Product</div>
                <div>Segment</div>
                <div>all</div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>customer data</div>
                <div>General</div>
                <div>Segment</div>
                <div>gpt,claude</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}