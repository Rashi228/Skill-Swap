import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setSubmitted(true);
        window.showNotification('Password reset email sent! Check your inbox.', 'success');
      } else {
        const data = await res.json();
        window.showNotification(data.error || 'Failed to send reset email. Please try again.', 'error');
      }
    } catch (err) {
      window.showNotification('Server error. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-gradient-primary">
        <div className="card shadow p-4" style={{maxWidth: '400px', width: '100%', borderRadius: '1.5rem'}}>
          <div className="text-center mb-4">
            <i className="bi bi-check-circle text-success" style={{fontSize: '3rem'}}></i>
            <h2 className="fw-bold mb-2" style={{color:'#185a9d'}}>Check Your Email</h2>
            <p className="text-secondary">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-muted small">
              The link will expire in 1 hour. If you don't see the email, check your spam folder.
            </p>
          </div>
          <div className="text-center">
            <Link to="/login" className="btn btn-primary">
              Back to Login
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
          <h2 className="fw-bold mb-1" style={{color:'#185a9d'}}>Forgot Password?</h2>
          <p className="text-secondary mb-0">Enter your email to reset your password</p>
        </div>
        
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email address" 
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
                Sending...
              </>
            ) : (
              'Send Reset Link'
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

export default ForgotPassword;
