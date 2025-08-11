import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import referralService from '../services/referralService';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    referralCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referrer, setReferrer] = useState(null);
  const [referralCodeValid, setReferralCodeValid] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  // Check for referral code in URL on component mount
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setForm(prev => ({ ...prev, referralCode: refCode }));
      validateReferralCode(refCode);
    }
  }, [searchParams]);

  // Validate referral code
  const validateReferralCode = async (code) => {
    if (!code) {
      setReferralCodeValid(false);
      setReferrer(null);
      return;
    }

    try {
      const result = await referralService.validateReferralCode(code);
      if (result.success) {
        setReferralCodeValid(true);
        setReferrer(result.referrer);
      } else {
        setReferralCodeValid(false);
        setReferrer(null);
      }
    } catch (error) {
      setReferralCodeValid(false);
      setReferrer(null);
    }
  };

  // Handle referral code change
  const handleReferralCodeChange = async (e) => {
    const code = e.target.value;
    setForm(prev => ({ ...prev, referralCode: code }));
    
    if (code) {
      await validateReferralCode(code);
    } else {
      setReferralCodeValid(false);
      setReferrer(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          referralCode: form.referralCode || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (data.errors && data.errors[0]?.msg) || 'Registration failed');
        setLoading(false);
        return;
      }
      // Login user after successful registration
      if (data.token) {
        login(data.user, data.token);
        
        // Show success message if credits were awarded
        if (data.referralCreditsAwarded > 0) {
          alert(`🎉 Welcome to SkillSwap! You've earned ${data.referralCreditsAwarded} credits for using a referral code!`);
        }
        
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
      <div className="card shadow p-4" style={{maxWidth: '430px', width: '100%', borderRadius: '1.5rem'}}>
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-1" style={{color:'#185a9d'}}>Create Account</h2>
          <p className="text-secondary mb-0">Join SkillSwap and start exchanging skills!</p>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input type="text" className="form-control" name="username" value={form.username} onChange={handleChange} placeholder="Enter a username" required minLength={3} maxLength={30} />
          </div>
          <div className="mb-3">
            <label className="form-label">First Name</label>
            <input type="text" className="form-control" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Enter your first name" required />
          </div>
          <div className="mb-3">
            <label className="form-label">Last Name</label>
            <input type="text" className="form-control" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Enter your last name" required />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email" required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} placeholder="Create a password" required minLength={6} />
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input type="password" className="form-control" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm your password" required minLength={6} />
          </div>
          <div className="mb-3">
            <label className="form-label">Referral Code (Optional)</label>
            <input 
              type="text" 
              className={`form-control ${form.referralCode && !referralCodeValid ? 'is-invalid' : form.referralCode && referralCodeValid ? 'is-valid' : ''}`}
              name="referralCode" 
              value={form.referralCode} 
              onChange={handleReferralCodeChange} 
              placeholder="Enter referral code" 
            />
            {form.referralCode && referralCodeValid && referrer && (
              <div className="valid-feedback">
                Valid referral code! You'll earn 10 credits when you join!
              </div>
            )}
            {form.referralCode && !referralCodeValid && (
              <div className="invalid-feedback">
                Invalid referral code. Please check and try again.
              </div>
            )}
          </div>
          {error && <div className="alert alert-danger text-center py-2">{error}</div>}
          <button type="submit" className="btn btn-primary w-100 mb-2" disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</button>
        </form>
        <div className="text-center mt-2">
          <span className="text-secondary">Already have an account? </span>
          <Link to="/login" style={{color:'#185a9d', fontWeight:600}}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register; 