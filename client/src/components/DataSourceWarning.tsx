import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface DataSourceWarningProps {
  platforms: string[];
}

export default function DataSourceWarning({ platforms }: DataSourceWarningProps) {
  const platformStatus = {
    gpt: { 
      name: 'ChatGPT', 
      authentic: true, 
      description: 'Real responses using your OpenAI API key' 
    },
    claude: { 
      name: 'Claude', 
      authentic: false, 
      description: 'Simulated responses - needs Anthropic API key' 
    },
    gemini: { 
      name: 'Gemini', 
      authentic: false, 
      description: 'Simulated responses - needs Google AI API key' 
    },
    perplexity: { 
      name: 'Perplexity', 
      authentic: false, 
      description: 'Simulated responses - needs Perplexity API key' 
    }
  };

  const selectedPlatforms = platforms.map(p => platformStatus[p as keyof typeof platformStatus]);
  const hasSimulated = selectedPlatforms.some(p => !p?.authentic);
  const hasAuthentic = selectedPlatforms.some(p => p?.authentic);

  if (!hasSimulated) return null;

  return (
    <Alert className="mt-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium text-orange-800">Data Source Information:</p>
          <div className="space-y-1">
            {selectedPlatforms.map((platform, index) => (
              platform && (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {platform.authentic ? 
                      <CheckCircle className="w-3 h-3 text-green-600" /> : 
                      <XCircle className="w-3 h-3 text-orange-600" />
                    }
                    <span className="font-medium">{platform.name}:</span>
                    <span className="text-gray-600">{platform.description}</span>
                  </div>
                  <Badge variant={platform.authentic ? "success" : "secondary"} className="text-xs">
                    {platform.authentic ? "Real" : "Demo"}
                  </Badge>
                </div>
              )
            ))}
          </div>
          {hasAuthentic && hasSimulated && (
            <p className="text-xs text-orange-700 mt-2">
              Position and mention analysis is performed by OpenAI GPT-4o on all responses (both real and simulated).
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}