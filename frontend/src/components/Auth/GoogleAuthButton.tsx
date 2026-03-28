import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ onSuccess, onError }) => {
  const { loginWithGoogle } = useAuth();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      await loginWithGoogle(credentialResponse.credential);
      onSuccess?.();
    } catch (err: any) {
      onError?.(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleError = () => {
    onError?.('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          shape="rectangular"
          theme="outline"
          size="large"
          text="continue_with"
          width="340"
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleAuthButton;
