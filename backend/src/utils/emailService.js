const nodemailer = require('nodemailer');
const { google } = require('googleapis');

class EmailService {
  /**
   * Get OAuth2 access token with automatic refresh
   * @returns {Promise<string>} Access token
   */
  static async getAccessToken() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    try {
      const { token } = await oauth2Client.getAccessToken();
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      
      // If refresh token is invalid, try to get a new one
      if (error.message.includes('invalid_grant') || error.code === 400) {
        console.log('Refresh token expired. Please generate a new one using: node setup-oauth.js');
        throw new Error('Refresh token expired. Please regenerate OAuth tokens.');
      }
      
      throw new Error('Failed to get access token');
    }
  }

  /**
   * Create transporter with OAuth2 and retry logic
   * @returns {Promise<Object>} Nodemailer transporter
   */
  static async createTransporter() {
    try {
      const accessToken = await this.getAccessToken();
      
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
          accessToken: accessToken
        }
      });
    } catch (error) {
      console.error('Failed to create transporter:', error);
      throw error;
    }
  }

  /**
   * Send password reset email with retry logic
   * @param {string} to - Recipient email
   * @param {string} resetUrl - Password reset URL
   * @param {string} firstName - User's first name
   * @returns {Promise<Object>} Email send result
   */
  static async sendPasswordResetEmail(to, resetUrl, firstName) {
    let transporter;
    let retries = 3;

    while (retries > 0) {
      try {
        transporter = await this.createTransporter();
        
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: to,
          subject: 'Password Reset Request - SkillSwap',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #185a9d 0%, #43cea2 100%); padding: 20px; border-radius: 10px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">SkillSwap</h1>
              </div>
              
              <div style="padding: 30px 20px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
                <h2 style="color: #185a9d; margin-bottom: 20px;">Password Reset Request</h2>
                
                <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
                  Hello ${firstName},
                </p>
                
                <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
                  You requested a password reset for your SkillSwap account. Click the button below to reset your password:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background: linear-gradient(135deg, #185a9d 0%, #43cea2 100%); 
                            color: white; 
                            padding: 15px 30px; 
                            text-decoration: none; 
                            border-radius: 25px; 
                            display: inline-block;
                            font-weight: bold;
                            font-size: 16px;
                            box-shadow: 0 4px 15px rgba(24, 90, 157, 0.3);">
                    Reset Password
                  </a>
                </div>
                
                <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #6c757d; margin: 0; font-size: 14px;">
                    <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                  </p>
                </div>
                
                <p style="color: #6c757d; font-size: 14px; margin-bottom: 20px;">
                  If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                </p>
                
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                
                <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 0;">
                  Best regards,<br>
                  <strong>SkillSwap Team</strong>
                </p>
              </div>
            </div>
          `
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
        
      } catch (error) {
        retries--;
        console.error(`Email send attempt failed (${3 - retries}/3):`, error.message);
        
        if (retries === 0) {
          console.error('All email send attempts failed');
          throw new Error('Failed to send email after multiple attempts');
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Test email configuration
   * @returns {boolean} True if email service is configured
   */
  static isConfigured() {
    return !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.EMAIL_USER
    );
  }

  /**
   * Test email service connectivity
   * @returns {Promise<boolean>} True if service is working
   */
  static async testConnection() {
    try {
      const transporter = await this.createTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service test failed:', error);
      return false;
    }
  }
}

module.exports = EmailService;
