interface APIUsageLog {
  timestamp: Date;
  service: string;
  platform: string;
  keyword: string;
  brand: string;
  tokensUsed?: number;
  cost?: number;
  success: boolean;
  error?: string;
}

class APIUsageLogger {
  private usageLogs: APIUsageLog[] = [];

  logAPICall(log: APIUsageLog) {
    this.usageLogs.push(log);
    console.log(`[API USAGE] ${log.service} - ${log.platform} - ${log.keyword} - Success: ${log.success}`);
  }

  getUsageStats() {
    const totalCalls = this.usageLogs.length;
    const successfulCalls = this.usageLogs.filter(log => log.success).length;
    const totalTokens = this.usageLogs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0);
    const totalCost = this.usageLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

    return {
      totalCalls,
      successfulCalls,
      failedCalls: totalCalls - successfulCalls,
      totalTokens,
      estimatedCost: totalCost,
      recentLogs: this.usageLogs.slice(-10)
    };
  }

  getAPIKeyStatus() {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const hasClaudeKey = !!process.env.ANTHROPIC_API_KEY;
    const hasGeminiKey = !!process.env.GOOGLE_AI_API_KEY;
    const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;

    return {
      openai: hasOpenAIKey ? 'Available' : 'Missing',
      claude: hasClaudeKey ? 'Available' : 'Missing - Only simulated responses',
      gemini: hasGeminiKey ? 'Available' : 'Missing - Only simulated responses',
      perplexity: hasPerplexityKey ? 'Available' : 'Missing - Only simulated responses'
    };
  }
}

export const apiUsageLogger = new APIUsageLogger();