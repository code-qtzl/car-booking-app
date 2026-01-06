import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/login';

export const signup = async (userData) => {
  try {
    // Transform frontend data to match backend expectations
    const backendData = {
      emailId: userData.email,
      password: userData.password,
      typeOfUser: userData.userType.toUpperCase() // Convert to ADMIN or CUSTOMER
    };

    const response = await axios.post(`${API_BASE_URL}/signup`, backendData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Signup failed');
  }
};

