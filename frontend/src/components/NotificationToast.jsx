import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const NotificationToast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-success" />;
      case 'error':
        return <FaExclamationTriangle className="text-danger" />;
      case 'warning':
        return <FaExclamationTriangle className="text-warning" />;
      default:
        return <FaInfoCircle className="text-info" />;
    }
  };

  const getBgClass = () => {
    switch (type) {
      case 'success':
        return 'bg-success border-success';
      case 'error':
        return 'bg-danger border-danger';
      case 'warning':
        return 'bg-warning border-warning';
      default:
        return 'bg-info border-info';
    }
  };

  return (
    <div
      className={`notification-toast ${isVisible ? 'show' : 'hide'} ${getBgClass()} border rounded-3 shadow-lg p-3`}
      style={{
        minWidth: '300px',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderWidth: '2px'
      }}
    >
      <div className="d-flex align-items-start">
        <div className="me-3 mt-1">
          {getIcon()}
        </div>
        <div className="flex-grow-1">
          <div className="fw-bold mb-1 text-dark">
            {type === 'success' && 'Success!'}
            {type === 'error' && 'Error!'}
            {type === 'warning' && 'Warning!'}
            {type === 'info' && 'Info'}
          </div>
          <div className="text-dark small">{message}</div>
        </div>
        <button
          className="btn btn-sm text-muted ms-2"
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
          }}
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;
