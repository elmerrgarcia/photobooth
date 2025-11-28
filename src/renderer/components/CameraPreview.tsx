import React, { useRef, useEffect, useState } from 'react';

interface CameraPreviewProps {
  onCapture?: (imageData: string) => void;
  isActive?: boolean;
  deviceId?: string | null;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({ onCapture, isActive = true, deviceId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isActive) return;

    const startCamera = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? {
                deviceId: { exact: deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user',
              },
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
        setError('');
      } catch (err) {
        console.error('Camera error:', err);
        setError('Unable to access camera. Please check permissions.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, deviceId]);

  const captureFrame = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/png');
      onCapture?.(imageData);
    }
  };

  return (
    <div className="camera-container">
      {error ? (
        <div className="error-message">
          {error}
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-preview"
        />
      )}
    </div>
  );
};

export default CameraPreview;
