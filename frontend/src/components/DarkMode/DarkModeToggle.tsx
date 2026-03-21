import React from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import styles from './DarkModeToggle.module.css';

const DarkModeToggle: React.FC = () => {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      className={styles.toggle}
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle dark mode"
    >
      <span className={styles.icon}>{isDark ? '☀' : '☽'}</span>
    </button>
  );
};

export default DarkModeToggle;
