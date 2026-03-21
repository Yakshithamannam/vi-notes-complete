import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Auth.module.css';

type Mode = 'login' | 'register';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>Ψ</span>
        <span className={styles.brandName}>Vi-Notes</span>
      </div>

      <div className={styles.card}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.activeTab : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign in
          </button>
          <button
            className={`${styles.tab} ${mode === 'register' ? styles.activeTab : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'register' && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Full name</label>
                <input
                  className={styles.input}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>I am a</label>
                <select
                  className={styles.input}
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="user">Writer / Student</option>
                  <option value="educator">Educator / Reviewer</option>
                </select>
              </div>
            </>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Min 8 chars, include upper, lower & number' : '••••••••'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className={styles.footer}>
          Authenticity verification powered by behavioral biometrics.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
