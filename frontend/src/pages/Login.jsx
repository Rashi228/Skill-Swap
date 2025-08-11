import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.toLowerCase().includes('credentials')) {
          setError('Account does not exist or password is incorrect.');
        } else if (data.error && data.error.toLowerCase().includes('deactivated')) {
          setError('Account is deactivated.');
        } else {
          setError(data.error || 'Login failed');
        }
        setLoading(false);
        // If account does not exist, redirect to register after 1.5s
        if (data.error && data.error.toLowerCase().includes('credentials')) {
          setTimeout(() => navigate('/register'), 1500);
        }
        return;
      }
      if (data.token) {
        login(data.user, data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-gradient-primary">
      <div className="card shadow p-4" style={{maxWidth: '400px', width: '100%', borderRadius: '1.5rem'}}>
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-1" style={{color:'#185a9d'}}>Welcome Back!</h2>
          <p className="text-secondary mb-0">Login to your SkillSwap account</p>
        </div>
        {/* Google Sign In Button */}
        <div className="d-grid mb-3">
          <button type="button" className="btn btn-light border d-flex align-items-center justify-content-center gap-2 py-2" style={{fontWeight:600, fontSize:'1.05rem'}}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Google" style={{width:'22px', height:'22px'}} />
            Sign in with Google
          </button>
        </div>
        <div className="text-center text-secondary mb-2" style={{fontSize:'0.95rem'}}>or login with email</div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email" required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} placeholder="Enter your password" required />
          </div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Link to="/forgot" className="small text-decoration-none" style={{color:'#43cea2'}}>Forgot password?</Link>
          </div>
          {error && <div className="alert alert-danger text-center py-2">{error}</div>}
          <button type="submit" className="btn btn-primary w-100 mb-2" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <div className="text-center mt-2">
          <span className="text-secondary">Don't have an account? </span>
          <Link to="/register" style={{color:'#185a9d', fontWeight:600}}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 