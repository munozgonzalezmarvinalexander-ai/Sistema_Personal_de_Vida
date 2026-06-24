import { useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import {
  Download, FileJson, FileSpreadsheet, Shield,
  AlertCircle, CheckCircle, Loader2
} from 'lucide-react';

interface DownloadItem {
  label: string;
  description: string;
  endpoint: string;
  filename: string;
  icon: 'json' | 'csv';
}

const DOWNLOADS: DownloadItem[] = [
  {
    label: 'Respaldo completo (JSON)',
    description: 'Todos tus datos: perfil, habitos, check-ins, experimentos, logros y recordatorios.',
    endpoint: '/export/json',
    filename: 'rumbo_export.json',
    icon: 'json',
  },
  {
    label: 'Check-ins diarios (CSV)',
    description: 'Metricas diarias: sueno, animo, energia, agua, minutos de estudio y mas.',
    endpoint: '/export/csv/checkins',
    filename: 'rumbo_checkins.csv',
    icon: 'csv',
  },
  {
    label: 'Habitos (CSV)',
    description: 'Lista de habitos con niveles minimo, normal e ideal.',
    endpoint: '/export/csv/habits',
    filename: 'rumbo_habits.csv',
    icon: 'csv',
  },
  {
    label: 'Experimentos (CSV)',
    description: 'Experimentos personales con hipotesis, resultado y decision.',
    endpoint: '/export/csv/experiments',
    filename: 'rumbo_experiments.csv',
    icon: 'csv',
  },
];

export default function Export() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDownload = async (item: DownloadItem) => {
    setDownloading(item.endpoint);
    try {
      const response = await api.get(item.endpoint, { responseType: 'blob' });

      const contentDisposition = response.headers['content-disposition'];
      let filename = item.filename;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('success', `${item.label} descargado`);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="export-page">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <header className="page-header">
        <h1>Exportar datos</h1>
      </header>

      <div className="card export-intro">
        <Download size={20} />
        <p>Tus datos son tuyos. Puedes exportarlos para respaldo personal o analisis externo.</p>
      </div>

      <div className="card export-warning">
        <Shield size={18} />
        <p>El archivo exportado puede contener informacion personal. Guardalo en un lugar seguro.</p>
      </div>

      <div className="export-grid">
        {DOWNLOADS.map((item) => (
          <div key={item.endpoint} className="card export-card">
            <div className="export-card-icon">
              {item.icon === 'json' ? <FileJson size={28} /> : <FileSpreadsheet size={28} />}
            </div>
            <div className="export-card-info">
              <h3>{item.label}</h3>
              <p>{item.description}</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleDownload(item)}
              disabled={downloading === item.endpoint}
            >
              {downloading === item.endpoint
                ? <><Loader2 size={16} className="spin" /> Descargando...</>
                : <><Download size={16} /> Descargar</>
              }
            </button>
          </div>
        ))}
      </div>

      <div className="export-notes">
        <h3>Notas sobre la exportacion</h3>
        <ul>
          <li>Los archivos se generan bajo demanda y no se almacenan en el servidor.</li>
          <li>El respaldo JSON incluye todos tus datos excepto contrasena y tokens.</li>
          <li>Los CSV son utiles para abrir en Excel, Google Sheets o cualquier herramienta de datos.</li>
          <li>Puedes exportar tus datos en cualquier momento y tantas veces como quieras.</li>
        </ul>
      </div>
    </div>
  );
}
