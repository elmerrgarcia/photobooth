import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Shim Node-style global for browser environment
// This fixes runtime errors like 'global is not defined' from some libraries
if (typeof window !== 'undefined' && (window as any).global === undefined) {
  (window as any).global = window;
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
