import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/api';
import styles from './ProfilePage.module.css';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'danger'>('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authApi.updateMe({ name });
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authApi.updateMe({ currentPassword, newPassword } as any);
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      await (authApi as any).deleteAccount();
      logout();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete account.');
    }
  };

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
        <div className={styles.navCenter}>
          <span className={styles.brandMark}>Ψ</span>
          <span className={styles.brandName}>Vi-Notes</span>
        </div>
        <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
      </nav>

      <main className={styles.main}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {getInitials(user?.name || 'U')}
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>{user?.name}</h1>
            <div className={styles.profileMeta}>
              <span>{user?.email}</span>
              <span className={styles.dot}>·</span>
              <span className={`${styles.roleBadge} ${styles[`role_${user?.role}`]}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.tabs}>
          {(['profile', 'password', 'danger'] as const).map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''} ${tab === 'danger' ? styles.dangerTab : ''}`}
              onClick={() => { setActiveTab(tab); setError(''); setSuccess(''); }}
            >
              {tab === 'profile' ? 'Edit profile' : tab === 'password' ? 'Change password' : 'Danger zone'}
            </button>
          ))}
        </div>

        {success && <div className={styles.successMsg}>{success}</div>}
        {error && <div className={styles.errorMsg}>{error}</div>}

        {activeTab === 'profile' && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Profile information</h2>
            <form onSubmit={handleUpdateProfile} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Full name</label>
                <input
                  className={styles.input}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  value={user?.email || ''}
                  disabled
                />
                <span className={styles.hint}>Email cannot be changed</span>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Role</label>
                <input
                  className={styles.input}
                  type="text"
                  value={user?.role || ''}
                  disabled
                />
                <span className={styles.hint}>Role cannot be changed</span>
              </div>
              <button className={styles.saveBtn} type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Change password</h2>
            <form onSubmit={handleChangePassword} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Current password</label>
                <input
                  className={styles.input}
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>New password</label>
                <input
                  className={styles.input}
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, upper, lower and number"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Confirm new password</label>
                <input
                  className={styles.input}
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>
              <button className={styles.saveBtn} type="submit" disabled={loading}>
                {loading ? 'Changing…' : 'Change password'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Danger zone</h2>
            <div className={styles.dangerCard}>
              <div>
                <div className={styles.dangerTitle}>Delete account</div>
                <div className={styles.dangerDesc}>
                  Permanently delete your account and all your sessions, reports and data. This cannot be undone.
                </div>
              </div>
              <button className={styles.deleteBtn} onClick={handleDeleteAccount}>
                Delete account
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
