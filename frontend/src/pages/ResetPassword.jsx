import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Validate token on component mount
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/validate-reset-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!res.ok) {
        setTokenValid(false);
      }
    } catch (error) {
      setTokenValid(false);
    }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      window.showNotification('Passwords do not match.', 'error');
      return;
    }

    if (form.password.length < 6) {
      window.showNotification('Password must be at least 6 characters long.', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          password: form.password 
        })
      });

      if (res.ok) {
        setSuccess(true);
        window.showNotification('Password reset successfully!', 'success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const data = await res.json();
        window.showNotification(data.error || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      window.showNotification('Server error. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-gradient-primary">
        <div className="card shadow p-4" style={{maxWidth: '400px', width: '100%', borderRadius: '1.5rem'}}>
          <div className="text-center mb-4">
            <i className="bi bi-exclamation-triangle text-danger" style={{fontSize: '3rem'}}></i>
            <h2 className="fw-bold mb-2" style={{color:'#185a9d'}}>Invalid Reset Link</h2>
            <p className="text-secondary">
              This password reset link is invalid or has expired.
            </p>
            <p className="text-muted small">
              Please request a new password reset link.
            </p>
          </div>
          <div className="text-center">
            <Link to="/forgot" className="btn btn-primary me-2">
              Request New Link
            </Link>
            <Link to="/login" className="btn btn-outline-secondary">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-gradient-primary">
        <div className="card shadow p-4" style={{maxWidth: '400px', width: '100%', borderRadius: '1.5rem'}}>
          <div className="text-center mb-4">
            <i className="bi bi-check-circle text-success" style={{fontSize: '3rem'}}></i>
            <h2 className="fw-bold mb-2" style={{color:'#185a9d'}}>Password Reset Successfully!</h2>
            <p className="text-secondary">
              Your password has been updated. Redirecting to login...
            </p>
          </div>
          <div className="text-center">
            <Link to="/login" className="btn btn-primary">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-gradient-primary">
      <div className="card shadow p-4" style={{maxWidth: '400px', width: '100%', borderRadius: '1.5rem'}}>
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-1" style={{color:'#185a9d'}}>Reset Your Password</h2>
          <p className="text-secondary mb-0">Enter your new password</p>
        </div>
        
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input 
              type="password" 
              className="form-control" 
              name="password"
              value={form.password} 
              onChange={handleChange} 
              placeholder="Enter new password" 
              required 
              disabled={loading}
              minLength="6"
            />
            <div className="form-text">Password must be at least 6 characters long</div>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Confirm New Password</label>
            <input 
              type="password" 
              className="form-control" 
              name="confirmPassword"
              value={form.confirmPassword} 
              onChange={handleChange} 
              placeholder="Confirm new password" 
              required 
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-100 mb-3" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
        
        <div className="text-center">
          <Link to="/login" className="text-decoration-none" style={{color:'#185a9d'}}>
            <i className="bi bi-arrow-left me-1"></i>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
