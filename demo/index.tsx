import React from 'react';
import ReactDOM from 'react-dom/client';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Theme appearance="light" accentColor="blue" grayColor="slate" scaling="100%" radius="medium">
      <App />
    </Theme>
  </React.StrictMode>
);
