import React from 'react';
import ReactDOM from 'react-dom/client';
import PianoChordTeacher from './PianoChordTeacher';
import './styles.css'; // We'll create this for basic styling
import './mobileOptimizations'; // Import mobile optimizations

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <PianoChordTeacher />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
} 