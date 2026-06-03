import React from 'react';
import ReactDOM from 'react-dom/client';
import { WordBookApp } from './WordBookApp';
import '@renderer/styles/global.css';
import './word-book.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WordBookApp />
  </React.StrictMode>
);
