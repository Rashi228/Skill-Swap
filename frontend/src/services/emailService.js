import emailjs from '@emailjs/browser';
import { emailConfig } from '../config/emailConfig';

class EmailService {
  /**
   * Send a contact form message
   * @param {Object} data - Form data
   * @param {string} data.name - Sender's name
   * @param {string} data.email - Sender's email
   * @param {string} data.message - Message content
   * @returns {Promise<Object>} EmailJS response
   */
  static async sendContactMessage(data) {
    return emailjs.send(
      emailConfig.serviceId,
      emailConfig.templateId,
      {
        from_name: data.name,
        from_email: data.email,
        message: data.message,
        to_name: 'SkillSwap Support',
      },
      emailConfig.publicKey
    );
  }

  /**
   * Send a feedback form message
   * @param {Object} data - Form data
   * @param {string} data.name - Sender's name
   * @param {string} data.email - Sender's email
   * @param {string} data.feedback - Feedback content
   * @returns {Promise<Object>} EmailJS response
   */
  static async sendFeedbackMessage(data) {
    return emailjs.send(
      emailConfig.serviceId,
      emailConfig.feedbackTemplateId || emailConfig.templateId,
      {
        from_name: data.name,
        from_email: data.email,
        message: data.feedback,
        to_name: 'SkillSwap Team',
        subject: 'Feedback from SkillSwap Website'
      },
      emailConfig.publicKey
    );
  }

  /**
   * Send a custom email message
   * @param {Object} data - Email data
   * @param {string} data.from_name - Sender's name
   * @param {string} data.from_email - Sender's email
   * @param {string} data.message - Message content
   * @param {string} data.to_name - Recipient name
   * @param {string} data.subject - Email subject
   * @param {string} templateId - Optional custom template ID
   * @returns {Promise<Object>} EmailJS response
   */
  static async sendCustomMessage(data, templateId = null) {
    return emailjs.send(
      emailConfig.serviceId,
      templateId || emailConfig.templateId,
      data,
      emailConfig.publicKey
    );
  }

  /**
   * Check if EmailJS is properly configured
   * @returns {boolean} True if all required config values are set
   */
  static isConfigured() {
    return emailConfig.serviceId && 
           emailConfig.templateId && 
           emailConfig.publicKey &&
           emailConfig.serviceId !== 'YOUR_SERVICE_ID' &&
           emailConfig.templateId !== 'YOUR_TEMPLATE_ID' &&
           emailConfig.publicKey !== 'YOUR_PUBLIC_KEY';
  }
}

export default EmailService; 