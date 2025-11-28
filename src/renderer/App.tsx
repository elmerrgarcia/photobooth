import React, { useState } from 'react';
import CameraPreview from './components/CameraPreview';
import WelcomeScreen from './screens/WelcomeScreen';
import OptionsScreen from './screens/OptionsScreen';
import PreviewScreen from './screens/PreviewScreen';
import DeliveryScreen from './screens/DeliveryScreen';
import AdminScreen from './screens/AdminScreen';
import GalleryScreen from './screens/GalleryScreen';
import { getAllDesignTemplates } from '../shared/templates';
import './App.css';

type Screen = 'welcome' | 'options' | 'preview' | 'delivery' | 'gallery' | 'admin';

interface SessionData {
  photos: string[];
  photoCount: number;
  designTemplateId?: string | null;
  cameraDeviceId?: string | null;
}

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [sessionData, setSessionData] = useState<SessionData>({
    photos: [],
    photoCount: 3,
    designTemplateId: null,
    cameraDeviceId: null
  });

  const resetSession = () => {
    setSessionData({ photos: [], photoCount: 3, designTemplateId: null, cameraDeviceId: null });
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen 
            onStart={() => navigateTo('options')}
            onAdmin={() => navigateTo('admin')}
            onGallery={() => navigateTo('gallery')}
          />
        );
      case 'options':
        return (
          <OptionsScreen
            onBack={() => navigateTo('welcome')}
            onStart={(designTemplateId, cameraDeviceId) => {
              const template = designTemplateId ? getAllDesignTemplates().find(t => t.id === designTemplateId) : undefined;
              const photoCount = template?.slots.length || 3;
              setSessionData(prev => ({ ...prev, photoCount, designTemplateId, cameraDeviceId }));
              navigateTo('preview');
            }}
          />
        );
      case 'preview':
        return (
          <PreviewScreen
            photoCount={sessionData.photoCount}
            designTemplateId={sessionData.designTemplateId}
            cameraDeviceId={sessionData.cameraDeviceId}
            onComplete={(photos) => {
              setSessionData(prev => ({ ...prev, photos }));
              navigateTo('delivery');
            }}
            onCancel={() => {
              resetSession();
              navigateTo('welcome');
            }}
            onBack={() => navigateTo('options')}
          />
        );
      case 'delivery':
        return (
          <DeliveryScreen
            photos={sessionData.photos}
            designTemplateId={sessionData.designTemplateId}
            onBack={() => navigateTo('welcome')}
            onComplete={() => {
              resetSession();
              navigateTo('welcome');
            }}
            onGallery={() => navigateTo('gallery')}
          />
        );
      case 'gallery':
        return (
          <GalleryScreen
            onBack={() => navigateTo('welcome')}
          />
        );
      case 'admin':
        return (
          <AdminScreen
            onBack={() => navigateTo('welcome')}
          />
        );
      default:
        return (
          <WelcomeScreen 
            onStart={() => navigateTo('options')}
            onAdmin={() => navigateTo('admin')}
            onGallery={() => navigateTo('gallery')}
          />
        );
    }
  };

  return (
    <div className="app">
      {renderScreen()}
    </div>
  );
};

export default App;
