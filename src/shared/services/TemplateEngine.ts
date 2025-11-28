import { TemplateType, PhotoLayout } from '../types';
import type { DesignTemplateConfig } from '../templates';

export class TemplateEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
  }

  async composePhotos(
    photos: string[],
    template: TemplateType,
    options?: { width?: number; height?: number; designTemplate?: DesignTemplateConfig }
  ): Promise<string> {
    const design = options?.designTemplate;

    if (design) {
      // Use PNG design template as background and its slots for photos
      const composed = await this.composeWithDesignTemplate(photos, design);
      return composed;
    }

    const layouts = this.getTemplateLayout(template, photos.length);
    const { width = 600, height = 1800 } = options || this.getTemplateSize(template);

    this.canvas.width = width;
    this.canvas.height = height;

    // Clear canvas with white background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, width, height);

    // Add border/frame
    this.addFrame(width, height);

    // Draw photos
    for (let i = 0; i < Math.min(photos.length, layouts.length); i++) {
      await this.drawPhoto(photos[i], layouts[i]);
    }

    // Add branding
    this.addBranding(width, height);

    return this.canvas.toDataURL('image/jpeg', 0.9);
  }

  private async composeWithDesignTemplate(
    photos: string[],
    design: DesignTemplateConfig
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const bg = new Image();
      bg.onload = async () => {
        try {
          // Match canvas to background PNG size
          this.canvas.width = bg.width;
          this.canvas.height = bg.height;

          // Create a separate canvas for slot colors
          const slotCanvas = document.createElement('canvas');
          slotCanvas.width = bg.width;
          slotCanvas.height = bg.height;
          const slotCtx = slotCanvas.getContext('2d', { willReadFrequently: true });
          
          if (!slotCtx) {
            reject(new Error('Failed to get slot canvas context'));
            return;
          }

          // Simple approach: colors first, template on top, photos last
          console.log('Simple approach: colors → template → photos');
          
          // White background
          this.ctx.fillStyle = '#ffffff';
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          
          // Test template transparency first
          this.ctx.drawImage(bg, 0, 0, this.canvas.width, this.canvas.height);
          if (design.slots.length > 0) {
            const firstSlot = design.slots[0];
            const slotAlpha = this.ctx.getImageData(firstSlot.x + 5, firstSlot.y + 5, 1, 1).data[3];
            const borderAlpha = this.ctx.getImageData(firstSlot.x - 5, firstSlot.y - 5, 1, 1).data[3];
            console.log('Template slot area alpha:', slotAlpha);
            console.log('Template border area alpha:', borderAlpha);
            console.log('Template image loaded with cache-busting:', design.backgroundUrl + '?t=' + Date.now());
          }
          
          // Your approach: photos first, then template with alpha channel
          console.log('Your approach: photos first, then template with alpha channel');
          
          // Draw photos first
          const max = Math.min(photos.length, design.slots.length);
          console.log('Photos available:', photos.length, 'Slots available:', design.slots.length);
          console.log('Will draw', max, 'photos');
          
          for (let i = 0; i < max; i++) {
            await this.drawPhoto(photos[i], design.slots[i]);
          }
          
          // Draw slot colors in remaining empty slots
          console.log('Drawing colors in empty slots');
          for (let i = max; i < design.slots.length; i++) {
            const colors = ['rgba(255, 255, 0, 1)', 'rgba(255, 0, 0, 1)', 'rgba(0, 255, 0, 1)', 'rgba(0, 0, 255, 1)', 'rgba(255, 165, 0, 1)'];
            this.ctx.fillStyle = colors[i % colors.length];
            const padding = 3;
            this.ctx.fillRect(
              design.slots[i].x + padding, 
              design.slots[i].y + padding, 
              design.slots[i].width - (padding * 2), 
              design.slots[i].height - (padding * 2)
            );
          }
          
          // Paste template over everything using PNG alpha channel
          console.log('Pasting template over with alpha channel');
          this.ctx.globalCompositeOperation = 'source-over';
          this.ctx.drawImage(bg, 0, 0, this.canvas.width, this.canvas.height);
          
          console.log('Simple solution complete');

          const dataUrl = this.canvas.toDataURL('image/png');
          console.log('Generated data URL length:', dataUrl.length);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      bg.onerror = (e) => reject(e);
      bg.src = design.backgroundUrl + '?t=' + Date.now();
    });
  }

  private getTemplateLayout(template: TemplateType, photoCount: number): PhotoLayout[] {
    switch (template) {
      case 'strip':
        return this.getStripLayout(photoCount);
      case 'collage':
        return this.getCollageLayout(photoCount);
      case 'single':
        return this.getSingleLayout(photoCount);
      default:
        return this.getStripLayout(photoCount);
    }
  }

  private getStripLayout(photoCount: number): PhotoLayout[] {
    const layouts: PhotoLayout[] = [];
    const photoHeight = 350;
    const photoWidth = 500;
    const spacing = 20;
    const startY = 150;

    for (let i = 0; i < photoCount; i++) {
      layouts.push({
        x: 50,
        y: startY + (photoHeight + spacing) * i,
        width: photoWidth,
        height: photoHeight
      });
    }

    return layouts;
  }

  private getCollageLayout(photoCount: number): PhotoLayout[] {
    const layouts: PhotoLayout[] = [];
    const padding = 20;
    const canvasWidth = 600;
    const canvasHeight = 800;

    if (photoCount === 1) {
      layouts.push({
        x: padding,
        y: padding,
        width: canvasWidth - padding * 2,
        height: canvasHeight - padding * 2
      });
    } else if (photoCount === 2) {
      const photoWidth = (canvasWidth - padding * 3) / 2;
      const photoHeight = canvasHeight - padding * 2;
      layouts.push(
        { x: padding, y: padding, width: photoWidth, height: photoHeight },
        { x: padding * 2 + photoWidth, y: padding, width: photoWidth, height: photoHeight }
      );
    } else if (photoCount === 3) {
      const mainWidth = canvasWidth - padding * 2;
      const mainHeight = (canvasHeight - padding * 3) * 0.6;
      const smallHeight = (canvasHeight - padding * 3 - mainHeight) / 2;
      layouts.push(
        { x: padding, y: padding, width: mainWidth, height: mainHeight },
        { x: padding, y: padding * 2 + mainHeight, width: mainWidth, height: smallHeight },
        { x: padding, y: padding * 3 + mainHeight + smallHeight, width: mainWidth, height: smallHeight }
      );
    } else {
      const photoWidth = (canvasWidth - padding * 3) / 2;
      const photoHeight = (canvasHeight - padding * 3) / 2;
      layouts.push(
        { x: padding, y: padding, width: photoWidth, height: photoHeight },
        { x: padding * 2 + photoWidth, y: padding, width: photoWidth, height: photoHeight },
        { x: padding, y: padding * 2 + photoHeight, width: photoWidth, height: photoHeight },
        { x: padding * 2 + photoWidth, y: padding * 2 + photoHeight, width: photoWidth, height: photoHeight }
      );
    }

    return layouts;
  }

  private getSingleLayout(photoCount: number): PhotoLayout[] {
    const layouts: PhotoLayout[] = [];
    const padding = 50;
    const canvasWidth = 600;
    const canvasHeight = 800;

    layouts.push({
      x: padding,
      y: padding,
      width: canvasWidth - padding * 2,
      height: canvasHeight - padding * 2
    });

    return layouts;
  }

  private getTemplateSize(template: TemplateType): { width: number; height: number } {
    switch (template) {
      case 'strip':
        return { width: 600, height: 1800 };
      case 'collage':
        return { width: 600, height: 800 };
      case 'single':
        return { width: 600, height: 800 };
      default:
        return { width: 600, height: 1800 };
    }
  }

  private async drawPhoto(photoSrc: string, layout: PhotoLayout): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Add rounded corners effect
        this.save();
        this.roundRect(layout.x, layout.y, layout.width, layout.height, 10);
        this.ctx.clip();
        
        // Draw and scale image to fit layout
        this.drawImage(img, layout.x, layout.y, layout.width, layout.height);
        
        this.restore();
        
        // Add border around photo
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(layout.x, layout.y, layout.width, layout.height);
        
        resolve();
      };
      img.src = photoSrc;
    });
  }

  private addFrame(width: number, height: number): void {
    // Add decorative frame
    this.ctx.strokeStyle = '#ff6b6b';
    this.ctx.lineWidth = 8;
    this.ctx.strokeRect(10, 10, width - 20, height - 20);
    
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(20, 20, width - 40, height - 40);
  }

  private addBranding(width: number, height: number): void {
    // Add logo/text at bottom
    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PhotoBooth', width / 2, height - 30);
    
    // Add date
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#666666';
    const date = new Date().toLocaleDateString();
    this.ctx.fillText(date, width / 2, height - 10);
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  private save(): void {
    this.ctx.save();
  }

  private restore(): void {
    this.ctx.restore();
  }

  private drawImage(img: HTMLImageElement, x: number, y: number, width: number, height: number): void {
    this.ctx.drawImage(img, x, y, width, height);
  }
}
