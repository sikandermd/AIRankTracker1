import { storage } from "../storage";
import { notificationService } from "./notificationService";
import type { InsertAlertLog } from "@shared/schema";

interface TrackingResult {
  keywordId: string;
  brandId: string;
  aiPlatform: string;
  mentioned: boolean;
  position: 'top' | 'middle' | 'bottom' | null;
  mentionCount: number;
}

export class AlertEngine {
  async checkAlertsForResult(result: TrackingResult): Promise<void> {
    try {
      // Get all active alerts for this keyword and brand
      const alerts = await storage.getAlertsForKeywordAndBrand(result.keywordId, result.brandId);
      
      if (!alerts.length) return;

      for (const alert of alerts) {
        // Check if this platform is monitored by the alert
        if (!alert.platforms.includes(result.aiPlatform)) continue;

        // Get previous result for comparison
        const previousResults = await storage.getTrackingResults({
          keywordId: result.keywordId,
          brandId: result.brandId,
          aiPlatform: result.aiPlatform,
          limit: 2
        });

        const previousResult = previousResults.length > 1 ? previousResults[1] : null;

        // Check each trigger condition
        await this.checkMentionChange(alert, result, previousResult);
        await this.checkPositionImprove(alert, result, previousResult);
        await this.checkNewPlatform(alert, result, previousResult);
        await this.checkMentionIncrease(alert, result, previousResult);
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  private async checkMentionChange(alert: any, current: TrackingResult, previous: TrackingResult | null): Promise<void> {
    if (!alert.triggerConditions.mentionChange) return;

    const wasNotMentioned = !previous || !previous.mentioned;
    const isNowMentioned = current.mentioned;

    if (wasNotMentioned && isNowMentioned) {
      await this.triggerAlert(alert, current, 'mention_change', 'not mentioned', 'mentioned');
    }
  }

  private async checkPositionImprove(alert: any, current: TrackingResult, previous: TrackingResult | null): Promise<void> {
    if (!alert.triggerConditions.positionImprove) return;

    if (!previous || !current.mentioned) return;

    const positionValues = { 'top': 3, 'middle': 2, 'bottom': 1, null: 0 };
    const previousValue = positionValues[previous.position || null];
    const currentValue = positionValues[current.position || null];

    if (currentValue > previousValue) {
      await this.triggerAlert(
        alert, 
        current, 
        'position_improve', 
        previous.position || 'not mentioned', 
        current.position || 'mentioned'
      );
    }
  }

  private async checkNewPlatform(alert: any, current: TrackingResult, previous: TrackingResult | null): Promise<void> {
    if (!alert.triggerConditions.newPlatform) return;

    const wasNotOnPlatform = !previous;
    const isNowOnPlatform = current.mentioned;

    if (wasNotOnPlatform && isNowOnPlatform) {
      await this.triggerAlert(alert, current, 'new_platform', 'not visible', 'visible');
    }
  }

  private async checkMentionIncrease(alert: any, current: TrackingResult, previous: TrackingResult | null): Promise<void> {
    if (!alert.triggerConditions.mentionIncrease) return;

    if (!previous) return;

    const previousCount = previous.mentionCount || 0;
    const currentCount = current.mentionCount || 0;

    if (currentCount > previousCount) {
      await this.triggerAlert(
        alert, 
        current, 
        'mention_increase', 
        previousCount.toString(), 
        currentCount.toString()
      );
    }
  }

  private async triggerAlert(
    alert: any, 
    result: TrackingResult, 
    triggerType: string, 
    previousValue: string, 
    currentValue: string
  ): Promise<void> {
    try {
      // Get brand and keyword details for notification
      const brand = await storage.getBrand(result.brandId);
      const keyword = await storage.getKeyword(result.keywordId);

      if (!brand || !keyword) return;

      // Create alert log
      const logData: InsertAlertLog = {
        alertId: alert.id,
        platform: result.aiPlatform,
        triggerType,
        previousValue,
        currentValue,
        notificationSent: false,
      };

      const alertLog = await storage.createAlertLog(logData);

      // Send notifications
      const notificationData = {
        brandName: brand.name,
        keyword: keyword.keyword,
        platform: result.aiPlatform,
        triggerType,
        previousValue,
        currentValue,
        alertName: alert.name,
      };

      let notificationSent = false;
      let notificationError = '';

      // Send email notification
      if (alert.notificationMethods.email) {
        try {
          const emailSent = await notificationService.sendEmailNotification(
            alert.notificationMethods.email,
            notificationData
          );
          notificationSent = notificationSent || emailSent;
        } catch (error) {
          notificationError += `Email error: ${error}; `;
        }
      }

      // Send Discord notification
      if (alert.notificationMethods.discord) {
        try {
          const discordSent = await notificationService.sendDiscordNotification(
            alert.notificationMethods.discord,
            notificationData
          );
          notificationSent = notificationSent || discordSent;
        } catch (error) {
          notificationError += `Discord error: ${error}; `;
        }
      }

      // Update alert log with notification status
      await storage.updateAlertLog(alertLog.id, {
        notificationSent,
        notificationError: notificationError || null,
      });

      // Update alert last triggered time
      await storage.updateAlert(alert.id, {
        lastTriggered: new Date(),
      });

      console.log(`Alert triggered: ${alert.name} - ${triggerType} for ${brand.name} on ${result.aiPlatform}`);
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }
}

export const alertEngine = new AlertEngine();