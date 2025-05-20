
import React from 'react';
import { Link } from 'react-router-dom';
import AuthForm from '@/components/auth/AuthForm';

const Register = () => {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <span className="text-xl font-bold text-primary">XYZ Ltd</span>
          <span className="text-lg">Parking Management</span>
        </Link>
        <AuthForm type="register" />
      </div>
    </div>
  );
};

export default Register;