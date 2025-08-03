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
  private apiKey?: string;

  constructor() {
    if (process.env.BREVO_API_KEY) {
      this.apiKey = process.env.BREVO_API_KEY;
      console.log('Brevo API key configured successfully. Length:', this.apiKey.length);
    } else {
      console.warn('BREVO_API_KEY not found in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('BREVO')));
    }
  }

  async sendEmailNotification(email: string, data: NotificationData): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('Brevo not configured, skipping email notification');
      return false;
    }

    try {
      const subject = this.generateEmailSubject(data);
      const html = this.generateEmailHTML(data);

      const emailData = {
        to: [{ email }],
        sender: { email: 'sikander@notifyvisitors.com', name: 'AI Ranking Tracker' },
        subject: subject,
        htmlContent: html,
        textContent: `Brand Monitoring Alert\n\nBrand: ${data.brandName}\nKeyword: ${data.keyword}\nPlatform: ${data.platform}\nTrigger: ${data.triggerType}\nValue: ${data.currentValue}`
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Brevo API error:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      console.log('Brevo email sent successfully:', result);
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
        return `🎉 ${data.brandName} now at ${data.currentValue} for "${data.keyword}" on ${data.platform}`;
      case 'position_improve':
        return `📈 ${data.brandName} improved to ${data.currentValue} for "${data.keyword}" on ${data.platform}`;
      case 'new_platform':
        return `🚀 ${data.brandName} now at ${data.currentValue} on ${data.platform} for "${data.keyword}"`;
      case 'mention_increase':
        return `📊 ${data.brandName} mentions increased to ${data.currentValue} for "${data.keyword}" on ${data.platform}`;
      default:
        return `🔔 Alert: ${data.alertName}`;
    }
  }

  private generateEmailHTML(data: NotificationData): string {
    const getChangeDescription = () => {
      switch (data.triggerType) {
        case 'mention_change':
          return `Great news! Your brand <strong>${data.brandName}</strong> is now mentioned at <span style="color: #16a34a; font-weight: bold;">${data.currentValue}</span> when people search for "<strong>${data.keyword}</strong>" on ${data.platform}!`;
        case 'position_improve':
          return `Excellent! Your brand <strong>${data.brandName}</strong> improved from <span style="color: #dc2626;">${data.previousValue}</span> to <span style="color: #16a34a; font-weight: bold;">${data.currentValue}</span> for "${data.keyword}" on ${data.platform}.`;
        case 'new_platform':
          return `Your brand <strong>${data.brandName}</strong> is now visible at <span style="color: #16a34a; font-weight: bold;">${data.currentValue}</span> on <strong>${data.platform}</strong> for the keyword "${data.keyword}".`;
        case 'mention_increase':
          return `Your brand <strong>${data.brandName}</strong> mentions increased from ${data.previousValue} to <span style="color: #16a34a; font-weight: bold;">${data.currentValue}</span> for "${data.keyword}" on ${data.platform}.`;
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
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold;">Current Position:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #16a34a; font-weight: bold;">${data.currentValue}</td>
              </tr>
              ${data.previousValue ? `<tr>
                <td style="padding: 8px 0; font-weight: bold;">Previous Position:</td>
                <td style="padding: 8px 0; color: #dc2626;">${data.previousValue}</td>
              </tr>` : ''}
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

  async sendAlertCreationEmail(data: {
    email: string;
    alertName: string;
    brandName: string;
    keyword: string;
    platforms: string[];
  }): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('Brevo not configured, skipping alert creation email');
      return false;
    }

    try {
      const subject = `✅ Alert Created: ${data.alertName}`;
      const html = this.generateAlertCreationHTML(data);

      const emailData = {
        to: [{ email: data.email }],
        sender: { email: 'sikander@notifyvisitors.com', name: 'AI Ranking Tracker' },
        subject: subject,
        htmlContent: html,
        textContent: `Alert Created: ${data.alertName}\n\nBrand: ${data.brandName}\nKeyword: ${data.keyword}\nPlatforms: ${data.platforms.join(', ')}\n\nYou'll receive notifications when your brand is mentioned on these AI platforms.`
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Brevo API error:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      console.log('Alert creation email sent successfully:', result);
      console.log(`Alert creation email sent to ${data.email}`);
      
      // Log detailed email info for troubleshooting
      console.log('Email details:', {
        to: data.email,
        subject: subject,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
        sender: 'sikander@notifyvisitors.com'
      });
      
      return true;
    } catch (error) {
      console.error('Alert creation email failed:', error);
      return false;
    }
  }

  private generateAlertCreationHTML(data: {
    alertName: string;
    brandName: string;
    keyword: string;
    platforms: string[];
  }): string {
    const platformList = data.platforms.map(p => p.toUpperCase()).join(', ');
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FB9A4E, #FF7F3F); padding: 30px; border-radius: 8px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🔔 Alert Successfully Created!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
          <h2 style="color: #333; margin-top: 0;">Alert Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #FB9A4E;">
            <p><strong>Alert Name:</strong> ${data.alertName}</p>
            <p><strong>Brand:</strong> ${data.brandName}</p>
            <p><strong>Keyword:</strong> "${data.keyword}"</p>
            <p><strong>Monitoring Platforms:</strong> ${platformList}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #e8f4fd; border-radius: 6px;">
            <p style="margin: 0; color: #0066cc;">
              <strong>📧 You'll receive notifications when:</strong><br>
              • Brand mentions change for this keyword<br>
              • Position improves on any platform<br>
              • Brand appears on new platforms<br>
              • Mention frequency increases
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p>This is an automated message from AI Ranking Tracker</p>
          <p>Track your brand visibility across AI platforms</p>
        </div>
      </div>
    `;
  }
}

export const notificationService = new NotificationService();