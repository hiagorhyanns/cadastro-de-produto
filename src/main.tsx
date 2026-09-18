import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ImageGenerationProvider } from './contexts/ImageGenerationContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ImageGenerationProvider>
      <App />
    </ImageGenerationProvider>
  </StrictMode>,
);
