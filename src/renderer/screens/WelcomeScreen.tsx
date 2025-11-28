import React from 'react';
import logo from '../assets/logo.jpg';

interface WelcomeScreenProps {
  onStart: () => void;
  onAdmin: () => void;
  onGallery: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onAdmin, onGallery }) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Secret key combination to access admin: Ctrl+Shift+A
    if (event.ctrlKey && event.shiftKey && event.key === 'A') {
      onAdmin?.();
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, [onAdmin]);

  return (
    <div className="screen welcome-screen">
      <div className="welcome-content">
        <img
          src={logo}
          alt="Keisha's Photobooth Services"
          className="welcome-logo"
        />
        <h1 className="title">Keisha's Photobooth Services</h1>
        <p className="subtitle">Capture memories in style</p>
        
        <div className="welcome-actions">
          <button className="button large primary" onClick={onStart}>
            📸 Start Session
          </button>
          <button className="button large" onClick={onGallery}>
            🖼️ Gallery
          </button>
        </div>
        
        <div className="admin-hint">
          Hold Ctrl+Shift+A for admin access
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
