import { TemplateEngine } from './TemplateEngine';

export class PrintService {
  private templateEngine: TemplateEngine;

  constructor() {
    this.templateEngine = new TemplateEngine();
  }

  async printPhotos(photos: string[], template: string): Promise<void> {
    try {
      // Compose photos into template
      const composedImage = await this.templateEngine.composePhotos(photos, template as any);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window');
      }

      // Write the image to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Photos</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh;
              }
              img { 
                max-width: 100%; 
                max-height: 100%; 
                display: block;
              }
              @media print {
                body { padding: 0; }
                img { margin: 0; }
              }
            </style>
          </head>
          <body>
            <img src="${composedImage}" alt="Photo Strip" />
          </body>
        </html>
      `);

      printWindow.document.close();

      // Wait for image to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  }

  async saveToUSB(photos: string[], template: string): Promise<void> {
    try {
      const composedImage = await this.templateEngine.composePhotos(photos, template as any);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `photobooth-${Date.now()}.jpg`;
      link.href = composedImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  }

  generateQRCode(photos: string[], template: string): string {
    // For now, return a placeholder QR code URL
    // In production, this would generate a real QR code linking to the photos
    const sessionId = Date.now().toString();
    return `https://photobooth.app/photos/${sessionId}`;
  }
}
