// EmailJS Configuration
// Replace these values with your actual EmailJS credentials
// You can get these from your EmailJS dashboard at https://dashboard.emailjs.com/

export const emailConfig = {
  // Your EmailJS service ID (found in Email Services section)
  serviceId: 'service_vgt7nih',
  
  // Your EmailJS template ID (found in Email Templates section)
  templateId: 'template_x3obcut',
  
  // Your EmailJS public key (found in Account > API Keys section)
  publicKey: 'kk1EwJi7EIZImeB0R',
  
  // Optional: Different template for feedback vs contact
  feedbackTemplateId: 'template_x3obcut', // Can be same as templateId
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