import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../state/store.jsx';
import { useTranslation } from 'react-i18next';
import NumberInput from '../components/NumberInput.jsx';
import { formatCurrency } from '../lib/format.js';
import AnimatedCard from '../components/AnimatedCard.jsx';
import { addAudit } from '../lib/engine.js';

const STORAGE_KEY = 'kriss_manual_customers';

const Receivables = () => {
  const { state, dispatch } = useStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    creditLimit: 0,
    paymentTerms: 30
  });

  // Tambah state untuk pelanggan manual yang ditambahkan dari Receivables
  const [manualCustomers, setManualCustomers] = useState([]);

  // Load manual customers from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setManualCustomers(parsed);
      }
    } catch (e) {
      console.warn('Failed to load manual customers from localStorage', e);
    }
  }, []);

  // Persist manual customers to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(manualCustomers));
    } catch (e) {
      console.warn('Failed to save manual customers to localStorage', e);
    }
  }, [manualCustomers]);
  // Mock data - in real app this would come from state
  const customers = [
    {
      id: 1,
      name: 'PT. ABC Company',
      email: 'contact@abc.com',
      creditLimit: 50000000,
      currentBalance: 25000000,
      overdue: 5000000,
      paymentTerms: 30,
      lastPayment: '2024-01-15'
    },
    {
      id: 2,
      name: 'CV. XYZ Trading',
      email: 'info@xyz.com',
      creditLimit: 30000000,
      currentBalance: 35000000, // Over limit
      overdue: 15000000,
      paymentTerms: 14,
      lastPayment: '2023-12-20'
    }
  ];

  // Gabungkan daftar pelanggan default dengan pelanggan manual
  const allCustomers = useMemo(() => [...customers, ...manualCustomers], [customers, manualCustomers]);

  // Ambil invoice dari Sales (state.salesDocuments) dan hitung daysOverdue
  const salesInvoices = useMemo(() => (state.salesDocuments || []).filter(doc => doc.type === 'invoice'), [state.salesDocuments]);
  const invoices = useMemo(() => {
    const now = new Date();
    return salesInvoices.map(doc => {
      const due = doc.dueDate ? new Date(doc.dueDate) : null;
      const diffDays = due ? Math.floor((now - due) / (1000 * 60 * 60 * 24)) : 0;
      const daysOverdue = diffDays > 0 ? diffDays : 0;
      const status = daysOverdue > 0 ? 'overdue' : 'pending';
      const amount = typeof doc.totalIDR === 'number' ? doc.totalIDR : doc.total;
      return {
        id: doc.docNumber || doc.id,
        customer: doc.customer,
        amount,
        dueDate: doc.dueDate || doc.date,
        status,
        daysOverdue,
        dunningLevel: doc.dunningLevel || 0,
        lastReminderAt: doc.lastReminderAt || null,
      };
    });
  }, [salesInvoices]);

  const agingSummary = useMemo(() => {
    const buckets = { current: 0, '1_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 };
    invoices.forEach(inv => {
      const d = inv.daysOverdue || 0;
      if (d <= 0) buckets.current += inv.amount;
      else if (d <= 30) buckets['1_30'] += inv.amount;
      else if (d <= 60) buckets['31_60'] += inv.amount;
      else if (d <= 90) buckets['61_90'] += inv.amount;
      else buckets['90_plus'] += inv.amount;
    });
    return buckets;
  }, [invoices]);

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    const newCustomer = {
      id: Date.now(),
      name: customerForm.name.trim(),
      email: customerForm.email.trim(),
      phone: customerForm.phone.trim(),
      address: customerForm.address.trim(),
      creditLimit: Number(customerForm.creditLimit) || 0,
      paymentTerms: Number(customerForm.paymentTerms) || 30,
      currentBalance: 0,
      overdue: 0,
      lastPayment: null,
      createdAt: new Date().toISOString(),
      manual: true,
    };
    setManualCustomers(prev => [...prev, newCustomer]);
    addAudit({ user: 'system', action: 'add_customer_manual', ref: newCustomer.id, meta: { name: newCustomer.name, email: newCustomer.email } });
    dispatch({ type: 'SET_SUCCESS', payload: 'Customer added successfully' });
    setShowCustomerForm(false);
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      creditLimit: 0,
      paymentTerms: 30
    });
  };

  // Tambahkan handler hapus untuk pelanggan manual
  const [lastDeleted, setLastDeleted] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const handleDeleteCustomer = (id) => {
    const removed = manualCustomers.find(c => c.id === id);
    if (!removed) return;
    if (!window.confirm('Hapus pelanggan ini?')) return;
    setManualCustomers(prev => prev.filter(c => c.id !== id));
    setLastDeleted(removed);
    setShowUndo(true);
    addAudit({ user: 'system', action: 'delete_customer_manual', ref: id, meta: { name: removed?.name } });
    dispatch({ type: 'SET_SUCCESS', payload: 'Customer removed' });
  };

  const undoDeleteCustomer = () => {
    if (lastDeleted) {
      setManualCustomers(prev => [...prev, lastDeleted]);
      addAudit({ user: 'system', action: 'undo_delete_customer_manual', ref: lastDeleted.id, meta: { name: lastDeleted.name } });
      dispatch({ type: 'SET_SUCCESS', payload: 'Undo delete customer' });
    }
    setLastDeleted(null);
    setShowUndo(false);
  };

  const getTotalReceivables = () => {
    return allCustomers.reduce((sum, customer) => sum + customer.currentBalance, 0);
  };

  const getTotalOverdue = () => {
    return allCustomers.reduce((sum, customer) => sum + customer.overdue, 0);
  };

  const getCustomersOverLimit = () => {
    return allCustomers.filter(customer => customer.currentBalance > customer.creditLimit);
  };

  // Dunning: kirim pengingat
  const handleRemind = (invoice) => {
    dispatch({ type: 'SEND_DUNNING_REMINDER', ref: invoice.id });
    addAudit({ user: 'system', action: 'dunning_reminder', ref: invoice.id, meta: { customer: invoice.customer, daysOverdue: invoice.daysOverdue } });
    dispatch({ type: 'SET_SUCCESS', payload: 'Reminder sent' });
  };

  // Sorting untuk invoice
  const [invSort, setInvSort] = useState({ key: 'daysOverdue', dir: 'desc' });
  const sortedInvoices = useMemo(() => {
    const arr = [...invoices];
    const { key, dir } = invSort;
    arr.sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (va === vb) return 0;
      if (dir === 'asc') return va > vb ? 1 : -1;
      return va < vb ? 1 : -1;
    });
    return arr;
  }, [invoices, invSort]);

  const toggleInvSort = (key) => {
    setInvSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  return (
    <div className="receivables-page">
      <div className="page-header">
        <h1>Receivables Management</h1>
        <button 
          className="btn primary"
          onClick={() => setShowCustomerForm(true)}
        >
          + Add Customer
        </button>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          {t('overview', { defaultValue: 'Overview' })}
        </button>
        <button 
          className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          {t('customers', { defaultValue: 'Customers' })}
        </button>
        <button 
          className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          {t('outstandingInvoices', { defaultValue: 'Outstanding Invoices' })}
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="stats-grid">
            <AnimatedCard className="stat-card" glowEffect={true} tiltEffect={true}>
              <h3>Total Receivables</h3>
              <div className="stat-value">{formatCurrency(getTotalReceivables(), 'IDR')}</div>
            </AnimatedCard>
            <AnimatedCard className="stat-card warning" glowEffect={true} tiltEffect={true}>
              <h3>Total Overdue</h3>
              <div className="stat-value">{formatCurrency(getTotalOverdue(), 'IDR')}</div>
            </AnimatedCard>
            <AnimatedCard className="stat-card danger" glowEffect={true} tiltEffect={true}>
              <h3>Customers Over Limit</h3>
              <div className="stat-value">{getCustomersOverLimit().length}</div>
            </AnimatedCard>
            <AnimatedCard className="stat-card" glowEffect={true} tiltEffect={true}>
              <h3>Total Customers</h3>
              <div className="stat-value">{allCustomers.length}</div>
            </AnimatedCard>
          </div>

          <div className="alerts-section">
            <h3>Alerts</h3>
            {getCustomersOverLimit().length > 0 && (
              <div className="alert danger">
                <strong>Credit Limit Exceeded:</strong>
                <ul>
                  {getCustomersOverLimit().map(customer => (
                    <li key={customer.id}>
                      {customer.name} - Over by {formatCurrency(customer.currentBalance - customer.creditLimit, 'IDR')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {invoices.filter(inv => inv.status === 'overdue').length > 0 && (
              <div className="alert warning">
                <strong>Overdue Invoices:</strong>
                <ul>
                  {invoices.filter(inv => inv.status === 'overdue').map(invoice => (
                    <li key={invoice.id}>
                      {invoice.id} - {invoice.customer} - {invoice.daysOverdue} days overdue
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="aging-section">
            <h3>{t('arAgingSummary', { defaultValue: 'A/R Aging Summary' })}</h3>
            <table className="data-table" role="table" aria-label="A/R Aging Summary">
              <thead>
                <tr>
                  <th>Bucket</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Current</td>
                  <td>{formatCurrency(agingSummary.current, 'IDR')}</td>
                </tr>
                <tr>
                  <td>1-30 days</td>
                  <td>{formatCurrency(agingSummary['1_30'], 'IDR')}</td>
                </tr>
                <tr>
                  <td>31-60 days</td>
                  <td>{formatCurrency(agingSummary['31_60'], 'IDR')}</td>
                </tr>
                <tr>
                  <td>61-90 days</td>
                  <td>{formatCurrency(agingSummary['61_90'], 'IDR')}</td>
                </tr>
                <tr>
                  <td>90+ days</td>
                  <td>{formatCurrency(agingSummary['90_plus'], 'IDR')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="customers-section">
          {showUndo && (
            <div className="alert info">
              <span>Pelanggan dihapus.</span>
              <button className="btn ghost small" onClick={undoDeleteCustomer}>Undo</button>
            </div>
          )}
          <table className="data-table" role="table" aria-label="Customers">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Credit Limit</th>
                <th>Current Balance</th>
                <th>Available Credit</th>
                <th>Overdue Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allCustomers.map(customer => (
                <tr key={customer.id}>
                  <td>
                    <div>
                      <strong>{customer.name}</strong>
                      <div className="text-small">{customer.email}</div>
                    </div>
                  </td>
                  <td>{formatCurrency(customer.creditLimit, 'IDR')}</td>
                  <td>{formatCurrency(customer.currentBalance, 'IDR')}</td>
                  <td>
                    <span className={customer.currentBalance > customer.creditLimit ? 'text-danger' : 'text-success'}>
                      {formatCurrency(Math.max(0, customer.creditLimit - customer.currentBalance), 'IDR')}
                    </span>
                  </td>
                  <td>
                    <span className={customer.overdue > 0 ? 'text-danger' : ''}>
                      {formatCurrency(customer.overdue, 'IDR')}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      customer.currentBalance > customer.creditLimit ? 'danger' : 
                      customer.overdue > 0 ? 'warning' : 'success'
                    }`}>
                      {customer.currentBalance > customer.creditLimit ? 'Over Limit' : 
                       customer.overdue > 0 ? 'Has Overdue' : 'Good'}
                    </span>
                  </td>
                  <td>
                    <button className="btn ghost small">Edit</button>
                    <button className="btn ghost small">Statement</button>
                    {customer.manual && (
                      <button className="btn ghost small" onClick={()=>handleDeleteCustomer(customer.id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="invoices-section">
          <table className="data-table" role="table" aria-label="Outstanding Invoices">
            <thead>
              <tr>
                <th onClick={() => toggleInvSort('id')}>Invoice #</th>
                <th onClick={() => toggleInvSort('customer')}>Customer</th>
                <th onClick={() => toggleInvSort('amount')}>Amount</th>
                <th onClick={() => toggleInvSort('dueDate')}>Due Date</th>
                <th onClick={() => toggleInvSort('daysOverdue')}>Days Overdue</th>
                <th onClick={() => toggleInvSort('dunningLevel')}>Dunning</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>{invoice.id}</td>
                  <td>{invoice.customer}</td>
                  <td>{formatCurrency(invoice.amount, 'IDR')}</td>
                  <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td>
                    <span className={invoice.daysOverdue > 0 ? 'text-danger' : ''}>
                      {invoice.daysOverdue > 0 ? invoice.daysOverdue : '-'}
                    </span>
                  </td>
                  <td>
                    <div>
                      <span className="text-small">Level: {invoice.dunningLevel || 0}</span>
                      <div className="text-small">Last: {invoice.lastReminderAt ? new Date(invoice.lastReminderAt).toLocaleDateString() : '-'}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${invoice.status === 'overdue' ? 'danger' : 'warning'}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn ghost small">{t('payment', { defaultValue: 'Payment' })}</button>
                    <button className="btn ghost small" onClick={() => handleRemind(invoice)}>{t('remind', { defaultValue: 'Remind' })}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCustomerForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Customer</h2>
              <button className="btn ghost" onClick={() => setShowCustomerForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleCustomerSubmit} className="customer-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input 
                    type="text" 
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm(prev => ({...prev, name: e.target.value}))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm(prev => ({...prev, email: e.target.value}))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="tel" 
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm(prev => ({...prev, phone: e.target.value}))}
                  />
                </div>
                <div className="form-group">
                  <label>Payment Terms (days)</label>
                  <NumberInput 
                    value={customerForm.paymentTerms}
                    onChange={(value) => setCustomerForm(prev => ({...prev, paymentTerms: value}))}
                    min={1}
                    max={365}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea 
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm(prev => ({...prev, address: e.target.value}))}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Credit Limit (IDR)</label>
                <NumberInput 
                  value={customerForm.creditLimit}
                  onChange={(value) => setCustomerForm(prev => ({...prev, creditLimit: value}))}
                  min={0}
                  allowNegative={false}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn ghost" onClick={() => setShowCustomerForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receivables;