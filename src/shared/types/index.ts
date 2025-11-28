export interface PhotoSession {
  id: string;
  photos: string[];
  template: TemplateType;
  photoCount: number;
  timestamp: Date;
}

export type TemplateType = 'strip' | 'collage' | 'single';

export interface TemplateConfig {
  id: string;
  name: string;
  type: TemplateType;
  width: number;
  height: number;
  layout: PhotoLayout[];
}

export interface PhotoLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface DeliveryOptions {
  type: 'print' | 'email' | 'save' | 'qr';
  email?: string;
  copies?: number;
}
