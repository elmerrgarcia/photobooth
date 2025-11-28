export class EmailService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  async sendPhotos(email: string, photos: string[], template: string): Promise<void> {
    try {
      // For demo purposes, we'll simulate email sending
      // In production, integrate with SendGrid or similar service
      
      console.log(`Sending ${photos.length} photos to ${email}`);
      console.log(`Template: ${template}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success
      console.log('Email sent successfully!');
      
      // Real implementation would look like:
      /*
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email }],
            subject: 'Your PhotoBooth Photos!',
          }],
          from: { email: 'photos@photobooth.app' },
          content: [{
            type: 'text/html',
            value: this.generateEmailHTML(photos, template),
          }],
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      */
    } catch (error) {
      console.error('Email error:', error);
      throw error;
    }
  }

  private generateEmailHTML(photos: string[], template: string): string {
    const photoElements = photos.map(photo => 
      `<img src="${photo}" style="max-width: 100%; height: auto; margin: 10px 0;" />`
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Your PhotoBooth Photos</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ff6b6b; text-align: center;">Your PhotoBooth Photos!</h1>
          <p style="text-align: center;">Thank you for using our PhotoBooth! Here are your photos:</p>
          <div style="text-align: center;">
            ${photoElements}
          </div>
          <p style="text-align: center; color: #666; font-size: 14px;">
            Template: ${template}<br>
            Date: ${new Date().toLocaleDateString()}
          </p>
          <p style="text-align: center; color: #999; font-size: 12px;">
            This email was sent from PhotoBooth Application
          </p>
        </body>
      </html>
    `;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
