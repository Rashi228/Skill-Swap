# Environment Setup for Local Development

## Frontend Environment Variables

Create a `.env` file in the `frontend/` directory with the following content:

```
VITE_API_URL=http://localhost:5000
```

## Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following content:

```
JWT_SECRET=your-secure-secret-key-here
MONGODB_URI=mongodb://localhost:27017/skillswap
PORT=5000
```

## Steps to Fix Authentication Issues:

1. **Create the environment files** as shown above
2. **Restart both servers** after creating the environment files
3. **Clear browser localStorage** if you have old tokens from production
4. **Check browser console** for any error messages

## Verification:

- Frontend should be running on: `http://localhost:5173`
- Backend should be running on: `http://localhost:5000`
- Check browser console for: `VITE_API_URL: http://localhost:5000`

## Troubleshooting:

If you still get logged out after refresh:
1. Check browser console for error messages
2. Verify both servers are running
3. Check that the JWT_SECRET is properly set
4. Clear browser cache and localStorage

