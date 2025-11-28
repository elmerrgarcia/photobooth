import React, { useState } from 'react';
import { TemplateEngine } from '../../shared/services/TemplateEngine';
import { PrintService } from '../../shared/services/PrintService';
import { EmailService } from '../../shared/services/EmailService';
import { getDesignTemplateById } from '../../shared/templates';

interface DeliveryScreenProps {
  photos: string[];
  designTemplateId?: string | null;
  onComplete: () => void;
  onBack: () => void;
  onGallery?: () => void;
}

const DeliveryScreen: React.FC<DeliveryScreenProps> = ({
  photos,
  designTemplateId,
  onComplete,
  onBack,
  onGallery
}) => {
  const [email, setEmail] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [composedImage, setComposedImage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const templateEngine = new TemplateEngine();
  const printService = new PrintService();
  const emailService = new EmailService();

  const deliveryOptions = [
    { id: 'print', name: 'Print', icon: '🖨️' },
    { id: 'email', name: 'Email', icon: '📧' },
    { id: 'save', name: 'Save to USB', icon: '💾' },
    { id: 'qr', name: 'QR Code', icon: '📱' }
  ];

  React.useEffect(() => {
    const composeImage = async () => {
      try {
        const designTemplate = getDesignTemplateById(designTemplateId || undefined);
        const composed = await templateEngine.composePhotos(photos, 'strip', {
          designTemplate: designTemplate,
        });
        setComposedImage(composed);
      } catch (err) {
        console.error('Error composing image:', err);
        setError('Failed to compose photos');
      }
    };

    if (photos.length > 0) {
      composeImage();
    }
  }, [photos]);

  const handleDelivery = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const designTemplate = getDesignTemplateById(designTemplateId || undefined);
      const composed = await templateEngine.composePhotos(photos, 'strip', { designTemplate });
      setComposedImage(composed);

      if (selectedDelivery === 'print') {
        await printService.printPhotos([composed], 'strip');
      } else if (selectedDelivery === 'email') {
        await emailService.sendPhotos(email, [composed]);
      } else if (selectedDelivery === 'save') {
        // Placeholder: save to USB
        console.log('Save to USB not implemented');
      } else if (selectedDelivery === 'qr') {
        // Placeholder: generate QR code
        console.log('QR code not implemented');
      }
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delivery failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPhotoStrip = () => {
    if (composedImage) {
      return (
        <div className="photo-strip">
          <img src={composedImage} alt="Composed Photos" />
        </div>
      );
    }
    
    return (
      <div className="photo-strip">
        {photos.map((photo, index) => (
          <img key={index} src={photo} alt={`Photo ${index + 1}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="screen">
      <h1 className="title">Your Photos</h1>
      <p className="subtitle">Review your final strip and choose how to get your photos. Select Print for a physical copy of your final shot.</p>
      
      {renderPhotoStrip()}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="delivery-section">
        <h2>Choose Delivery Method</h2>
        <div className="options-grid">
          {deliveryOptions.map((option: any) => (
            <div
              key={option.id}
              className={`option-card ${selectedDelivery === option.id ? 'selected' : ''}`}
              onClick={() => setSelectedDelivery(option.id)}
            >
              <div className="option-icon">{option.icon}</div>
              <div className="option-title">{option.name}</div>
            </div>
          ))}
        </div>
      </div>

      {selectedDelivery === 'email' && (
        <div className="email-input">
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="email-field"
          />
        </div>
      )}

      <div className="controls">
        <button className="button" onClick={onBack}>
          Back
        </button>
        <button className="button secondary" onClick={onGallery}>
          🖼️ Gallery
        </button>
        <button
          className="button primary"
          onClick={handleDelivery}
          disabled={!selectedDelivery || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default DeliveryScreen;
