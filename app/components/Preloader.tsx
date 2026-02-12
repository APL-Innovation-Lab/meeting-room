// App.jsx
import React, { useState } from 'react';
import CircleSpinner from './CircleSpinner.tsx';


function Preloader() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div style={{ padding: '24px' }}>
      <h1>Circle Preloader Demo</h1>
      
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <div>
          <h3>Default</h3>
          <CircleSpinner />
        </div>
        <div>
          <h3>Large & Blue</h3>
          <CircleSpinner size="large" color="#3b82f6" speed="slow" />
        </div>
        <div>
          <h3>With Text</h3>
          <CircleSpinner showText text="Processing..." color="#3b82f6" />
        </div>
        <div>
          <h3>Extra Large</h3>
          <CircleSpinner size="xlarge" color="#3b82f6" />
        </div>
      </div>

      {/* <button
        onClick={() => setIsLoading(true)}
        style={{
          padding: '12px 24px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Show Fullscreen Loader
      </button>

      {isLoading && (
        <CircleSpinner
          fullScreen
          overlay
          color="#3b82f6"
          speed="fast"
          showText
          text="Loading awesome content..."
          onClose={() => setIsLoading(false)} // Add a close button or timeout as needed
        />
      )} */}
    </div>
  );
}

export default Preloader;