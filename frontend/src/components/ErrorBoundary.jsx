import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
                    <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-10 max-w-md w-full text-center">
                        <div className="bg-red-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5">
                            <AlertTriangle className="text-red-500" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 mx-auto bg-brand text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-dark transition-colors"
                        >
                            <RefreshCw size={16} /> Refresh Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
