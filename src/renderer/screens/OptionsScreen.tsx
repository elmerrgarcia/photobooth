import React, { useState, useEffect } from 'react';
import { getAllDesignTemplates, getLastSelectedDesignTemplateId, saveLastSelectedDesignTemplateId, DesignTemplateConfig } from '../../shared/templates';

interface OptionsScreenProps {
  onBack: () => void;
  onStart: (designTemplateId: string | null, cameraDeviceId: string | null) => void;
}

const OptionsScreen: React.FC<OptionsScreenProps> = ({ onBack, onStart }) => {
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(() => {
    return localStorage.getItem('photobooth_last_camera_device_id') || null;
  });
  const [designTemplateId, setDesignTemplateId] = useState<string | null>(
    getLastSelectedDesignTemplateId()
  );
  const loadTemplates = (): DesignTemplateConfig[] => {
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

  const allDesigns = loadTemplates();

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      setCameraDevices(cameras);
      if (cameras.length > 0 && !selectedCameraId) {
        setSelectedCameraId(cameras[0].deviceId);
      } else if (cameras.length > 0 && selectedCameraId && !cameras.find(c => c.deviceId === selectedCameraId)) {
        // If previously selected camera no longer exists, fall back to first available
        setSelectedCameraId(cameras[0].deviceId);
      }
    } catch (e) {
      console.warn('Unable to enumerate camera devices', e);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const refreshCameraList = async () => {
    await loadDevices();
  };

  const handleCameraSelect = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    localStorage.setItem('photobooth_last_camera_device_id', deviceId);
  };

  return (
    <div className="screen">
      <div className="options-grid">
        <div className="option-section">
          <h2>Design Template</h2>
          <div className="template-grid">
            {allDesigns.map(design => (
              <div
                key={design.id}
                className={`template-card ${designTemplateId === design.id ? 'selected' : ''}`}
                onClick={() => setDesignTemplateId(design.id)}
              >
                <img
                  src={design.backgroundUrl}
                  alt={design.name}
                  className="template-thumbnail"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="template-info">
                  <div className="template-name">{design.name}</div>
                  <div className="template-description">{design.description}</div>
                  <div className="template-shots">{design.slots.length} shot{design.slots.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
            {allDesigns.length === 0 && (
              <div className="option-description">
                No design templates available. Add some PNGs to /public/templates and register them in shared/templates.ts.
              </div>
            )}
          </div>
        </div>

        <div className="option-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Camera</h2>
            <button className="button secondary" onClick={refreshCameraList}>
              🔄 Refresh
            </button>
          </div>
          <div className="options-grid">
            {cameraDevices.length === 0 ? (
              <div className="option-description">No cameras found. Please check permissions.</div>
            ) : (
              cameraDevices.map(device => (
                <div
                  key={device.deviceId}
                  className={`option-card ${selectedCameraId === device.deviceId ? 'selected' : ''}`}
                  onClick={() => handleCameraSelect(device.deviceId)}
                >
                  <div className="option-title">{device.label || `Camera ${device.deviceId.slice(0, 6)}...`}</div>
                  <div className="option-description">Video input device</div>
                </div>
              ))
            )}
          </div>
          <details className="camera-help">
            <summary>Which cameras work?</summary>
            <div className="camera-help-content">
              <p><strong>DSLR/Mirrorless</strong> (via HDMI capture card or USB video adapter):</p>
              <ul>
                <li>Nikon: D750, D850, Z6, Z7, Z9, and most recent models with clean HDMI out.</li>
                <li>Canon: EOS R5/R6/R7, 5D Mark IV, 6D Mark II, R3, R10, and most recent EOS models.</li>
                <li>Sony: A7 III/IV, A9, A6400/A6600, ZV-E10, FX3, with clean HDMI out.</li>
                <li>Fujifilm: X-T4/T5, X-H2S, GFX series with clean HDMI out.</li>
                <li>Panasonic: GH5/GH6, S5/S5II, G9, with clean HDMI out.</li>
                <li>Olympus/OM System: OM-1, E-M1 Mark III, with clean HDMI out.</li>
              </ul>
              <p><strong>Webcams/USB</strong> (directly recognized):</p>
              <ul>
                <li>Logitech: C920, C922, StreamCam, Brio.</li>
                <li>Razer: Kiyo, Kiyo Pro.</li>
                <li>Elgato: Cam Link 4K (used with the above DSLRs).</li>
                <li>Any UVC webcam on macOS.</li>
              </ul>
              <p><strong>How to connect</strong></p>
              <ul>
                <li>HDMI → Capture Card (Elgato Cam Link, Magewell, etc.) → USB/Thunderbolt → Mac.</li>
                <li>Some cameras support direct USB video output (rare; check your model).</li>
                <li>After connecting, click Refresh or restart the app to see the new device.</li>
              </ul>
            </div>
          </details>
        </div>
      </div>

      <div className="controls">
        <button className="button" onClick={onBack}>
          Back
        </button>
        <button
          className="button primary"
          onClick={() => {
            if (designTemplateId) {
              saveLastSelectedDesignTemplateId(designTemplateId);
            }
            onStart(designTemplateId, selectedCameraId);
          }}
        >
          Start Session
        </button>
      </div>
    </div>
  );
};

export default OptionsScreen;
