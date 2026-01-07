import React from 'react';
import '../styles/ErrorHandling.css';

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error) {
		// Update state so the next render will show the fallback UI
		return { hasError: true };
	}

	componentDidCatch(error, errorInfo) {
		// Log error details for debugging
		console.error('ErrorBoundary caught an error:', error, errorInfo);

		this.setState({
			error: error,
			errorInfo: errorInfo,
		});

		// In production, you would send this to an error reporting service
		if (process.env.NODE_ENV === 'production') {
			// Example: logErrorToService(error, errorInfo);
		}
	}

	handleRetry = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	render() {
		if (this.state.hasError) {
			// Custom fallback UI
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default fallback UI
			return (
				<div className='error-boundary'>
					<div className='error-boundary-content'>
						<h2>Something went wrong</h2>
						<p>
							We're sorry, but something unexpected happened.
							Please try refreshing the page or contact support if
							the problem persists.
						</p>

						{process.env.NODE_ENV === 'development' && (
							<details className='error-details'>
								<summary>
									Error Details (Development Only)
								</summary>
								<pre className='error-stack'>
									{this.state.error &&
										this.state.error.toString()}
									<br />
									{this.state.errorInfo.componentStack}
								</pre>
							</details>
						)}

						<div className='error-actions'>
							<button
								onClick={this.handleRetry}
								className='retry-button'
							>
								Try Again
							</button>
							<button
								onClick={() => window.location.reload()}
								className='refresh-button'
							>
								Refresh Page
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
