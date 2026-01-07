import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../service/login.service';
import { useAuthContext } from '../contexts/AuthContext';
// import './Login.css';

function Login() {
	const navigate = useNavigate();
	const { login } = useAuthContext();
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		userType: 'customer',
	});
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		setError(''); // Clear error when user types
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		try {
			const loginData = {
				emailId: formData.email,
				password: formData.password,
			};

			const response = await signIn(loginData);

			if (response.data && response.data.user) {
				const user = response.data.user;

				// Use auth context to manage session
				login(user);

				// Navigate based on user role
				if (user.typeOfUser === 'ADMIN') {
					navigate('/admin');
				} else {
					navigate('/customer');
				}
			} else {
				throw new Error('Invalid response from server');
			}
		} catch (err) {
			setError(
				err.message || 'Login failed. Please check your credentials.',
			);
			console.error('Login error:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleReset = () => {
		setFormData({
			email: '',
			password: '',
			userType: 'customer',
		});
		setError('');
	};

	return (
		<div className='container'>
			<h2>Login Page</h2>
			{error && (
				<div
					style={{
						color: 'red',
						marginBottom: '1rem',
						padding: '0.5rem',
						backgroundColor: 'rgba(255, 0, 0, 0.1)',
						borderRadius: '4px',
					}}
				>
					{error}
				</div>
			)}
			<form onSubmit={handleSubmit} className='login-form'>
				<div className='form-group'>
					<label htmlFor='email'>Email:</label>
					<input
						type='email'
						id='email'
						name='email'
						value={formData.email}
						onChange={handleChange}
						required
						placeholder='Enter your email'
						disabled={isLoading}
					/>
				</div>

				<div className='form-group'>
					<label htmlFor='password'>Password:</label>
					<input
						type='password'
						id='password'
						name='password'
						value={formData.password}
						onChange={handleChange}
						required
						placeholder='Enter your password'
						disabled={isLoading}
					/>
				</div>

				<div className='button-group'>
					<button
						type='submit'
						className='btn btn-signin'
						disabled={isLoading}
					>
						{isLoading ? 'Signing In...' : 'Sign In'}
					</button>
				</div>
				<fieldset>
					<button
						type='button'
						onClick={handleReset}
						className='btn btn-reset'
						disabled={isLoading}
					>
						Reset
					</button>
					<a href='/signup'>Sign Up</a>
				</fieldset>
			</form>
		</div>
	);
}

export default Login;
