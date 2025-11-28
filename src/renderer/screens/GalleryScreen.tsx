import React, { useState, useEffect } from 'react';
import { PrintService } from '../../shared/services/PrintService';

interface GalleryItem {
  id: string;
  type: 'individual' | 'composed';
  dataUrl: string;
  timestamp: number;
  sessionId?: string;
  designTemplateId?: string;
  designTemplateName?: string; // human‑readable name for folder grouping
}

interface GalleryScreenProps {
  onBack: () => void;
}

const GalleryScreen: React.FC<GalleryScreenProps> = ({ onBack }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'individual' | 'composed'>('all');
  const [selectedTemplateFolder, setSelectedTemplateFolder] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('photobooth_gallery_v1');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to load gallery from localStorage', e);
      }
    }
  }, []);

  const saveToStorage = (newItems: GalleryItem[]) => {
    localStorage.setItem('photobooth_gallery_v1', JSON.stringify(newItems));
  };

  const handleDelete = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    saveToStorage(newItems);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const handleSelect = (item: GalleryItem) => {
    setSelectedItem(item);
  };

  const handlePrint = async () => {
    if (!selectedItem) return;
    try {
      const printService = new PrintService();
      await printService.printPhotos([selectedItem.dataUrl], 'single');
    } catch (e) {
      console.error('Print failed', e);
    }
  };

  const filteredItems = items.filter(item => {
    if (viewMode !== 'all' && item.type !== viewMode) return false;
    if (selectedTemplateFolder && item.designTemplateName !== selectedTemplateFolder) return false;
    return true;
  });

  const templateFolders = Array.from(new Set(items.map(item => item.designTemplateName).filter(Boolean)));

  return (
    <div className="screen gallery-screen">
      <div className="gallery-header">
        <h1 className="title">Gallery</h1>
        <div className="gallery-controls">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="gallery-filter"
          >
            <option value="all">All</option>
            <option value="individual">Individual Shots</option>
            <option value="composed">Composed Strips</option>
          </select>
          <select
            value={selectedTemplateFolder || ''}
            onChange={(e) => setSelectedTemplateFolder(e.target.value || null)}
            className="gallery-filter"
          >
            <option value="">All Templates</option>
            {templateFolders.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="gallery-content">
        <div className="gallery-grid">
          {filteredItems.length === 0 ? (
            <div className="gallery-empty">
              <p>No photos yet. Start a session to capture memories!</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className={`gallery-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                onClick={() => handleSelect(item)}
              >
                <img src={item.dataUrl} alt={item.type} />
                <div className="gallery-item-meta">
                  <span className="gallery-item-type">
                    {item.type === 'individual' ? '📸' : '🖼️'}
                  </span>
                  <span className="gallery-item-date">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedItem && (
          <div className="gallery-preview">
            <div className="preview-image">
              <img src={selectedItem.dataUrl} alt="Preview" />
            </div>
            <div className="preview-meta">
              <p>
                {selectedItem.type === 'individual' ? 'Individual Shot' : 'Composed Strip'}
              </p>
              <p>{new Date(selectedItem.timestamp).toLocaleString()}</p>
            </div>
            <div className="preview-actions">
              <button className="button secondary" onClick={() => handleDelete(selectedItem.id)}>
                🗑️ Delete
              </button>
              <button className="button primary" onClick={handlePrint}>
                🖨️ Print
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="controls">
        <button className="button" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
};

export default GalleryScreen;
