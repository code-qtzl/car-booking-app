import { Link } from 'react-router-dom';

function CustomerDashboard() {
	return (
		<div>
			<h2>Welcome to Customer Dashboard</h2>
			<nav>
				<Link to='/cars'>Browse Available Cars</Link>
			</nav>
		</div>
	);
}
export default CustomerDashboard;
