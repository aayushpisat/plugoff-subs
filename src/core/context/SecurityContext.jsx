import { createContext, useContext, useEffect, useState } from 'react';
const SecurityContext = createContext(null);

// This is feedback for real HTTP 429 responses; enforcement belongs to the server.
export const SecurityProvider = ({ children }) => {
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [retryAfter, setRetryAfter] = useState(0);
  const [showBlockSheet, setShowBlockSheet] = useState(false);
  useEffect(() => {
    const onLimit = ({ detail }) => {
      const seconds = Math.min(3600, Math.max(1, Number(detail?.retryAfter) || 30));
      setBlockedUntil((previous) => Math.max(previous, Date.now() + seconds * 1000));
      setRetryAfter(seconds);
      setShowBlockSheet(true);
    };
    window.addEventListener('security:rate-limited', onLimit);
    return () => window.removeEventListener('security:rate-limited', onLimit);
  }, []);
  useEffect(() => {
    if (!blockedUntil) return;
    const tick = () => setRetryAfter(Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000)));
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [blockedUntil]);
  return <SecurityContext.Provider value={{ isRateLimited: retryAfter > 0, retryAfter,
    showBlockSheet: showBlockSheet && retryAfter > 0, dismissBlockSheet: () => setShowBlockSheet(false),
  }}>{children}</SecurityContext.Provider>;
};
export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) throw new Error('useSecurity must be used within SecurityProvider');
  return context;
};
