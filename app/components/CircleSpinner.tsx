import React from 'react';
import PropTypes from 'prop-types';
import CircleSpinner from '../styles/CircleSpinner.css';

const PreloaderProp = ({
  type = 'ring',
  size = 'medium',
  color = '#3b82f6',
  speed = 'normal',
  fullScreen = false,
  text = 'Loading...',
  showText = false,
  overlay = false,
  className = ''
}) => {
  const sizeMap = {
    small: { width: 24, height: 24 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 },
    xlarge: { width: 96, height: 96 }
  };

  const speedMap = {
    slow: '1.2s',
    normal: '0.8s',
    fast: '0.5s'
  };

  const spinnerStyle = {
    width: sizeMap[size].width,
    height: sizeMap[size].height,
    '--spinner-color': color,
    '--spinner-speed': speedMap[speed],
  };

  const renderSpinner = () => {
    switch (type) {
        
      case 'circle':
        return (
          <div className="spinner-circle" style={spinnerStyle}>
            <div className="circle-inner" />
          </div>
        );

        return (
          <div className="spinner-ring" style={spinnerStyle}>
            <div />
            <div />
            <div />
            <div />
          </div>
        );
    }
  };

  const spinnerContent = (
    <div className={`spinner-container ${className}`}>
      {renderSpinner()}
      {showText && text && (
        <div 
          className="spinner-text"
          style={{ color, fontSize: sizeMap[size].width * 0.25 }}
        >
          {text}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`spinner-fullscreen ${overlay ? 'spinner-overlay' : ''}`}>
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

PreloaderProp.propTypes = {
  type: PropTypes.oneOf(['ring', 'dots', 'pulse', 'circle', 'bouncing']),
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
  color: PropTypes.string,
  speed: PropTypes.oneOf(['slow', 'normal', 'fast']),
  fullScreen: PropTypes.bool,
  text: PropTypes.string,
  showText: PropTypes.bool,
  overlay: PropTypes.bool,
  className: PropTypes.string
};

export default PreloaderProp;