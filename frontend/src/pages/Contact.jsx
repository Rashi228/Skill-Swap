import React, { useState } from 'react';
import EmailService from '../services/emailService';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if EmailJS is configured
      if (!EmailService.isConfigured()) {
        window.showNotification('Email service not configured. Please check the setup guide.', 'error');
        return;
      }

      const result = await EmailService.sendContactMessage(form);

      if (result.status === 200) {
        // Show success notification
        window.showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
        // Clear form
        setForm({ name: '', email: '', message: '' });
      }
    } catch (error) {
      console.error('Email send error:', error);
      window.showNotification('Failed to send message. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5" style={{background:'linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)', minHeight:'100vh'}}>
      <div className="container bg-white rounded-4 shadow p-4" style={{maxWidth:'500px'}}>
        <h2 className="fw-bold text-gradient mb-4">Contact Us</h2>
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
        </form>
      </div>
    </div>
  );
};

export default Contact; 