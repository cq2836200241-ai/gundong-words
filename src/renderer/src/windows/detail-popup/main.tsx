import React from 'react';
import ReactDOM from 'react-dom/client';
import { DetailApp } from './DetailApp';
import '@renderer/styles/global.css';
import './detail.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DetailApp />
  </React.StrictMode>
);
