# EmailJS Setup Guide

This guide will help you set up EmailJS to enable real email sending functionality for the contact and feedback forms.

## Step 1: Create an EmailJS Account

1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Add Email Service

1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the authentication steps
5. Note down the **Service ID** (you'll need this later)

## Step 3: Create Email Templates

### Contact Form Template
1. Go to "Email Templates"
2. Click "Create New Template"
3. Name it "Contact Form Template"
4. Use this template structure:

```
Subject: New Contact Message from {{from_name}}

Hello {{to_name}},

You have received a new contact message:

**From:** {{from_name}} ({{from_email}})
**Message:**
{{message}}

Best regards,
SkillSwap Team
```

5. Save the template and note down the **Template ID**

### Feedback Form Template (Optional)
1. Create another template named "Feedback Template"
2. Use this structure:

```
Subject: {{subject}}

Hello {{to_name}},

You have received new feedback:

**From:** {{from_name}} ({{from_email}})
**Feedback:**
{{message}}

Best regards,
SkillSwap Team
```

## Step 4: Get Your Public Key

1. Go to "Account" > "API Keys"
2. Copy your **Public Key**

## Step 5: Configure the Application

1. Open `frontend/src/config/emailConfig.js`
2. Replace the placeholder values with your actual credentials:

```javascript
export const emailConfig = {
  serviceId: 'your_service_id_here',
  templateId: 'your_contact_template_id_here',
  publicKey: 'your_public_key_here',
  feedbackTemplateId: 'your_feedback_template_id_here', // Optional
};
```

## Step 6: Test the Setup

1. Start your development server: `npm run dev`
2. Go to the Contact page (`/contact`) or the main page feedback form
3. Fill out and submit a test message
4. Check your email to confirm the message was received

## Troubleshooting

### Common Issues:

1. **"Failed to send message" error**
   - Check that all credentials are correct in `emailConfig.js`
   - Verify your EmailJS service is properly connected
   - Check browser console for detailed error messages

2. **Template variables not working**
   - Ensure template variable names match exactly (case-sensitive)
   - Check that your EmailJS template uses the correct variable syntax: `{{variable_name}}`

3. **Service not found**
   - Verify your Service ID is correct
   - Make sure your email service is active in EmailJS dashboard

### EmailJS Limits:
- Free tier: 200 emails per month
- Paid plans available for higher limits

## Security Notes

- The public key is safe to expose in frontend code
- Never expose private keys or service credentials
- EmailJS handles the email sending securely on their servers

## Support

- EmailJS Documentation: https://www.emailjs.com/docs/
- EmailJS Support: https://www.emailjs.com/support/ 