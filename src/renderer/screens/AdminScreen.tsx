import React, { useState } from 'react';
import { getAllDesignTemplates, saveDesignTemplate, DesignTemplateConfig } from '../../shared/templates';
import { TemplateEngine } from '../../shared/services/TemplateEngine';
import type { PhotoLayout } from '../../shared/types';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

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

  const [lockAspectRatio, setLockAspectRatio] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [printPreview, setPrintPreview] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  const templateEngine = new TemplateEngine();

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const generatePrintPreview = async () => {
    if (!selectedTemplate) {
      addNotification('No template selected for preview', 'error');
      return;
    }

    try {
      // Generate sample photos (use placeholder images)
      const samplePhotos = Array(selectedTemplate.slots.length).fill(null).map((_, index) => {
        // Create a simple colored rectangle as a placeholder photo
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 400;
        const ctx = canvas.getContext('2d')!;
        
        // Different colors for each slot
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(0, 0, 300, 400);
        
        // Add slot number
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${index + 1}`, 150, 200);
        
        return canvas.toDataURL();
      });

      const composedImage = await templateEngine.composePhotos(
        samplePhotos,
        selectedTemplate.templateType,
        { designTemplate: selectedTemplate }
      );

      setPrintPreview(composedImage);
      setShowPrintPreview(true);
      addNotification('Print preview generated', 'success');
    } catch (error) {
      addNotification('Failed to generate print preview', 'error');
      console.error('Print preview error:', error);
    }
  };

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
    // Only update local slots first, don't touch templates yet
    const updatedSlots = slots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot));
    setSlots(updatedSlots);
    
    // DON'T update templates immediately - this was causing the reset
    // We'll update templates only when user explicitly saves
  };

  const addSlot = () => {
    setSlots(prev => [
      ...prev,
      { x: 50, y: 50, width: 200, height: 300 },
    ]);
    addNotification('New slot added', 'info');
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 1) {
      addNotification('Cannot remove the last slot', 'error');
      return;
    }
    setSlots(prev => prev.filter((_, i) => i !== index));
    addNotification('Slot removed', 'info');
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) {
      addNotification('No template selected', 'error');
      return;
    }
    try {
      const updated: DesignTemplateConfig = {
        ...selectedTemplate,
        slots: slots,
      };
      const updatedList = templates.map(t => (t.id === selectedTemplate.id ? updated : t));
      setTemplates(updatedList);
      saveTemplates(updatedList);
      addNotification(`Template "${updated.name}" saved successfully!`, 'success');
    } catch (error) {
      addNotification('Failed to save template', 'error');
      console.error('Save template error:', error);
    }
  };

  const handleCreateTemplate = () => {
    try {
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
      addNotification('New template created successfully!', 'success');
    } catch (error) {
      addNotification('Failed to create template', 'error');
      console.error('Create template error:', error);
    }
  };

  const handleSaveSettings = () => {
    try {
      // Here you would typically save settings to localStorage or a backend
      localStorage.setItem('photobooth_settings', JSON.stringify(settings));
      addNotification('Settings saved successfully!', 'success');
    } catch (error) {
      addNotification('Failed to save settings', 'error');
      console.error('Save settings error:', error);
    }
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const previewWidth = 600;
  const scale = (imageSize.width > 0 && imageSize.width > 0) ? previewWidth / imageSize.width : 1;

  const beginDrag = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const startX = event.pageX;
    const startY = event.pageY;
    const startSlot = slots[index];

    const handleMove = (e: MouseEvent) => {
      // Try both clientX and pageX to see which works
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;
      
      if (Math.abs(dx) > 0) {
        updateSlot(index, 'x', startSlot.x + dx);
      }
      
      if (Math.abs(dy) > 0) {
        updateSlot(index, 'y', startSlot.y + dy);
      }
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
    console.log('Resize started for slot', index);
    
    const startX = event.clientX;
    const startY = event.clientY;
    const startSlot = slots[index];
    const aspectRatio = startSlot.width / startSlot.height;

    const handleMove = (e: MouseEvent) => {
      // Remove scale completely for testing - use raw pixel movement
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      console.log('=== RAW RESIZE TEST ===');
      console.log('dx:', dx, 'dy:', dy);
      console.log('aspectRatio:', aspectRatio, 'lockAspectRatio:', lockAspectRatio);
      
      if (lockAspectRatio) {
        // Use the larger delta to maintain aspect ratio
        const delta = Math.max(dx, dy);
        const newWidth = Math.max(10, startSlot.width + delta);
        const newHeight = newWidth / aspectRatio;
        console.log('Locked resize - newWidth:', newWidth, 'newHeight:', newHeight);
        updateSlot(index, 'width', newWidth);
        updateSlot(index, 'height', newHeight);
      } else {
        const newWidth = Math.max(10, startSlot.width + dx);
        const newHeight = Math.max(10, startSlot.height + dy);
        console.log('Free resize - newWidth:', newWidth, 'newHeight:', newHeight);
        updateSlot(index, 'width', newWidth);
        updateSlot(index, 'height', newHeight);
      }
    };

    const handleUp = () => {
      console.log('Resize ended');
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div className="screen">
      <h1>Admin Dashboard</h1>

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
                      const updatedList = templates.map(t => (t.id === selectedTemplate.id ? updated : t));
                      setTemplates(updatedList);
                      setSelectedTemplateId(updated.id);
                      saveTemplates(updatedList);
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
                      const updatedList = templates.map(t => (t.id === selectedTemplate.id ? updated : t));
                      setTemplates(updatedList);
                      setSelectedTemplateId(updated.id);
                      saveTemplates(updatedList);
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
                      const updatedList = templates.map(t => (t.id === selectedTemplate.id ? updated : t));
                      setTemplates(updatedList);
                      setSelectedTemplateId(updated.id);
                      saveTemplates(updatedList);
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
                      const updatedList = templates.map(t => (t.id === selectedTemplate.id ? updated : t));
                      setTemplates(updatedList);
                      setSelectedTemplateId(updated.id);
                      saveTemplates(updatedList);
                    }}
                    className="admin-input"
                  >
                    <option value="strip">Strip</option>
                    <option value="single">Single</option>
                    <option value="collage">Collage</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={lockAspectRatio}
                      onChange={(e) => setLockAspectRatio(e.target.checked)}
                    />
                    Lock Aspect Ratio When Resizing
                  </label>
                </div>
                <div className="setting-item">
                  <label>Slots ({selectedTemplate.slots.length}):</label>
                  <div className="slots-editor">
                    {selectedTemplate.slots.map((slot, i) => (
                      <div key={i} className="slot-row">
                        <div className="slot-label">Slot {i + 1}:</div>
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
              <button className="button secondary" onClick={generatePrintPreview}>
                🖼️ Print Preview
              </button>
            </div>
            {selectedTemplate && (
              <div className="template-preview">
                <label>Preview:</label>
                <div className="preview-container" style={{ position: 'relative' }}>
                  {/* Slot colors BEHIND the template image */}
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: previewWidth, 
                    height: imageSize.height * scale,
                    pointerEvents: 'none' // Don't capture mouse events
                  }}>
                    {slots.map((slot, i) => (
                      <div
                        key={`slot-color-${i}`}
                        style={{
                          position: 'absolute',
                          left: `${slot.x * scale}px`,
                          top: `${slot.y * scale}px`,
                          width: `${slot.width * scale}px`,
                          height: `${slot.height * scale}px`,
                          background: 'rgba(255, 255, 0, 0.3)', // Yellow background
                          border: '2px solid rgba(255, 0, 0, 0.5)', // Red border
                          boxSizing: 'border-box'
                        }}
                      />
                    ))}
                  </div>
                  
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
                  {/* Interactive overlays - restore proper scaling */}
                  {slots.map((slot, i) => (
                    <div
                      key={i}
                      className="slot-overlay"
                      style={{
                        position: 'absolute',
                        left: `${slot.x * scale}px`, // Restore scale
                        top: `${slot.y * scale}px`, // Restore scale
                        width: `${slot.width * scale}px`, // Restore scale
                        height: `${slot.height * scale}px`, // Restore scale
                        cursor: 'move',
                        border: '2px solid transparent', // Transparent border
                        boxSizing: 'border-box',
                        background: 'transparent', // Transparent background
                        zIndex: 10
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        
                        // Drag with proper scaling
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startSlotX = slots[i].x;
                        const startSlotY = slots[i].y;
                        
                        let lastUpdateTime = 0;
                        const updateDelay = 16; // ~60fps
                        
                        const handleSimpleMove = (moveEvent: any) => {
                          const now = Date.now();
                          if (now - lastUpdateTime < updateDelay) return; // Debounce
                          lastUpdateTime = now;
                          
                          const deltaX = (moveEvent.clientX - startX) / scale; // Apply scale
                          const deltaY = (moveEvent.clientY - startY) / scale; // Apply scale
                          
                          // Update both X and Y together to reduce re-renders
                          if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                            const newX = startSlotX + deltaX;
                            const newY = startSlotY + deltaY;
                            
                            // Batch update both X and Y
                            const updatedSlots = slots.map((slot, index) => 
                              index === i ? { ...slot, x: newX, y: newY } : slot
                            );
                            setSlots(updatedSlots);
                          }
                        };
                        
                        const handleSimpleUp = () => {
                          window.removeEventListener('mousemove', handleSimpleMove);
                          window.removeEventListener('mouseup', handleSimpleUp);
                        };
                        
                        window.addEventListener('mousemove', handleSimpleMove);
                        window.addEventListener('mouseup', handleSimpleUp);
                      }}
                    >
                      <div style={{ padding: '5px', color: 'black', fontSize: '12px' }}>
                        Slot {i + 1}
                      </div>
                      <div
                        className="resize-handle"
                        style={{
                          position: 'absolute',
                          right: '-4px',
                          bottom: '-4px',
                          width: '12px',
                          height: '12px',
                          background: '#ff6b6b',
                          border: '2px solid white',
                          borderRadius: '50%',
                          cursor: 'nwse-resize'
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startSlot = slots[i];
                          const aspectRatio = startSlot.width / startSlot.height;
                          
                          let lastUpdateTime = 0;
                          const updateDelay = 16; // ~60fps
                          
                          const handleResizeMove = (moveEvent: any) => {
                            const now = Date.now();
                            if (now - lastUpdateTime < updateDelay) return;
                            lastUpdateTime = now;
                            
                            const deltaX = (moveEvent.clientX - startX) / scale; // Apply scale
                            const deltaY = (moveEvent.clientY - startY) / scale; // Apply scale
                            
                            if (lockAspectRatio) {
                              const delta = Math.max(deltaX, deltaY);
                              const newWidth = Math.max(10, startSlot.width + delta);
                              const newHeight = newWidth / aspectRatio;
                              
                              const updatedSlots = slots.map((slot, index) => 
                                index === i ? { ...slot, width: newWidth, height: newHeight } : slot
                              );
                              setSlots(updatedSlots);
                            } else {
                              const newWidth = Math.max(10, startSlot.width + deltaX);
                              const newHeight = Math.max(10, startSlot.height + deltaY);
                              
                              const updatedSlots = slots.map((slot, index) => 
                                index === i ? { ...slot, width: newWidth, height: newHeight } : slot
                              );
                              setSlots(updatedSlots);
                            }
                          };
                          
                          const handleResizeUp = () => {
                            window.removeEventListener('mousemove', handleResizeMove);
                            window.removeEventListener('mouseup', handleResizeUp);
                          };
                          
                          window.addEventListener('mousemove', handleResizeMove);
                          window.addEventListener('mouseup', handleResizeUp);
                        }}
                      />
                    </div>
                  ))}
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
        <button className="button primary" onClick={handleSaveSettings}>
          Save Settings
        </button>
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && printPreview && (
        <div className="modal-overlay" onClick={() => setShowPrintPreview(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Print Preview - {selectedTemplate?.name}</h3>
              <button className="modal-close" onClick={() => setShowPrintPreview(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="print-preview-container">
                <img 
                  src={printPreview} 
                  alt="Print Preview" 
                  className="print-preview-image"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="button secondary" onClick={() => setShowPrintPreview(false)}>
                Close
              </button>
              <button 
                className="button primary" 
                onClick={() => {
                  // Print the image
                  const link = document.createElement('a');
                  link.download = `template-preview-${selectedTemplate?.name}.jpg`;
                  link.href = printPreview;
                  link.click();
                  addNotification('Preview image downloaded', 'success');
                }}
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type}`}
          >
            <span className="notification-message">{notification.message}</span>
            <button 
              className="notification-close"
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminScreen;
