require('dotenv').config();
const EmailService = require('./src/utils/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');
  
  // Check if configured
  if (!EmailService.isConfigured()) {
    console.log('❌ Email service not configured!');
    console.log('Please check your .env file has all required variables.');
    return;
  }
  
  console.log('✅ Email service is configured');
  
  // Test connection
  console.log('🔌 Testing connection...');
  try {
    const isConnected = await EmailService.testConnection();
    if (isConnected) {
      console.log('✅ Email service connection successful!');
    } else {
      console.log('❌ Email service connection failed!');
      return;
    }
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return;
  }
  
  // Test sending email
  console.log('📧 Testing email send...');
  try {
    const result = await EmailService.sendPasswordResetEmail(
      process.env.EMAIL_USER, // Send to yourself for testing
      'http://localhost:5173/reset-password/test-token',
      'Test User'
    );
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('\n🎉 Email service is working perfectly!');
    
  } catch (error) {
    console.log('❌ Email send failed:', error.message);
    
    if (error.message.includes('Refresh token expired')) {
      console.log('\n💡 Solution: Run "node setup-oauth.js" to generate new tokens');
    }
  }
}

testEmailService().catch(console.error);
