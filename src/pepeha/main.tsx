import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/global.css';
import { PepehaPage } from './PepehaPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PepehaPage />
  </StrictMode>,
);
