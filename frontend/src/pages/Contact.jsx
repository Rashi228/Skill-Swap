import React, { useState } from 'react';
import EmailService from '../services/emailService';
import EmailConfigStatus from '../components/EmailConfigStatus';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Check if EmailJS is configured
      if (!EmailService.isConfigured()) {
        setError('Email service not configured. Please check the setup guide.');
        return;
      }

      const result = await EmailService.sendContactMessage(form);

      if (result.status === 200) {
        setSuccess(true);
        setForm({ name: '', email: '', message: '' });
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Email send error:', error);
      setError('Failed to send message. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5" style={{background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)', minHeight:'100vh'}}>
      <div className="container bg-white rounded-4 shadow p-4" style={{maxWidth:'500px'}}>
        <h2 className="fw-bold text-gradient mb-4">Contact Us</h2>
        <EmailConfigStatus showDetails={true} />
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input 
              className="form-control" 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              required 
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input 
              className="form-control" 
              name="email" 
              type="email" 
              value={form.email} 
              onChange={handleChange} 
              required 
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Message</label>
            <textarea 
              className="form-control" 
              name="message" 
              rows="4" 
              value={form.message} 
              onChange={handleChange} 
              required 
              disabled={loading}
            />
          </div>
          <button 
            className="btn btn-primary w-100" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </button>
          
          {success && (
            <div className="alert alert-success mt-3 text-center">
              <i className="bi bi-check-circle me-2"></i>
              Message sent successfully! We'll get back to you soon.
            </div>
          )}
          
          {error && (
            <div className="alert alert-danger mt-3 text-center">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
        </form>
        
        <div className="mt-4 text-center text-secondary">
          <div>Or email us directly at <a href="mailto:support@skillswap.com" className="text-primary">support@skillswap.com</a></div>
          <div className="mt-2">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Need EmailJS setup? Check the <a href="/EMAILJS_SETUP.md" target="_blank" className="text-primary">setup guide</a> for configuration details.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 