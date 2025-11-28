import { TemplateType, PhotoLayout } from './types';

export interface DesignTemplateConfig {
  id: string;
  name: string;
  description: string;
  templateType: TemplateType;
  backgroundUrl: string;
  slots: PhotoLayout[];
}

export const DESIGN_TEMPLATES: DesignTemplateConfig[] = [
  {
    id: 'classic_strip',
    name: 'Classic Photo Strip',
    description: 'Clean white strip with three vertical photos',
    templateType: 'strip',
    backgroundUrl: '/templates/classic-strip.png',
    slots: [
      { x: 70, y: 140, width: 460, height: 340 },
      { x: 70, y: 520, width: 460, height: 340 },
      { x: 70, y: 900, width: 460, height: 340 }
    ]
  },
  {
    id: 'gold_frame',
    name: 'Gold Frame',
    description: 'Single large photo with gold border and space for branding',
    templateType: 'single',
    backgroundUrl: '/templates/gold-frame.png',
    slots: [
      { x: 80, y: 160, width: 440, height: 620 }
    ]
  }
  
];

export function getDesignTemplateById(id?: string | null): DesignTemplateConfig | undefined {
  if (!id) return undefined;
  return DESIGN_TEMPLATES.find(t => t.id === id);
}

const TEMPLATE_STORAGE_KEY = 'photobooth_design_templates_v1';
const LAST_TEMPLATE_ID_KEY = 'photobooth_last_design_template_id';

function loadUserTemplates(): DesignTemplateConfig[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as DesignTemplateConfig[];
  } catch {
    return [];
  }
}

export function saveLastSelectedDesignTemplateId(id: string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    if (id) {
      window.localStorage.setItem(LAST_TEMPLATE_ID_KEY, id);
    } else {
      window.localStorage.removeItem(LAST_TEMPLATE_ID_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function getLastSelectedDesignTemplateId(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    return window.localStorage.getItem(LAST_TEMPLATE_ID_KEY);
  } catch {
    return null;
  }
}

function saveUserTemplates(templates: DesignTemplateConfig[]): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // ignore storage errors
  }
}

export function saveDesignTemplate(template: DesignTemplateConfig): void {
  const existing = loadUserTemplates();
  const index = existing.findIndex(t => t.id === template.id);
  if (index >= 0) {
    existing[index] = template;
  } else {
    existing.push(template);
  }
  saveUserTemplates(existing);
}

export function getAllDesignTemplates(): DesignTemplateConfig[] {
  const userTemplates = loadUserTemplates();
  const baseById = new Map<string, DesignTemplateConfig>();

  for (const t of DESIGN_TEMPLATES) {
    baseById.set(t.id, t);
  }

  for (const ut of userTemplates) {
    baseById.set(ut.id, ut);
  }

  return Array.from(baseById.values());
}
