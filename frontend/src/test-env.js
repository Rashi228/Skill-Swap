// Test environment variable
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Full URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me`); 