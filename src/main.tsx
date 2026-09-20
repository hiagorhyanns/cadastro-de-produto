import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ImageGenerationProvider } from './contexts/ImageGenerationContext';
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ImageGenerationProvider>
        <App />
      </ImageGenerationProvider>
    </ErrorBoundary>
  </StrictMode>,
);

