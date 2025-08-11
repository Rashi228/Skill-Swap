// EmailJS Configuration
// Replace these values with your actual EmailJS credentials
// You can get these from your EmailJS dashboard at https://dashboard.emailjs.com/

export const emailConfig = {
  // Your EmailJS service ID (found in Email Services section)
  serviceId: 'YOUR_SERVICE_ID',
  
  // Your EmailJS template ID (found in Email Templates section)
  templateId: 'YOUR_TEMPLATE_ID',
  
  // Your EmailJS public key (found in Account > API Keys section)
  publicKey: 'YOUR_PUBLIC_KEY',
  
  // Optional: Different template for feedback vs contact
  feedbackTemplateId: 'YOUR_FEEDBACK_TEMPLATE_ID', // Can be same as templateId
};

// Template variables that will be available in your EmailJS templates:
// - from_name: Sender's name
// - from_email: Sender's email
// - message: The message content
// - to_name: Recipient name (e.g., "SkillSwap Support")
// - subject: Email subject (for feedback form)

// Example EmailJS template structure:
/*
Subject: {{subject}}

Hello {{to_name}},

You have received a new message from {{from_name}} ({{from_email}}):

{{message}}

Best regards,
SkillSwap Team
*/ 