import { SiOpenai, SiGoogle, SiAnthropic } from "react-icons/si";
import { Brain } from "lucide-react";

interface PlatformIconProps {
  platform: string;
  className?: string;
}

export const PlatformIcon = ({ platform, className = "w-4 h-4" }: PlatformIconProps) => {
  const normalizedPlatform = platform.toLowerCase();
  
  switch (normalizedPlatform) {
    case 'gpt':
    case 'chatgpt':
    case 'openai':
      return <SiOpenai className={`${className} text-green-600`} title="ChatGPT" />;
    
    case 'claude':
    case 'anthropic':
      return <SiAnthropic className={`${className} text-orange-600`} title="Claude" />;
    
    case 'gemini':
    case 'google':
      return <SiGoogle className={`${className} text-blue-600`} title="Gemini" />;
    
    case 'perplexity':
      return (
        <div className={`${className} bg-purple-600 rounded text-white flex items-center justify-center text-xs font-bold`} title="Perplexity">
          ⌘
        </div>
      );
    
    default:
      return <Brain className={`${className} text-gray-600`} title={platform} />;
  }
};

export const getPlatformName = (platform: string): string => {
  const normalizedPlatform = platform.toLowerCase();
  
  switch (normalizedPlatform) {
    case 'gpt':
    case 'chatgpt':
    case 'openai':
      return 'ChatGPT';
    
    case 'claude':
    case 'anthropic':
      return 'Claude';
    
    case 'gemini':
    case 'google':
      return 'Gemini';
    
    case 'perplexity':
      return 'Perplexity';
    
    default:
      return platform;
  }
};

export const getPlatformColor = (platform: string): string => {
  const normalizedPlatform = platform.toLowerCase();
  
  switch (normalizedPlatform) {
    case 'gpt':
    case 'chatgpt':
    case 'openai':
      return 'bg-green-100 text-green-800 border-green-200';
    
    case 'claude':
    case 'anthropic':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    
    case 'gemini':
    case 'google':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    
    case 'perplexity':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};