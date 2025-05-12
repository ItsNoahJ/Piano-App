/**
 * Mobile optimizations that don't affect desktop UI
 */

// This function adds tap optimizations for mobile devices
export const initMobileOptimizations = () => {
  // Only run on mobile devices
  if (!isTouchDevice()) return;
  
  // 300ms tap delay fix (for older browsers that might not support this natively)
  document.addEventListener('touchstart', function() {}, { passive: true });
  
  // Prevent double tap to zoom on buttons by adding specific listeners
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('touchend', (e) => {
      // Prevent default only if the button has no href attribute (isn't a link)
      if (!button.hasAttribute('href')) {
        e.preventDefault();
      }
    }, { passive: false });
  });
  
  // Add active states for mobile that mimic hover states on desktop
  document.querySelectorAll('button, [role="button"]').forEach(element => {
    element.addEventListener('touchstart', () => {
      element.classList.add('touch-active');
    }, { passive: true });
    
    element.addEventListener('touchend', () => {
      element.classList.remove('touch-active');
    }, { passive: true });
  });
};

// Helper function to detect touch devices
export const isTouchDevice = () => {
  // First check for touch capability
  const hasTouch = 'ontouchstart' in window || 
                  navigator.maxTouchPoints > 0 ||
                  (navigator as any).msMaxTouchPoints > 0;
                  
  // Then check device type via user agent
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Lastly check screen size (up to 1024px)
  const isSmallScreen = window.matchMedia && window.matchMedia('(max-width: 1023px)').matches;
  
  return hasTouch && (isMobileUserAgent || isSmallScreen);
};

// Legacy function for backward compatibility
export const isMobileDevice = isTouchDevice;

// Optimize piano keyboard for touch
export const optimizePianoForTouch = () => {
  if (!isTouchDevice()) return;
  
  // Make piano keys more responsive on touch
  const pianoKeys = document.querySelectorAll('button[data-note]');
  
  pianoKeys.forEach(key => {
    key.addEventListener('touchstart', (e) => {
      // Simulate mousedown event
      const note = key.getAttribute('data-note');
      if (note) {
        // We would trigger note playing here but the component already handles this
        // This is just to ensure touch behavior matches mouse behavior
        e.preventDefault(); // Prevent default to avoid any unwanted behaviors
      }
    }, { passive: false });
  });
};

// Run optimizations when the DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initMobileOptimizations();
    
    // Wait a bit for the piano keys to be rendered
    setTimeout(optimizePianoForTouch, 1000);
    
    // Also run when orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(optimizePianoForTouch, 500);
    });
  });
} 