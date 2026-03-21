import React, { useState, useCallback } from 'react';
import styles from './SessionSearch.module.css';

export interface FilterState {
  search: string;
  status: string;
  sortBy: string;
}

interface SessionSearchProps {
  onFilterChange: (filters: FilterState) => void;
}

const SessionSearch: React.FC<SessionSearchProps> = ({ onFilterChange }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const handleChange = useCallback((
    newSearch = search,
    newStatus = status,
    newSort = sortBy
  ) => {
    onFilterChange({ search: newSearch, status: newStatus, sortBy: newSort });
  }, [search, status, sortBy, onFilterChange]);

  return (
    <div className={styles.searchBar}>
      <div className={styles.searchInput}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          type="text"
          placeholder="Search sessions…"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            handleChange(e.target.value, status, sortBy);
          }}
          className={styles.input}
        />
        {search && (
          <button className={styles.clearBtn} onClick={() => {
            setSearch('');
            handleChange('', status, sortBy);
          }}>✕</button>
        )}
      </div>

      <select
        className={styles.select}
        value={status}
        onChange={e => {
          setStatus(e.target.value);
          handleChange(search, e.target.value, sortBy);
        }}
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="analyzed">Analyzed</option>
        <option value="archived">Archived</option>
      </select>

      <select
        className={styles.select}
        value={sortBy}
        onChange={e => {
          setSortBy(e.target.value);
          handleChange(search, status, e.target.value);
        }}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="words">Most words</option>
        <option value="score">Highest score</option>
      </select>
    </div>
  );
};

export default SessionSearch;
