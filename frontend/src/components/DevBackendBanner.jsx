import { useEffect, useState } from 'react';

/**
 * In dev, shows a clear warning if the backend (port 8000 via Vite proxy) is not reachable.
 * Stops 502 confusion on Google login / register.
 */
export default function DevBackendBanner() {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('/api/health', { method: 'GET' });
        if (!cancelled) setOk(res.ok);
      } catch {
        if (!cancelled) setOk(false);
      }
    };

    check();
    const id = setInterval(check, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!import.meta.env.DEV || ok === null || ok === true) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        padding: '10px 16px',
        background: '#b91c1c',
        color: '#fff',
        fontSize: '14px',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <strong>Backend is not running.</strong> Google sign-in and API calls will fail with 502. In a
      new terminal run: <code style={{ background: '#7f1d1d', padding: '2px 6px' }}>cd backend</code>{' '}
      then <code style={{ background: '#7f1d1d', padding: '2px 6px' }}>npm run dev</code>
      &nbsp;— or from the project folder run <code style={{ background: '#7f1d1d', padding: '2px 6px' }}>npm run dev</code> to start both.
    </div>
  );
}
