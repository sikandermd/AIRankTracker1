import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface AnalysisResult {
  mentioned: boolean;
  position: 'top' | 'middle' | 'bottom' | null;
  mentionCount: number;
  competitorsMentioned: string[];
  responseText: string;
  confidence: number;
}

export class AIAnalyzer {
  async analyzeAIResponse(
    keyword: string,
    brandName: string,
    aiPlatform: string,
    responseText: string
  ): Promise<AnalysisResult> {
    try {
      const prompt = `
Analyze the following AI response for mentions of the brand "${brandName}" in relation to the keyword "${keyword}".

AI Platform: ${aiPlatform}
Response Text: "${responseText}"

Please analyze and return JSON with:
1. mentioned: true/false if the brand is mentioned
2. position: "top", "middle", or "bottom" based on where the brand appears in the response (or null if not mentioned)
3. mentionCount: number of times the brand is mentioned
4. competitorsMentioned: array of competitor brand names mentioned in the response
5. confidence: confidence score 0-1 for the analysis accuracy

Consider these competitor brands: Segment, Clevertap, Hightouch, Mixpanel, Amplitude, HubSpot, Salesforce, Klaviyo, Adobe, Lytics, NotifyVisitors

Respond only with valid JSON.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing AI responses for brand mentions and competitive analysis. Return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const analysisResult = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        mentioned: analysisResult.mentioned || false,
        position: analysisResult.position || null,
        mentionCount: analysisResult.mentionCount || 0,
        competitorsMentioned: analysisResult.competitorsMentioned || [],
        responseText,
        confidence: analysisResult.confidence || 0,
      };
    } catch (error) {
      console.error('Error analyzing AI response:', error);
      return {
        mentioned: false,
        position: null,
        mentionCount: 0,
        competitorsMentioned: [],
        responseText,
        confidence: 0,
      };
    }
  }

  async getAIPlatformResponse(keyword: string, platform: string): Promise<string> {
    try {
      // For now, simulate getting responses from different AI platforms
      // In a real implementation, this would make actual API calls to each platform
      
      switch (platform) {
        case 'gpt':
          return await this.getChatGPTResponse(keyword);
        case 'claude':
          return await this.getClaudeResponse(keyword);
        case 'gemini':
          return await this.getGeminiResponse(keyword);
        case 'perplexity':
          return await this.getPerplexityResponse(keyword);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Error getting response from ${platform}:`, error);
      return `Error fetching response from ${platform}: ${error}`;
    }
  }

  private async getChatGPTResponse(keyword: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `What are the best solutions for "${keyword}"? Please provide a comprehensive list with explanations.`
          }
        ],
        max_tokens: 1000,
      });

      return response.choices[0].message.content || "No response generated";
    } catch (error) {
      throw new Error(`ChatGPT API error: ${error}`);
    }
  }

  private async getClaudeResponse(keyword: string): Promise<string> {
    // Placeholder for Claude API integration
    // Would require Anthropic API key and SDK
    return `Claude response for "${keyword}" - API integration needed with ANTHROPIC_API_KEY`;
  }

  private async getGeminiResponse(keyword: string): Promise<string> {
    // Placeholder for Gemini API integration
    // Would require Google AI API key and SDK
    return `Gemini response for "${keyword}" - API integration needed with GOOGLE_AI_API_KEY`;
  }

  private async getPerplexityResponse(keyword: string): Promise<string> {
    // Placeholder for Perplexity API integration
    // Would require Perplexity API key and SDK
    return `Perplexity response for "${keyword}" - API integration needed with PERPLEXITY_API_KEY`;
  }
}

export const aiAnalyzer = new AIAnalyzer();
