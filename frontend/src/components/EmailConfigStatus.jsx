import React from 'react';
import EmailService from '../services/emailService';

const EmailConfigStatus = ({ showDetails = false }) => {
  const isConfigured = EmailService.isConfigured();

  if (!showDetails) {
    return null;
  }

  return (
    <div className="email-config-status">
      <div className={`alert ${isConfigured ? 'alert-success' : 'alert-warning'} mb-3`}>
        <div className="d-flex align-items-center">
          <i className={`bi ${isConfigured ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
          <div>
            <strong>Email Service Status:</strong> {isConfigured ? 'Configured' : 'Not Configured'}
            {!isConfigured && (
              <div className="mt-1">
                <small>
                  To enable email functionality, please follow the{' '}
                  <a href="/EMAILJS_SETUP.md" target="_blank" className="alert-link">
                    EmailJS setup guide
                  </a>
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfigStatus; 