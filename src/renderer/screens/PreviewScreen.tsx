import React, { useState, useEffect } from 'react';
import CameraPreview from '../components/CameraPreview';
import { PrintService } from '../../shared/services/PrintService';
import { TemplateEngine } from '../../shared/services/TemplateEngine';
import { getDesignTemplateById } from '../../shared/templates';

interface PreviewScreenProps {
  photoCount: number;
  designTemplateId?: string | null;
  cameraDeviceId?: string | null;
  onComplete: (photos: string[]) => void;
  onCancel: () => void;
  onBack: () => void;
}

const PreviewScreen: React.FC<PreviewScreenProps> = ({
  photoCount,
  designTemplateId,
  cameraDeviceId,
  onComplete,
  onBack,
  onCancel
}) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState('Get ready for your first shot!');
  const [showFinalShot, setShowFinalShot] = useState(false);
  const [finalImage, setFinalImage] = useState<string>('');

  useEffect(() => {
    if (isCountingDown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isCountingDown && countdown === 0) {
      capturePhoto();
    }
  }, [isCountingDown, countdown]);

  const startCapture = () => {
    setIsCountingDown(true);
    setCountdown(3);
    const shotNumber = currentPhoto + 1;
    setStatusMessage(`${getOrdinal(shotNumber)} shot! Get ready...`);
  };

  const capturePhoto = (imageData?: string) => {
    if (imageData) {
      const newPhotos = [...photos, imageData];
      setPhotos(newPhotos);
      setShowPreview(true);
      setIsCountingDown(false);
      setStatusMessage('Review your photo. You can retake or accept.');

      if (newPhotos.length >= photoCount) {
        setTimeout(() => {
          onComplete(newPhotos);
        }, 2000);
      }
    }
  };

  const retakePhoto = () => {
    setPhotos(photos.slice(0, -1));
    setShowPreview(false);
    setCurrentPhoto(Math.max(0, currentPhoto - 1));
  };

  const acceptPhoto = () => {
    setShowPreview(false);
    // Save individual photo to gallery with template name
    const designTemplate = getDesignTemplateById(designTemplateId || undefined);
    const galleryItem = {
      id: `individual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'individual' as const,
      dataUrl: photos[photos.length - 1],
      timestamp: Date.now(),
      designTemplateId,
      designTemplateName: designTemplate?.name || null,
    };
    const existing = JSON.parse(localStorage.getItem('photobooth_gallery_v1') || '[]');
    const updated = [...existing, galleryItem];
    localStorage.setItem('photobooth_gallery_v1', JSON.stringify(updated));

    if (photos.length < photoCount) {
      setCurrentPhoto(currentPhoto + 1);
      setTimeout(() => startCapture(), 1000);
      const nextShotNumber = photos.length + 1;
      setStatusMessage(`Great! Get ready for the ${getOrdinal(nextShotNumber)} shot.`);
    } else {
      setStatusMessage('All photos captured! Preparing your final strip...');
      // Compose immediately and show final shot screen
      composeAndShowFinalShot();
    }
  };

  const composeAndShowFinalShot = async () => {
    try {
      const templateEngine = new TemplateEngine();
      const designTemplate = getDesignTemplateById(designTemplateId || undefined);
      const composed = await templateEngine.composePhotos(photos, 'strip', {
        designTemplate,
      });
      setFinalImage(composed);
      // Save composed strip to gallery with template name
      const galleryItem = {
        id: `composed-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: 'composed' as const,
        dataUrl: composed,
        timestamp: Date.now(),
        sessionId: Date.now().toString(),
        designTemplateId,
        designTemplateName: designTemplate?.name || null,
      };
      const existing = JSON.parse(localStorage.getItem('photobooth_gallery_v1') || '[]');
      const updated = [...existing, galleryItem];
      localStorage.setItem('photobooth_gallery_v1', JSON.stringify(updated));
      setShowFinalShot(true);
    } catch (e) {
      console.error('Failed to compose final shot', e);
      // Fallback: just go to Delivery
      onComplete(photos);
    }
  };

  const handlePrintFinalShot = async () => {
    try {
      // Use PrintService to print the finalImage
      const printService = new PrintService();
      await printService.printPhotos([finalImage], 'single');
      // After printing, proceed to Delivery
      onComplete(photos);
    } catch (e) {
      console.error('Print failed', e);
      // Still proceed to Delivery even if print fails
      onComplete(photos);
    }
  };

  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const handleCapture = (imageData: string) => {
    capturePhoto(imageData);
  };

  return (
    <div className="screen camera-screen">
      {statusMessage && (
        <div className="status-message">
          {statusMessage}
        </div>
      )}
      <div className="session-actions">
        <button className="button" onClick={onCancel}>
          Cancel Session
        </button>
      </div>

      {showFinalShot && (
        <div className="final-shot-overlay">
          <div className="final-shot-content">
            <h2 className="final-shot-title">Final Shot</h2>
            <div className="final-shot-image">
              <img src={finalImage} alt="Final Shot" />
            </div>
            <div className="final-shot-actions">
              <button className="button large primary" onClick={handlePrintFinalShot}>
                🖨️ Print Final Shot Now
              </button>
              <button className="button large" onClick={() => onComplete(photos)}>
                Continue to Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="camera-container">
        <CameraPreview
          onCapture={handleCapture}
          isActive={!showPreview && !showFinalShot}
          deviceId={cameraDeviceId}
        />
        
        {isCountingDown && (
          <div className="countdown-overlay">
            {countdown}
          </div>
        )}

        {showPreview && photos.length > 0 && (
          <div className="preview-overlay">
            <img src={photos[photos.length - 1]} alt="Preview" className="preview-image" />
            <div className="preview-controls">
              <button className="button" onClick={retakePhoto}>
                Retake
              </button>
              <button className="button primary" onClick={acceptPhoto}>
                {photos.length >= photoCount ? 'Finish' : 'Accept'}
              </button>
            </div>
          </div>
        )}
      </div>

      {!isCountingDown && !showPreview && photos.length < photoCount && (
        <div className="controls">
          <button className="button" onClick={onBack}>
            Back
          </button>
          <button className="button primary" onClick={startCapture}>
            {photos.length === 0 ? 'Start' : `Photo ${currentPhoto + 1} of ${photoCount}`}
          </button>
        </div>
      )}

      <div className="photo-progress">
        {Array.from({ length: photoCount }, (_, i) => (
          <div
            key={i}
            className={`progress-dot ${i < photos.length ? 'completed' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PreviewScreen;
