import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
	return (
		<ErrorBoundary>
			<AppRoutes></AppRoutes>
		</ErrorBoundary>
	);
}

export default App;
