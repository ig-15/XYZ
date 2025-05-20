
# XYZ Ltd Parking Management System

## Frontend Integration Guide

This document explains how to integrate the React frontend with your backend API.

### Backend Integration

1. Create a `.env` file in the project root based on `.env.example`
2. Set your backend API URL in the `.env` file:

```
VITE_API_BASE_URL=http://your-backend-url/api
```

3. Make sure your backend implements the API endpoints as expected by the frontend:

- Authentication endpoints (`/auth/login`, `/auth/register`, `/auth/me`)
- Parking management endpoints (`/parkings`)
- Car management endpoints (`/cars`)
- Entry/exit management endpoints (`/entries`)
- Ticket management endpoints (`/tickets`)
- User management endpoints (`/users`)
- Dashboard statistics endpoints (`/dashboard/admin`, `/dashboard/attendant`, `/dashboard/user`)

4. Ensure your backend API responses match the data structures defined in `src/types/index.ts`

### API Service Configuration

The frontend uses Axios for API communication. The API service is configured in `src/services/api.ts`:

- Requests include Authorization headers with JWT token
- Responses are intercepted to handle errors and authentication issues
- All API endpoints are organized by domain (auth, parking, entry, etc.)

### Testing the Integration

1. Start your backend server
2. Start the frontend with `npm run dev`
3. Try to login with a valid user account from your backend
4. Check the network tab in your browser's developer tools to ensure requests/responses are working correctly

### Error Handling

If you encounter issues with the integration:

1. Check if the API URL is correct in the `.env` file
2. Verify that your backend API matches the expected response structures
3. Check the browser console and network tab for errors
4. Ensure CORS is properly configured on your backend to accept requests from the frontend

