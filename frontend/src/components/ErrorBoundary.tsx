import { Component, type ErrorInfo, type ReactNode } from 'react';

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Rumbo UI error', error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="loading-screen recovery-screen">
          <p>Esta pantalla encontro un problema, pero tus datos guardados no se perdieron.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Recargar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
