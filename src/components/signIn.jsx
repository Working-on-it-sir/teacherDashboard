import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import "../style/App.css";

const SignIn = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  // Check if user is already logged in
  useEffect(() => {
    const tutorInfo = localStorage.getItem('tutorInfo');
    if (tutorInfo) {
      navigate('/teacher/dashboard');
    }
  }, [navigate]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log("Attempting to connect to server at: http://localhost:5000/api/tutor/login");
      const response = await fetch('http://localhost:5000/api/tutor/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Save tutor info in localStorage
        localStorage.setItem('tutorInfo', JSON.stringify(data.tutor));
        // Redirect to dashboard after successful login
        navigate('/teacher/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError('Server connection error. Please make sure the server is running at http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Teacher Sign In</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/teacher/forgot">Forgot Password?</Link>
          <p>
            Don't have an account? <Link to="/teacher/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;