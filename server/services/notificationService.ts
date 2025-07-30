import { MailService } from '@sendgrid/mail';

interface NotificationData {
  brandName: string;
  keyword: string;
  platform: string;
  triggerType: string;
  previousValue?: string;
  currentValue: string;
  alertName: string;
}

export class NotificationService {
  private mailService?: MailService;

  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      this.mailService = new MailService();
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  async sendEmailNotification(email: string, data: NotificationData): Promise<boolean> {
    if (!this.mailService) {
      console.warn('SendGrid not configured, skipping email notification');
      return false;
    }

    try {
      const subject = this.generateEmailSubject(data);
      const html = this.generateEmailHTML(data);

      await this.mailService.send({
        to: email,
        from: 'alerts@rankingtracker.app', // Configure this in SendGrid
        subject,
        html,
      });

      return true;
    } catch (error) {
      console.error('Email notification failed:', error);
      return false;
    }
  }

  async sendDiscordNotification(webhookUrl: string, data: NotificationData): Promise<boolean> {
    try {
      const embed = this.generateDiscordEmbed(data);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Discord notification failed:', error);
      return false;
    }
  }

  private generateEmailSubject(data: NotificationData): string {
    switch (data.triggerType) {
      case 'mention_change':
        return `🎉 ${data.brandName} now mentioned for "${data.keyword}" on ${data.platform}`;
      case 'position_improve':
        return `📈 ${data.brandName} position improved for "${data.keyword}" on ${data.platform}`;
      case 'new_platform':
        return `🚀 ${data.brandName} now visible on ${data.platform} for "${data.keyword}"`;
      case 'mention_increase':
        return `📊 ${data.brandName} mentions increased for "${data.keyword}" on ${data.platform}`;
      default:
        return `🔔 Alert: ${data.alertName}`;
    }
  }

  private generateEmailHTML(data: NotificationData): string {
    const getChangeDescription = () => {
      switch (data.triggerType) {
        case 'mention_change':
          return `Your brand <strong>${data.brandName}</strong> is now mentioned when people search for "<strong>${data.keyword}</strong>" on ${data.platform}!`;
        case 'position_improve':
          return `Your brand <strong>${data.brandName}</strong> improved from <span style="color: #dc2626;">${data.previousValue}</span> to <span style="color: #16a34a;">${data.currentValue}</span> position for "${data.keyword}" on ${data.platform}.`;
        case 'new_platform':
          return `Your brand <strong>${data.brandName}</strong> is now visible on <strong>${data.platform}</strong> for the keyword "${data.keyword}".`;
        case 'mention_increase':
          return `Your brand <strong>${data.brandName}</strong> mentions increased from ${data.previousValue} to <strong>${data.currentValue}</strong> for "${data.keyword}" on ${data.platform}.`;
        default:
          return `Alert triggered for ${data.brandName} on ${data.platform}.`;
      }
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>AI Ranking Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">🔔 AI Ranking Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Alert: ${data.alertName}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">What Happened?</h2>
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              ${getChangeDescription()}
            </p>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold;">Brand:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${data.brandName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold;">Keyword:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">"${data.keyword}"</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold;">Platform:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${data.platform}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Current Status:</td>
                <td style="padding: 8px 0;">${data.currentValue}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This alert was generated by your AI Ranking Tracker.<br>
              <a href="#" style="color: #667eea;">Manage your alerts</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private generateDiscordEmbed(data: NotificationData) {
    const getEmbedColor = () => {
      switch (data.triggerType) {
        case 'mention_change': return 0x10b981; // green
        case 'position_improve': return 0x3b82f6; // blue  
        case 'new_platform': return 0x8b5cf6; // purple
        case 'mention_increase': return 0xf59e0b; // amber
        default: return 0x6b7280; // gray
      }
    };

    const getEmbedTitle = () => {
      switch (data.triggerType) {
        case 'mention_change': return '🎉 New Brand Mention!';
        case 'position_improve': return '📈 Position Improved!';
        case 'new_platform': return '🚀 New Platform Visibility!';
        case 'mention_increase': return '📊 Mentions Increased!';
        default: return '🔔 Alert Triggered';
      }
    };

    const getDescription = () => {
      switch (data.triggerType) {
        case 'mention_change':
          return `**${data.brandName}** is now mentioned for "${data.keyword}" on **${data.platform}**`;
        case 'position_improve':
          return `**${data.brandName}** improved from **${data.previousValue}** to **${data.currentValue}** for "${data.keyword}" on **${data.platform}**`;
        case 'new_platform':
          return `**${data.brandName}** is now visible on **${data.platform}** for "${data.keyword}"`;
        case 'mention_increase':
          return `**${data.brandName}** mentions increased from **${data.previousValue}** to **${data.currentValue}** for "${data.keyword}" on **${data.platform}**`;
        default:
          return `Alert triggered for **${data.brandName}** on **${data.platform}**`;
      }
    };

    return {
      title: getEmbedTitle(),
      description: getDescription(),
      color: getEmbedColor(),
      fields: [
        {
          name: '🏷️ Brand',
          value: data.brandName,
          inline: true
        },
        {
          name: '🔍 Keyword',
          value: `"${data.keyword}"`,
          inline: true
        },
        {
          name: '🤖 Platform',
          value: data.platform,
          inline: true
        }
      ],
      footer: {
        text: `Alert: ${data.alertName}`,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export const notificationService = new NotificationService();