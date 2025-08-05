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
        sender: { email: 'jason@notifyvisitorsmail.com', name: 'AI Ranking Tracker' },
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

  async sendCombinedAlertEmail(data: {
    brandName: string;
    keyword: string;
    alertName: string;
    email: string;
    alerts: Array<{
      type: 'mention_change' | 'position_improve' | 'new_platform' | 'mention_increase';
      platform: string;
      previousValue: string;
      currentValue: string;
      timestamp: Date;
    }>;
  }): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('Brevo not configured, skipping combined alert email');
      return false;
    }

    try {
      const subject = this.generateCombinedEmailSubject(data);
      const html = this.generateCombinedEmailHTML(data);

      const emailData = {
        to: [{ email: data.email }],
        sender: { email: 'jason@notifyvisitorsmail.com', name: 'AI Ranking Tracker' },
        subject: subject,
        htmlContent: html,
        textContent: this.generateCombinedTextContent(data)
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
      console.log('Combined alert email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Combined alert email failed:', error);
      return false;
    }
  }

  async sendMultiBrandAlertEmail(data: {
    email: string;
    alertName: string;
    totalAlerts: number;
    brandReports: Array<{
      brandName: string;
      keyword: string;
      alerts: Array<{
        type: 'mention_change' | 'position_improve' | 'new_platform' | 'mention_increase';
        platform: string;
        previousValue: string;
        currentValue: string;
        timestamp: Date;
      }>;
    }>;
  }): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('Brevo not configured, skipping multi-brand alert email');
      return false;
    }

    try {
      const subject = this.generateMultiBrandEmailSubject(data);
      const html = this.generateMultiBrandEmailHTML(data);

      const emailData = {
        to: [{ email: data.email }],
        sender: { email: 'jason@notifyvisitorsmail.com', name: 'AI Ranking Tracker' },
        subject: subject,
        htmlContent: html,
        textContent: this.generateMultiBrandTextContent(data)
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
      console.log('Multi-brand alert email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Multi-brand alert email failed:', error);
      return false;
    }
  }

  private generateMultiBrandEmailSubject(data: {
    alertName: string;
    totalAlerts: number;
    brandReports: Array<{ brandName: string }>;
  }): string {
    const brandCount = data.brandReports.length;
    const brandNames = data.brandReports.slice(0, 2).map(b => b.brandName).join(', ');
    const moreBrands = brandCount > 2 ? ` and ${brandCount - 2} more` : '';
    
    return `🔔 ${data.totalAlerts} Alerts: ${brandNames}${moreBrands} - ${data.alertName}`;
  }

  private generateCombinedEmailSubject(data: {
    brandName: string;
    keyword: string;
    alerts: Array<{ type: string; platform: string }>;
  }): string {
    const alertCount = data.alerts.length;
    const platforms = [...new Set(data.alerts.map(a => a.platform))];
    const platformText = platforms.length === 1 ? platforms[0] : `${platforms.length} platforms`;
    
    return `🔔 ${alertCount} Alert${alertCount > 1 ? 's' : ''}: ${data.brandName} activity on ${platformText}`;
  }

  private generateMultiBrandEmailHTML(data: {
    alertName: string;
    totalAlerts: number;
    brandReports: Array<{
      brandName: string;
      keyword: string;
      alerts: Array<{
        type: 'mention_change' | 'position_improve' | 'new_platform' | 'mention_increase';
        platform: string;
        previousValue: string;
        currentValue: string;
        timestamp: Date;
      }>;
    }>;
  }): string {
    const getAlertIcon = (type: string) => {
      switch (type) {
        case 'mention_change': return '🎉';
        case 'position_improve': return '📈';
        case 'new_platform': return '🚀';
        case 'mention_increase': return '📊';
        default: return '🔔';
      }
    };

    const getAlertDescription = (alert: any) => {
      switch (alert.type) {
        case 'mention_change':
          return `Now mentioned at <strong>${alert.currentValue}</strong> on ${alert.platform}`;
        case 'position_improve':
          return `Improved from <span style="color: #dc2626;">${alert.previousValue}</span> to <span style="color: #16a34a; font-weight: bold;">${alert.currentValue}</span> on ${alert.platform}`;
        case 'new_platform':
          return `First mention detected on <strong>${alert.platform}</strong> at ${alert.currentValue}`;
        case 'mention_increase':
          return `Mentions increased from ${alert.previousValue} to <strong>${alert.currentValue}</strong> on ${alert.platform}`;
        default:
          return `Alert triggered on ${alert.platform}`;
      }
    };

    const brandSections = data.brandReports.map(brand => {
      const brandAlerts = brand.alerts.map(alert => `
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #FB9A4E; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 20px; margin-right: 10px;">${getAlertIcon(alert.type)}</span>
            <strong style="color: #333;">${alert.platform}</strong>
            <span style="color: #666; margin-left: auto; font-size: 12px;">${alert.timestamp.toLocaleTimeString()}</span>
          </div>
          <p style="margin: 0; color: #555; font-size: 14px;">${getAlertDescription(alert)}</p>
        </div>
      `).join('');

      return `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #333; margin: 0 0 15px 0; display: flex; align-items: center;">
            <span style="background: #FB9A4E; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 10px;">BRAND</span>
            ${brand.brandName}
          </h3>
          <p style="color: #666; margin: 0 0 15px 0;"><strong>Keyword:</strong> "${brand.keyword}"</p>
          <div>${brandAlerts}</div>
        </div>
      `;
    }).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FB9A4E, #FF7F3F); padding: 30px; border-radius: 8px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🔔 Multi-Brand Alert Report</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.totalAlerts} alerts detected across ${data.brandReports.length} brands</p>
        </div>
        
        <div style="background: #fff; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #e5e5e5;">
          <h2 style="color: #333; margin: 0 0 10px 0;">Alert: ${data.alertName}</h2>
          <p style="color: #666; margin: 0 0 20px 0;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>

        ${brandSections}
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
          <p style="color: #666; margin: 0; font-size: 12px;">
            Powered by AI Ranking Tracker | 
            <a href="mailto:jason@notifyvisitorsmail.com" style="color: #FB9A4E;">Contact Support</a>
          </p>
        </div>
      </div>
    `;
  }

  private generateMultiBrandTextContent(data: {
    alertName: string;
    totalAlerts: number;
    brandReports: Array<{
      brandName: string;
      keyword: string;
      alerts: Array<{
        type: string;
        platform: string;
        previousValue: string;
        currentValue: string;
      }>;
    }>;
  }): string {
    const brandSummaries = data.brandReports.map(brand => {
      const alertSummaries = brand.alerts.map(alert => 
        `- ${alert.platform}: ${alert.type} (${alert.currentValue})`
      ).join('\n');
      
      return `${brand.brandName} (${brand.keyword}):\n${alertSummaries}`;
    }).join('\n\n');

    return `Multi-Brand Alert Report\n\nAlert: ${data.alertName}\nTotal Alerts: ${data.totalAlerts}\nBrands: ${data.brandReports.length}\n\n${brandSummaries}\n\nGenerated by AI Ranking Tracker`;
  }

  private generateMultiBrandAlertCreationHTML(data: {
    alertName: string;
    brands: Array<{ brandName: string; keywords: string[] }>;
    platforms: string[];
  }): string {
    const platformList = data.platforms.map(p => p.toUpperCase()).join(', ');
    const totalBrands = data.brands.length;
    const totalKeywords = data.brands.reduce((sum, brand) => sum + brand.keywords.length, 0);
    
    const brandSections = data.brands.map(brand => {
      const keywordList = brand.keywords.map(keyword => `
        <span style="background: #FB9A4E; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin: 2px; display: inline-block;">${keyword}</span>
      `).join('');
      
      return `
        <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #FB9A4E; margin-bottom: 15px;">
          <h4 style="color: #333; margin: 0 0 10px 0; display: flex; align-items: center;">
            <span style="background: #FB9A4E; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; margin-right: 10px;">BRAND</span>
            ${brand.brandName}
          </h4>
          <p style="color: #666; margin: 0 0 10px 0;"><strong>Keywords (${brand.keywords.length}):</strong></p>
          <div style="margin-bottom: 10px;">${keywordList}</div>
        </div>
      `;
    }).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FB9A4E, #FF7F3F); padding: 30px; border-radius: 8px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🔔 Multi-Brand Alert Successfully Created!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Monitoring ${totalBrands} brands with ${totalKeywords} keywords</p>
        </div>
        
        <div style="background: #fff; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #e5e5e5;">
          <h2 style="color: #333; margin: 0 0 10px 0;">Alert: ${data.alertName}</h2>
          <p style="color: #666; margin: 0 0 10px 0;"><strong>Monitoring Platforms:</strong> ${platformList}</p>
          <p style="color: #666; margin: 0 0 20px 0;">Created on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h3 style="color: #333; margin: 0 0 20px 0;">Alert Coverage Summary</h3>
          ${brandSections}
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h4 style="color: #1976d2; margin: 0 0 15px 0;">📢 You'll receive notifications when:</h4>
          <ul style="color: #666; margin: 0; padding-left: 20px;">
            <li>Brand mentions change for these keywords</li>
            <li>Position improves on any platform</li>
            <li>Brand appears on new platforms</li>
            <li>Mention frequency increases</li>
          </ul>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
          <p style="color: #666; margin: 0; font-size: 12px;">
            Powered by AI Ranking Tracker | 
            <a href="mailto:jason@notifyvisitorsmail.com" style="color: #FB9A4E;">Contact Support</a>
          </p>
        </div>
      </div>
    `;
  }

  private generateMultiBrandAlertCreationTextContent(data: {
    alertName: string;
    brands: Array<{ brandName: string; keywords: string[] }>;
    platforms: string[];
  }): string {
    const brandSummaries = data.brands.map(brand => 
      `${brand.brandName}: ${brand.keywords.join(', ')}`
    ).join('\n');
    
    const totalBrands = data.brands.length;
    const totalKeywords = data.brands.reduce((sum, brand) => sum + brand.keywords.length, 0);

    return `Multi-Brand Alert Created: ${data.alertName}\n\nSummary:\n- Brands: ${totalBrands}\n- Keywords: ${totalKeywords}\n- Platforms: ${data.platforms.join(', ')}\n\nBrand Details:\n${brandSummaries}\n\nYou'll receive notifications when your brands are mentioned on these AI platforms.`;
  }

  private generateCombinedEmailHTML(data: {
    brandName: string;
    keyword: string;
    alertName: string;
    alerts: Array<{
      type: 'mention_change' | 'position_improve' | 'new_platform' | 'mention_increase';
      platform: string;
      previousValue: string;
      currentValue: string;
      timestamp: Date;
    }>;
  }): string {
    const getAlertIcon = (type: string) => {
      switch (type) {
        case 'mention_change': return '🎉';
        case 'position_improve': return '📈';
        case 'new_platform': return '🚀';
        case 'mention_increase': return '📊';
        default: return '🔔';
      }
    };

    const getAlertTitle = (type: string) => {
      switch (type) {
        case 'mention_change': return 'New Mention';
        case 'position_improve': return 'Position Improved';
        case 'new_platform': return 'New Platform';
        case 'mention_increase': return 'Mentions Increased';
        default: return 'Alert';
      }
    };

    const getAlertDescription = (alert: any) => {
      switch (alert.type) {
        case 'mention_change':
          return `Now mentioned at <strong>${alert.currentValue}</strong> on ${alert.platform}`;
        case 'position_improve':
          return `Improved from <span style="color: #dc2626;">${alert.previousValue}</span> to <span style="color: #16a34a; font-weight: bold;">${alert.currentValue}</span> on ${alert.platform}`;
        case 'new_platform':
          return `Now visible at <strong>${alert.currentValue}</strong> on ${alert.platform}`;
        case 'mention_increase':
          return `Mentions increased from ${alert.previousValue} to <strong>${alert.currentValue}</strong> on ${alert.platform}`;
        default:
          return `Alert triggered on ${alert.platform}`;
      }
    };

    const alertsHTML = data.alerts.map(alert => `
      <div style="background: white; border: 1px solid #e5e7eb; border-left: 4px solid #FB9A4E; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 20px; margin-right: 10px;">${getAlertIcon(alert.type)}</span>
          <h3 style="margin: 0; color: #333; font-size: 18px;">${getAlertTitle(alert.type)}</h3>
          <span style="margin-left: auto; color: #6b7280; font-size: 12px;">${alert.timestamp.toLocaleString()}</span>
        </div>
        <p style="margin: 0; color: #555; line-height: 1.6;">
          ${getAlertDescription(alert)}
        </p>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Combined AI Ranking Alerts</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #FB9A4E, #FF7F3F); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🔔 Combined AI Ranking Alerts</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">
              ${data.alerts.length} alert${data.alerts.length > 1 ? 's' : ''} for <strong>${data.brandName}</strong>
            </p>
          </div>
          
          <div style="background: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #FB9A4E; padding-bottom: 10px;">
              Summary
            </h2>
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
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold;">Total Alerts:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #FB9A4E; font-weight: bold;">${data.alerts.length}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Platforms:</td>
                <td style="padding: 8px 0;">${[...new Set(data.alerts.map(a => a.platform))].join(', ')}</td>
              </tr>
            </table>
          </div>

          <div style="background: #ffffff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #FB9A4E; padding-bottom: 10px;">
              Alert Details
            </h2>
            ${alertsHTML}
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This combined alert was generated by your AI Ranking Tracker.<br>
              <a href="#" style="color: #FB9A4E; text-decoration: none;">Manage your alerts</a> | 
              <a href="#" style="color: #FB9A4E; text-decoration: none;">View detailed analytics</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private generateCombinedTextContent(data: {
    brandName: string;
    keyword: string;
    alerts: Array<{
      type: string;
      platform: string;
      previousValue: string;
      currentValue: string;
    }>;
  }): string {
    let text = `Combined AI Ranking Alerts\n\n`;
    text += `Brand: ${data.brandName}\n`;
    text += `Keyword: "${data.keyword}"\n`;
    text += `Total Alerts: ${data.alerts.length}\n\n`;

    data.alerts.forEach((alert, index) => {
      text += `Alert ${index + 1}:\n`;
      text += `- Type: ${alert.type.replace('_', ' ')}\n`;
      text += `- Platform: ${alert.platform}\n`;
      text += `- Previous: ${alert.previousValue}\n`;
      text += `- Current: ${alert.currentValue}\n\n`;
    });

    text += `This is an automated message from AI Ranking Tracker.`;
    return text;
  }

  async sendMultiBrandAlertCreationEmail(data: {
    email: string;
    alertName: string;
    brands: Array<{ brandName: string; keywords: string[] }>;
    platforms: string[];
  }): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('Brevo not configured, skipping multi-brand alert creation email');
      return false;
    }

    try {
      const totalBrands = data.brands.length;
      const totalKeywords = data.brands.reduce((sum, brand) => sum + brand.keywords.length, 0);
      const subject = `✅ Multi-Brand Alert Created: ${data.alertName} (${totalBrands} brands, ${totalKeywords} keywords)`;
      const html = this.generateMultiBrandAlertCreationHTML(data);

      const emailData = {
        to: [{ email: data.email }],
        sender: { email: 'jason@notifyvisitorsmail.com', name: 'AI Ranking Tracker' },
        subject: subject,
        htmlContent: html,
        textContent: this.generateMultiBrandAlertCreationTextContent(data)
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
      console.log('Multi-brand alert creation email sent successfully:', result);
      console.log(`Multi-brand alert creation email sent to ${data.email}`);
      
      return true;
    } catch (error) {
      console.error('Multi-brand alert creation email failed:', error);
      return false;
    }
  }

  async sendAlertCreationEmail(data: {
    email: string;
    alertName: string;
    brandName: string;
    keyword: string;
    platforms: string[];
  }): Promise<boolean> {
    // Skip individual emails during multi-brand alert creation
    if (data.alertName.includes(' - ') && data.alertName.toLowerCase().includes('alert')) {
      console.log('Skipping individual email for multi-brand alert:', data.alertName);
      return true; // Return success but don't actually send
    }
    if (!this.apiKey) {
      console.warn('Brevo not configured, skipping alert creation email');
      return false;
    }

    try {
      const subject = `✅ Alert Created: ${data.alertName}`;
      const html = this.generateAlertCreationHTML(data);

      const emailData = {
        to: [{ email: data.email }],
        sender: { email: 'jason@notifyvisitorsmail.com', name: 'AI Ranking Tracker' },
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
        sender: 'jason@notifyvisitorsmail.com'
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