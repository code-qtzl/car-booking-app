import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';

function App() {
	return (
		<ErrorBoundary>
			<BrowserRouter>
				<AuthProvider>
					<AppRoutes />
				</AuthProvider>
			</BrowserRouter>
		</ErrorBoundary>
	);
}

export default App;

export default App;
