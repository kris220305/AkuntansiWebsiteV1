import React, { useState, useMemo } from 'react';
import { useStore } from '../state/store.jsx';
import JournalForm from '../components/JournalForm.jsx';
import AnimatedCard from '../components/AnimatedCard.jsx';
import { EngineState, addAudit } from '../lib/engine.js';

const Dashboard = () => {
  const { state, dispatch } = useStore();

  // Calculate summary statistics
  const totalJournals = state.journals?.length || 0;
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const isCurrentPeriodLocked = state.locks?.some(l => l.period === currentPeriod);

  // Filters for User Activity
  const [filterAction, setFilterAction] = useState('');
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredAudits = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    return (state.audits || []).filter(a => {
      const ts = a.at ? new Date(a.at) : null;
      const matchAction = filterAction ? a.action === filterAction : true;
      const q = query.trim().toLowerCase();
      const matchQuery = q ? (
        (a.user && a.user.toLowerCase().includes(q)) ||
        (a.action && a.action.toLowerCase().includes(q)) ||
        (a.ref && String(a.ref).toLowerCase().includes(q)) ||
        (a.meta && JSON.stringify(a.meta).toLowerCase().includes(q))
      ) : true;
      const matchFrom = from && ts ? ts >= from : true;
      const matchTo = to && ts ? ts <= to : true;
      return matchAction && matchQuery && matchFrom && matchTo;
    }).slice().reverse();
  }, [state.audits, filterAction, query, dateFrom, dateTo]);

  // Backup & Restore handlers
  const handleBackup = () => {
    const data = {
      theme: state.theme,
      language: state.language,
      journals: state.journals,
      locks: state.locks,
      audits: state.audits,
      salesDocuments: state.salesDocuments || [],
      purchaseDocuments: state.purchaseDocuments || [],
      customers: state.customers || [],
      suppliers: state.suppliers || [],
      currencies: state.currencies || [],
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kriss_backup_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addAudit({ user: 'system', action: 'backup_state', ref: 'download', meta: { items: Object.keys(data) } });
  };

  const handleRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      dispatch({ type: 'RESTORE_STATE', payload: json });
      addAudit({ user: 'system', action: 'restore_state', ref: file.name, meta: { size: file.size } });
    } catch (err) {
      console.error('Restore failed', err);
      dispatch({ type: 'SET_ERROR', payload: 'Restore failed: invalid file' });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Overview of your accounting system</p>
      </div>

      <div className="dashboard-stats">
        <AnimatedCard className="stat-card" glowEffect={true} tiltEffect={true}>
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{totalJournals}</h3>
            <p>Total Journal Entries</p>
          </div>
        </AnimatedCard>
        
        <AnimatedCard className="stat-card" glowEffect={true} tiltEffect={true}>
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{currentPeriod}</h3>
            <p>Current Period</p>
          </div>
        </AnimatedCard>
        
        <AnimatedCard className="stat-card" glowEffect={true} tiltEffect={true}>
          <div className="stat-icon">{isCurrentPeriodLocked ? '🔒' : '🔓'}</div>
          <div className="stat-content">
            <h3>{isCurrentPeriodLocked ? 'Locked' : 'Open'}</h3>
            <p>Period Status</p>
          </div>
        </AnimatedCard>
      </div>

      <div className="dashboard-content">
        <AnimatedCard className="dashboard-section" glowEffect={true} hover3d={true}>
          <h2>Quick Journal Entry</h2>
          <JournalForm />
        </AnimatedCard>

        <AnimatedCard className="dashboard-section" glowEffect={true} hover3d={true}>
          <h2>User Activity</h2>
          <div className="filters">
            <input
              type="text"
              placeholder="Cari aktivitas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="Filter From Date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="Filter To Date"
            />
            <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
              <option value="">All Actions</option>
              <option value="add_customer_manual">Add Customer (Manual)</option>
              <option value="delete_customer_manual">Delete Customer (Manual)</option>
              <option value="undo_delete_customer_manual">Undo Delete Customer</option>
              <option value="post">Post Journal</option>
              <option value="lock">Lock Period</option>
              <option value="unlock">Unlock Period</option>
              <option value="backup_state">Backup State</option>
              <option value="restore_state">Restore State</option>
              <option value="dunning_reminder_sent">Dunning Reminder Sent</option>
            </select>
          </div>
          <table className="data-table" role="table" aria-label="User Activity">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Reference</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudits.length === 0 && (
                <tr><td colSpan="5" className="text-center">No activity</td></tr>
              )}
              {filteredAudits.map((a, idx) => (
                <tr key={idx}>
                  <td>{a.at ? new Date(a.at).toLocaleString() : '-'}</td>
                  <td>{a.user || '-'}</td>
                  <td><span className="status-badge warning">{a.action}</span></td>
                  <td>{a.ref || '-'}</td>
                  <td><code>{a.meta ? JSON.stringify(a.meta) : '-'}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </AnimatedCard>

        <AnimatedCard className="dashboard-section" glowEffect={true} hover3d={true}>
          <h2>Backup & Restore</h2>
          <div className="actions">
            <button className="btn primary" onClick={handleBackup}>Backup State (JSON)</button>
            <label className="btn ghost" style={{ marginLeft: 8 }}>
              Restore from File
              <input type="file" accept="application/json" onChange={handleRestore} style={{ display: 'none' }} />
            </label>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
};

export default Dashboard;