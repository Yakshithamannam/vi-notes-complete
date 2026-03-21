import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './GoogleLogin.module.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const GoogleLogin: React.FC<GoogleLoginProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
      });
      window.google?.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular',
        }
      );
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      const res = await axios.post(`${BASE_URL}/auth/google`, {
        googleToken: response.credential
      });
      const { token, user } = res.data;
      localStorage.setItem('vi_token', token);
      onSuccess?.();
      navigate('/dashboard');
    } catch (err: any) {
      onError?.(err.response?.data?.error || 'Google login failed.');
    }
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className={styles.notConfigured}>
        Google login not configured — add VITE_GOOGLE_CLIENT_ID to your .env file
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.divider}>
        <span className={styles.dividerText}>or</span>
      </div>
      <div id="google-signin-btn" className={styles.googleBtn} />
    </div>
  );
};

export default GoogleLogin;
