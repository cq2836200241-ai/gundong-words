import React from 'react';
import ReactDOM from 'react-dom/client';
import { ScrollBarApp } from './ScrollBarApp';
import '@renderer/styles/global.css';
import './scroll-bar.css';

document.body.classList.add('transparent-window');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ScrollBarApp />
  </React.StrictMode>
);
