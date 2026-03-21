import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import styles from './PasswordReset.module.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BASE_URL}/auth/forgot-password`, { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.successIcon}>✉</div>
        <h2 className={styles.title}>Check your email</h2>
        <p className={styles.desc}>
          If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your inbox.
        </p>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>Ψ</span>
          <span className={styles.brandName}>Vi-Notes</span>
        </div>
        <h2 className={styles.title}>Forgot password?</h2>
        <p className={styles.desc}>Enter your email and we'll send you a reset link.</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          {error && <div className={styles.error}>{error}</div>}
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
};

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BASE_URL}/auth/reset-password`, { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.title}>Password reset!</h2>
        <p className={styles.desc}>Redirecting you to login…</p>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>Ψ</span>
          <span className={styles.brandName}>Vi-Notes</span>
        </div>
        <h2 className={styles.title}>Reset your password</h2>
        <p className={styles.desc}>Choose a new password for your account.</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="New password (min 8 chars)"
            required
          />
          <input
            className={styles.input}
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            required
          />
          {error && <div className={styles.error}>{error}</div>}
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export { ForgotPassword, ResetPassword };
