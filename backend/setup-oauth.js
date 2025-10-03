require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// OAuth 2.0 setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback'
);

// Scopes for Gmail - make sure these match your OAuth consent screen
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose'
];

async function setupOAuth() {
  console.log('🔧 Setting up Gmail OAuth 2.0 for SkillSwap\n');
  
  // Check if environment variables are set
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('❌ Missing environment variables!');
    console.log('Please add these to your .env file:');
    console.log('GOOGLE_CLIENT_ID=your_client_id');
    console.log('GOOGLE_CLIENT_SECRET=your_client_secret');
    console.log('EMAIL_USER=your_gmail@gmail.com');
    console.log('\nThen run this script again.');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log('📧 Email User:', process.env.EMAIL_USER);
  console.log('🔑 Client ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
  console.log('🔗 Redirect URI:', process.env.GOOGLE_REDIRECT_URI);
  console.log('📋 Scopes:', SCOPES.join(', '));
  console.log('\n⚠️  IMPORTANT: Make sure these scopes are added to your OAuth consent screen!');
  console.log('   Go to: Google Cloud Console → APIs & Services → OAuth consent screen → Scopes\n');

  // Generate authorization URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    include_granted_scopes: true
  });

  console.log('📋 Follow these steps:');
  console.log('1. Open this URL in your browser:');
  console.log(authUrl);
  console.log('\n2. Sign in with your Gmail account:', process.env.EMAIL_USER);
  console.log('3. Grant ALL permissions to SkillSwap');
  console.log('4. Copy the authorization code from the URL');
  console.log('\n5. Paste the authorization code below:\n');

  rl.question('Authorization Code: ', async (code) => {
    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('\n✅ OAuth setup successful!');
      console.log('\n📝 Add these to your .env file:');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log(`GOOGLE_ACCESS_TOKEN=${tokens.access_token}`);
      
      if (tokens.refresh_token) {
        console.log('\n🎉 Refresh token obtained! Your OAuth setup is complete.');
        console.log('You can now restart your backend server and test password reset.');
        console.log('\n💡 Next steps:');
        console.log('1. Add the refresh token to your .env file');
        console.log('2. Restart your backend server');
        console.log('3. Test with: node test-email.js');
      } else {
        console.log('\n⚠️  No refresh token received. This might happen if:');
        console.log('   - You already granted permissions before');
        console.log('   - OAuth consent screen is not properly configured');
        console.log('   - Try revoking access and running the script again');
      }
      
    } catch (error) {
      console.error('\n❌ Error getting tokens:', error.message);
      console.log('\n🔍 Troubleshooting:');
      console.log('1. Make sure you copied the complete authorization code');
      console.log('2. Check that your OAuth consent screen has the correct scopes');
      console.log('3. Verify your client ID and secret are correct');
      console.log('4. Try using a fresh authorization code');
    }
    
    rl.close();
  });
}

// Run the setup
setupOAuth().catch(console.error);
