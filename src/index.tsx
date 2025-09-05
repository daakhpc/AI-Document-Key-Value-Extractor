import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Application Error</h1>
            <p className="mb-2">Something went wrong and the application could not start.</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This can happen if the application is misconfigured, such as a missing API key. Please check the console for more details.</p>
            <details className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-left text-xs">
                <summary>Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all">
                    {this.state.error?.message || 'No error message available.'}
                </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);