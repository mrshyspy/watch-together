import React from 'react';

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, info) {
		// You can log error to monitoring service here
		console.error('ErrorBoundary caught an error:', error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
					<div className="max-w-lg w-full bg-gray-800 rounded-lg p-6 text-center">
						<h2 className="text-xl font-bold mb-2">Something went wrong</h2>
						<p className="text-sm text-gray-300 mb-4">An unexpected error occurred in the UI. You can reload the page to try again.</p>
						<div className="flex justify-center space-x-3">
							<button
								onClick={() => window.location.reload()}
								className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white"
							>
								Reload
							</button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;