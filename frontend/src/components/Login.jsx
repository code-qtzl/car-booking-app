import { useState } from 'react';
// import './Login.css';

function Login() {
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		userType: 'customer',
	});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		console.log('Login attempt:', formData);
		// TODO: Implement login logic
	};

	const handleReset = () => {
		setFormData({
			email: '',
			password: '',
			userType: 'customer',
		});
	};

	return (
		<div className='container'>
			<h2>Login Page</h2>
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
					/>
				</div>

				<label>Type of User:</label>
				<fieldset>
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
				</fieldset>

				<div className='button-group'>
					<button type='submit' className='btn btn-signin'>
						Sign In
					</button>
				</div>
				<fieldset>
					<button
						type='button'
						onClick={handleReset}
						className='btn btn-reset'
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
