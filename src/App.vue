<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: 
    radial-gradient(ellipse at 20% 30%, rgba(196, 113, 237, 0.4) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 70%, rgba(255, 107, 157, 0.4) 0%, transparent 60%),
    radial-gradient(ellipse at 50% 50%, rgba(79, 172, 254, 0.3) 0%, transparent 70%),
    linear-gradient(135deg, #0a0e27 0%, #1a1f3a 40%, #2d1b4e 70%, #1a1f3a 100%);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 40%, rgba(196, 113, 237, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 70% 60%, rgba(255, 107, 157, 0.15) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
  animation: pulse 10s ease-in-out infinite;
}

body::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, 0.01) 2px,
      rgba(255, 255, 255, 0.01) 4px
    );
  pointer-events: none;
  z-index: 0;
  opacity: 0.3;
}

@keyframes pulse {
  0%, 100% { 
    opacity: 0.6; 
    transform: scale(1) translate(0, 0); 
  }
  33% { 
    opacity: 0.8; 
    transform: scale(1.05) translate(20px, -20px); 
  }
  66% { 
    opacity: 0.7; 
    transform: scale(0.98) translate(-15px, 15px); 
  }
}

#app {
  min-height: 100vh;
}
</style>

