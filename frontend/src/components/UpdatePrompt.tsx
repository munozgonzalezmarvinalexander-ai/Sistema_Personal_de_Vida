import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from '../utils/pwaUpdate';
import { hasUnsavedChanges, subscribeUnsavedChanges } from '../utils/dirtyState';

export default function UpdatePrompt() {
  const [dirty, setDirty] = useState(hasUnsavedChanges);
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();

  useEffect(() => subscribeUnsavedChanges(setDirty), []);
  if (!needRefresh) return null;

  return (
    <div className="update-prompt" role="status" aria-live="polite">
      <RefreshCw size={20} />
      <div>
        <strong>Hay una actualización de Rumbo</strong>
        <p>{dirty ? 'Guarda o descarta tus cambios pendientes antes de actualizar.' : 'Puedes instalarla ahora sin perder cambios.'}</p>
      </div>
      <div className="update-actions">
        <button className="btn btn-primary btn-sm" disabled={dirty} onClick={() => void updateServiceWorker(true)}>Actualizar</button>
        <button className="btn btn-secondary btn-sm" onClick={() => setNeedRefresh(false)}>Después</button>
      </div>
    </div>
  );
}
