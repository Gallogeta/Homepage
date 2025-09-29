// Mobile device detection utility
export function isMobileDevice() {
  // Check user agent for mobile patterns
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
  
  // Check screen size as secondary indicator
  const isSmallScreen = window.innerWidth <= 768;
  
  // Check for touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return mobileRegex.test(userAgent) || (isSmallScreen && hasTouch);
}

export function getDeviceType() {
  if (isMobileDevice()) {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    }
    return 'mobile';
  }
  return 'desktop';
}

// Hook for React components
import React from 'react';

export function useMobileDetection() {
  const [isMobile, setIsMobile] = React.useState(false);
  const [deviceType, setDeviceType] = React.useState('desktop');

  React.useEffect(() => {
    const checkDevice = () => {
      setIsMobile(isMobileDevice());
      setDeviceType(getDeviceType());
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, deviceType };
}