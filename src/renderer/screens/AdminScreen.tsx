import React, { useState } from 'react';
import { getAllDesignTemplates, saveDesignTemplate, DesignTemplateConfig } from '../../shared/templates';
import type { PhotoLayout } from '../../shared/types';

interface AdminScreenProps {
  onBack: () => void;
}

interface Settings {
  eventName: string;
  photoCount: number;
  defaultTemplate: string;
  printEnabled: boolean;
  emailEnabled: boolean;
  brandingText: string;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<Settings>({
    eventName: 'PhotoBooth Event',
    photoCount: 3,
    defaultTemplate: 'strip',
    printEnabled: true,
    emailEnabled: true,
    brandingText: 'PhotoBooth'
  });

  const [sessions, setSessions] = useState([
    { id: '1', time: '2024-01-15 14:30', photos: 3, delivery: 'print' },
    { id: '2', time: '2024-01-15 14:25', photos: 4, delivery: 'email' },
    { id: '3', time: '2024-01-15 14:20', photos: 2, delivery: 'save' },
  ]);

  const loadTemplates = () => {
    const saved = localStorage.getItem('photobooth_templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getAllDesignTemplates();
      }
    }
    return getAllDesignTemplates();
  };

  const saveTemplates = (templates: DesignTemplateConfig[]) => {
    localStorage.setItem('photobooth_templates', JSON.stringify(templates));
  };

  const [templates, setTemplates] = useState<DesignTemplateConfig[]>(loadTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [slots, setSlots] = useState<PhotoLayout[]>(templates[0]?.slots || []);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find(t => t.id === id);
    if (tpl) {
      setSlots(tpl.slots.map(s => ({ ...s })));
      setImageSize({ width: 0, height: 0 }); // Reset to trigger reload
    }
  };

  const updateSlot = (index: number, field: keyof PhotoLayout, value: number) => {
    setSlots(prev => prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)));
  };

  const addSlot = () => {
    setSlots(prev => [
      ...prev,
      { x: 50, y: 50, width: 200, height: 300 },
    ]);
  };

  const removeSlot = (index: number) => {
    setSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    const updated: DesignTemplateConfig = {
      ...selectedTemplate,
      slots: slots,
    };
    const updatedList = templates.map(t => (t.id === selectedTemplate.id ? updated : t));
    setTemplates(updatedList);
    saveTemplates(updatedList);
  };

  const handleCreateTemplate = () => {
    const newId = `custom_${Date.now()}`;
    const newTemplate: DesignTemplateConfig = {
      id: newId,
      name: 'New Template',
      description: '',
      templateType: 'strip',
      backgroundUrl: '/templates/default.png',
      slots: [{ x: 70, y: 140, width: 460, height: 340 }],
    };
    const updatedList = [...templates, newTemplate];
    setTemplates(updatedList);
    saveTemplates(updatedList);
    setSelectedTemplateId(newId);
    setSlots(newTemplate.slots);
    setImageSize({ width: 0, height: 0 }); // Reset to trigger reload
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const previewWidth = 400;
  const scale = imageSize.width > 0 ? previewWidth / imageSize.width : 1;

  const beginDrag = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startSlot = slots[index];

    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - startX) / scale;
      const dy = (e.clientY - startY) / scale;
      updateSlot(index, 'x', startSlot.x + dx);
      updateSlot(index, 'y', startSlot.y + dy);
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const beginResize = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startSlot = slots[index];

    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - startX) / scale;
      const dy = (e.clientY - startY) / scale;
      updateSlot(index, 'width', Math.max(10, startSlot.width + dx));
      updateSlot(index, 'height', Math.max(10, startSlot.height + dy));
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div className="screen">
      <h1 className="title">Admin Dashboard</h1>
      
      <div className="admin-content">
        <div className="admin-section">
          <h2>Event Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Event Name:</label>
              <input
                type="text"
                value={settings.eventName}
                onChange={(e) => updateSetting('eventName', e.target.value)}
                className="admin-input"
              />
            </div>
            <div className="setting-item">
              <label>Default Photo Count:</label>
              <select
                value={settings.photoCount}
                onChange={(e) => updateSetting('photoCount', parseInt(e.target.value))}
                className="admin-input"
              >
                <option value={1}>1 Photo</option>
                <option value={2}>2 Photos</option>
                <option value={3}>3 Photos</option>
                <option value={4}>4 Photos</option>
              </select>
            </div>
            <div className="setting-item">
              <label>Default Template:</label>
              <select
                value={settings.defaultTemplate}
                onChange={(e) => updateSetting('defaultTemplate', e.target.value)}
                className="admin-input"
              >
                <option value="strip">Photo Strip</option>
                <option value="collage">Collage</option>
                <option value="single">Single</option>
              </select>
            </div>
            <div className="setting-item">
              <label>Branding Text:</label>
              <input
                type="text"
                value={settings.brandingText}
                onChange={(e) => updateSetting('brandingText', e.target.value)}
                className="admin-input"
              />
            </div>
          </div>
        </div>

        <div className="admin-section">
          <h2>Template Manager</h2>
          <div className="template-manager-grid">
            <div className="setting-item">
              <label>Select Template:</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="admin-input"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.templateType})
                  </option>
                ))}
              </select>
            </div>
            {selectedTemplate && (
              <>
                <div className="setting-item">
                  <label>Template Name:</label>
                  <input
                    type="text"
                    value={selectedTemplate.name}
                    onChange={(e) => {
                      const updated = { ...selectedTemplate, name: e.target.value };
                      setTemplates(templates.map(t => (t.id === selectedTemplate.id ? updated : t)));
                      setSelectedTemplateId(updated.id);
                    }}
                    className="admin-input"
                  />
                </div>
                <div className="setting-item">
                  <label>Description:</label>
                  <textarea
                    value={selectedTemplate.description}
                    onChange={(e) => {
                      const updated = { ...selectedTemplate, description: e.target.value };
                      setTemplates(templates.map(t => (t.id === selectedTemplate.id ? updated : t)));
                      setSelectedTemplateId(updated.id);
                    }}
                    className="admin-input"
                    rows={3}
                  />
                </div>
                <div className="setting-item">
                  <label>Background URL:</label>
                  <input
                    type="text"
                    value={selectedTemplate.backgroundUrl}
                    onChange={(e) => {
                      const updated = { ...selectedTemplate, backgroundUrl: e.target.value };
                      setTemplates(templates.map(t => (t.id === selectedTemplate.id ? updated : t)));
                      setSelectedTemplateId(updated.id);
                    }}
                    className="admin-input"
                  />
                </div>
                <div className="setting-item">
                  <label>Template Type:</label>
                  <select
                    value={selectedTemplate.templateType}
                    onChange={(e) => {
                      const updated = { ...selectedTemplate, templateType: e.target.value as any };
                      setTemplates(templates.map(t => (t.id === selectedTemplate.id ? updated : t)));
                      setSelectedTemplateId(updated.id);
                    }}
                    className="admin-input"
                  >
                    <option value="strip">Strip</option>
                    <option value="single">Single</option>
                    <option value="collage">Collage</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Slots ({selectedTemplate.slots.length}):</label>
                  <div className="slots-editor">
                    {selectedTemplate.slots.map((slot, i) => (
                      <div key={i} className="slot-row">
                        <input
                          type="number"
                          placeholder="X"
                          value={slot.x}
                          onChange={(v) => updateSlot(i, 'x', parseInt(v.target.value) || 0)}
                          className="admin-input small"
                        />
                        <input
                          type="number"
                          placeholder="Y"
                          value={slot.y}
                          onChange={(v) => updateSlot(i, 'y', parseInt(v.target.value) || 0)}
                          className="admin-input small"
                        />
                        <input
                          type="number"
                          placeholder="W"
                          value={slot.width}
                          onChange={(v) => updateSlot(i, 'width', parseInt(v.target.value) || 0)}
                          className="admin-input small"
                        />
                        <input
                          type="number"
                          placeholder="H"
                          value={slot.height}
                          onChange={(v) => updateSlot(i, 'height', parseInt(v.target.value) || 0)}
                          className="admin-input small"
                        />
                        <button className="button secondary" onClick={() => removeSlot(i)}>Remove</button>
                      </div>
                    ))}
                    <button className="button secondary" onClick={addSlot}>Add Slot</button>
                  </div>
                </div>
              </>
            )}
            <div className="setting-item">
              <button className="button primary" onClick={handleSaveTemplate}>
                Save Template
              </button>
              <button className="button secondary" onClick={handleCreateTemplate}>
                Create New Template
              </button>
            </div>
            {selectedTemplate && (
              <div className="template-preview">
                <label>Preview:</label>
                <div className="preview-container">
                  <img
                    src={selectedTemplate.backgroundUrl}
                    alt={selectedTemplate.name}
                    onLoad={handleImageLoad}
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.style.display = 'none';
                      // Show fallback message
                      const container = img.parentElement;
                      if (container && !container.querySelector('.preview-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'preview-fallback';
                        fallback.textContent = 'Image not found';
                        container.appendChild(fallback);
                      }
                    }}
                    style={{ width: previewWidth }}
                  />
                  <svg
                    width={previewWidth}
                    height={imageSize.height > 0 ? imageSize.height * scale : 400}
                    style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                  >
                    {slots.map((slot, i) => (
                      <rect
                        key={i}
                        x={slot.x * scale}
                        y={slot.y * scale}
                        width={slot.width * scale}
                        height={slot.height * scale}
                        fill="rgba(255, 0, 0, 0.3)"
                        stroke="red"
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="admin-section">
          <h2>Delivery Options</h2>
          <div className="checkbox-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={settings.printEnabled}
                onChange={(e) => updateSetting('printEnabled', e.target.checked)}
              />
              Enable Printing
            </label>
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(e) => updateSetting('emailEnabled', e.target.checked)}
              />
              Enable Email
            </label>
          </div>
        </div>

        <div className="admin-section">
          <h2>Recent Sessions</h2>
          <div className="sessions-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Photos</th>
                  <th>Delivery</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id}>
                    <td>{session.time}</td>
                    <td>{session.photos}</td>
                    <td>{session.delivery}</td>
                    <td>
                      <button className="button-small">View</button>
                      <button className="button-small">Reprint</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="controls">
        <button className="button" onClick={onBack}>
          Back to Booth
        </button>
        <button className="button primary" onClick={() => console.log('Settings saved')}>
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default AdminScreen;
