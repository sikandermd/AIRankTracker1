import { storage } from "../storage";
import { notificationService } from "./notificationService";

interface CombinedAlertData {
  brandName: string;
  keyword: string;
  alertName: string;
  email: string;
  alerts: {
    type: 'mention_change' | 'position_improve' | 'new_platform' | 'mention_increase';
    platform: string;
    previousValue: string;
    currentValue: string;
    timestamp: Date;
  }[];
}

interface AlertBatch {
  brandId: string;
  keywordId: string;
  email: string;
  alerts: Array<{
    type: string;
    platform: string;
    previousValue: string;
    currentValue: string;
    timestamp: Date;
  }>;
}

export class CombinedAlertService {
  private alertBatches: Map<string, AlertBatch> = new Map();
  private batchTimeout: Map<string, NodeJS.Timeout> = new Map();
  private readonly BATCH_DELAY = 5 * 60 * 1000; // 5 minutes to collect alerts

  async addAlert(
    brandId: string,
    keywordId: string,
    email: string,
    alertType: string,
    platform: string,
    previousValue: string,
    currentValue: string
  ): Promise<void> {
    const batchKey = `${brandId}-${keywordId}-${email}`;
    
    // Get or create batch
    let batch = this.alertBatches.get(batchKey);
    if (!batch) {
      batch = {
        brandId,
        keywordId,
        email,
        alerts: []
      };
      this.alertBatches.set(batchKey, batch);
    }

    // Add alert to batch
    batch.alerts.push({
      type: alertType,
      platform,
      previousValue,
      currentValue,
      timestamp: new Date()
    });

    // Reset batch timeout
    if (this.batchTimeout.has(batchKey)) {
      clearTimeout(this.batchTimeout.get(batchKey)!);
    }

    // Set new timeout to send combined email
    const timeout = setTimeout(() => {
      this.sendCombinedEmail(batchKey);
    }, this.BATCH_DELAY);

    this.batchTimeout.set(batchKey, timeout);

    // Store individual alert in database
    await this.storeAlertLog({
      brandId,
      keywordId,
      alertType,
      platform,
      previousValue,
      currentValue,
      email
    });
  }

  private async sendCombinedEmail(batchKey: string): Promise<void> {
    const batch = this.alertBatches.get(batchKey);
    if (!batch || batch.alerts.length === 0) return;

    try {
      // Get brand and keyword details
      const brand = await storage.getBrand(batch.brandId);
      const keyword = await storage.getKeyword(batch.keywordId);

      if (!brand || !keyword) {
        console.error('Brand or keyword not found for combined alert');
        return;
      }

      const combinedData: CombinedAlertData = {
        brandName: brand.name,
        keyword: keyword.keyword,
        alertName: `Combined Alert - ${brand.name}`,
        email: batch.email,
        alerts: batch.alerts.map(alert => ({
          type: alert.type as any,
          platform: alert.platform,
          previousValue: alert.previousValue,
          currentValue: alert.currentValue,
          timestamp: alert.timestamp
        }))
      };

      // Send combined email
      const success = await notificationService.sendCombinedAlertEmail(combinedData);
      
      if (success) {
        console.log(`Combined alert email sent for ${brand.name} - ${keyword.keyword}`);
        
        // Mark all alerts as sent in database
        await this.markAlertsAsSent(batch);
      }

    } catch (error) {
      console.error('Error sending combined alert email:', error);
    } finally {
      // Cleanup
      this.alertBatches.delete(batchKey);
      this.batchTimeout.delete(batchKey);
    }
  }

  private async storeAlertLog(data: {
    brandId: string;
    keywordId: string;
    alertType: string;
    platform: string;
    previousValue: string;
    currentValue: string;
    email: string;
  }): Promise<void> {
    try {
      await storage.storeCombinedAlertLog({
        brandId: data.brandId,
        keywordId: data.keywordId,
        alertType: data.alertType,
        platform: data.platform,
        previousValue: data.previousValue,
        currentValue: data.currentValue,
        email: data.email,
        timestamp: new Date(),
        combined: true,
        sent: false
      });
    } catch (error) {
      console.error('Error storing combined alert log:', error);
    }
  }

  private async markAlertsAsSent(batch: AlertBatch): Promise<void> {
    try {
      for (const alert of batch.alerts) {
        await storage.markCombinedAlertAsSent(
          batch.brandId,
          batch.keywordId,
          alert.type,
          alert.platform,
          alert.timestamp
        );
      }
    } catch (error) {
      console.error('Error marking alerts as sent:', error);
    }
  }

  // Force send all pending batches (useful for immediate testing)
  async forceSendAllBatches(): Promise<void> {
    const batchKeys = Array.from(this.alertBatches.keys());
    
    for (const batchKey of batchKeys) {
      // Clear timeout and send immediately
      if (this.batchTimeout.has(batchKey)) {
        clearTimeout(this.batchTimeout.get(batchKey)!);
        this.batchTimeout.delete(batchKey);
      }
      
      await this.sendCombinedEmail(batchKey);
    }
  }
}

export const combinedAlertService = new CombinedAlertService();