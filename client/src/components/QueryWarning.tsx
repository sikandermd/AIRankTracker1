import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";

interface QueryWarningProps {
  keyword: string;
}

export default function QueryWarning({ keyword }: QueryWarningProps) {
  return (
    <Alert className="mt-4 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium text-blue-800">Query Information:</p>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>Your Search:</strong> "{keyword}"</p>
            <p>• <strong>ChatGPT Query:</strong> We send your exact keyword to ChatGPT</p>
            <p>• <strong>Analysis:</strong> OpenAI GPT-4o analyzes the response for brand mentions</p>
            <p>• <strong>Real vs Demo:</strong> Only ChatGPT responses are real, others are simulated</p>
          </div>
          <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-100 rounded">
            <strong>Pro Tip:</strong> Try different keyword formats like "best customer data platform" vs "customer data platform comparison" for varied results
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}