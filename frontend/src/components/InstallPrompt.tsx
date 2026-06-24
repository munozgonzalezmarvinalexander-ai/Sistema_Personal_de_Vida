import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'rumbo_install_dismissed';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setDeferredPrompt(null);
      setHidden(true);
    }
  };

  const handleDismiss = () => {
    setHidden(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  if (hidden || !deferredPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="install-content">
        <Download size={18} />
        <span>Instalar Rumbo en tu dispositivo</span>
      </div>
      <div className="install-actions">
        <button className="btn btn-primary btn-sm" onClick={handleInstall}>Instalar</button>
        <button className="btn-icon" onClick={handleDismiss}><X size={16} /></button>
      </div>
    </div>
  );
}
