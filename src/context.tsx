export default function sendClientContext() {
  const payload = {
    screen: { width: window.screen.width, height: window.screen.height },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  };
  navigator.sendBeacon('/_context', JSON.stringify(payload));
}


export function handleCaptchaSolved() {
  window.location.reload();
}
