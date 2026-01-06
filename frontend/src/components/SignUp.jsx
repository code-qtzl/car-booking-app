import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../service/signup.service';
// import './Login.css';

function SignUp() {
	const navigate = useNavigate();
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
			const response = await signup(formData);
			console.log('Signup successful:', response);
			// Navigate to login page after successful signup
			navigate('/');
		} catch (err) {
			setError(err.message || 'Signup failed. Please try again.');
			console.error('Signup error:', err);
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
			<h2>Sign Up Page</h2>
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
						minLength={6}
					/>
				</div>

				<div className='form-group'>
					<label>Type of User:</label>
					<div className='radio-group'>
						<label className='radio-label'>
							<input
								type='radio'
								name='userType'
								value='admin'
								checked={formData.userType === 'admin'}
								onChange={handleChange}
							/>
							Admin
						</label>
						<label className='radio-label'>
							<input
								type='radio'
								name='userType'
								value='customer'
								checked={formData.userType === 'customer'}
								onChange={handleChange}
							/>
							Customer
						</label>
					</div>
				</div>

				<div className='button-group'>
					<button
						type='submit'
						className='btn btn-signin'
						disabled={isLoading}
					>
						{isLoading ? 'Creating Account...' : 'Sign Up'}
					</button>
					<button
						type='button'
						onClick={handleReset}
						className='btn btn-reset'
						disabled={isLoading}
					>
						Reset
					</button>
				</div>
			</form>
			<div style={{ marginTop: '1rem', textAlign: 'center' }}>
				<a href='/'>Already have an account? Sign In</a>
			</div>
		</div>
	);
}
export default SignUp;
