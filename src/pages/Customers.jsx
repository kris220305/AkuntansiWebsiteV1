import React, { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { useTranslation } from 'react-i18next';

const Customers = () => {
  const { state, dispatch } = useStore();
const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
// Statement modal state
const [showStatement, setShowStatement] = useState(false);
const [statementCustomer, setStatementCustomer] = useState(null);

const openStatement = (customer) => {
  setStatementCustomer(customer);
  setShowStatement(true);
};

const closeStatement = () => {
  setShowStatement(false);
  setStatementCustomer(null);
};
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    taxId: '',
    creditLimit: 0,
    paymentTerms: 30,
    contactPerson: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const customer = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
      balance: 0
    };
    
    dispatch({ type: 'ADD_CUSTOMER', payload: customer });
    setShowForm(false);
    setFormData({
      code: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      taxId: '',
      creditLimit: 0,
      paymentTerms: 30,
      contactPerson: '',
      notes: ''
    });
  };

  const customers = state.customers || [];

  // Search & Sorting
  const [query, setQuery] = useState('');
  const [custSort, setCustSort] = useState({ key: 'name', dir: 'asc' });
  const filteredCustomers = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c => (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    ));
  }, [customers, query]);

  const sortedCustomers = React.useMemo(() => {
    const arr = [...filteredCustomers];
    const { key, dir } = custSort;
    arr.sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const isNum = typeof va === 'number' && typeof vb === 'number';
      if (isNum) return dir === 'asc' ? va - vb : vb - va;
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sa === sb) return 0;
      if (dir === 'asc') return sa > sb ? 1 : -1;
      return sa < sb ? 1 : -1;
    });
    return arr;
  }, [filteredCustomers, custSort]);

  const toggleCustSort = (key) => {
    setCustSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  // Invoices for selected customer
  const customerInvoices = React.useMemo(() => {
    if (!statementCustomer) return [];
    const docs = (state.salesDocuments || []).filter(doc => doc.type === 'invoice' && (
      (doc.customer && statementCustomer?.name && doc.customer === statementCustomer.name) ||
      (doc.customerCode && statementCustomer?.code && doc.customerCode === statementCustomer.code)
    ));
    const now = new Date();
    return docs.map(doc => {
      const due = doc.dueDate ? new Date(doc.dueDate) : null;
      const diffDays = due ? Math.floor((now - due) / (1000 * 60 * 60 * 24)) : 0;
      const daysOverdue = diffDays > 0 ? diffDays : 0;
      const amount = typeof doc.totalIDR === 'number' ? doc.totalIDR : doc.total;
      return {
        id: doc.id || doc.docNumber || doc.number || doc.code || String(Math.random()),
        number: doc.docNumber || doc.number || doc.code || String(doc.id || ''),
        date: doc.date || '',
        dueDate: doc.dueDate || '',
        amount,
        daysOverdue,
      };
    });
  }, [state.salesDocuments, statementCustomer]);

  const statementAging = React.useMemo(() => {
    const buckets = { current: 0, '1_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 };
    customerInvoices.forEach(inv => {
      const amt = Number(inv.amount) || 0;
      const d = inv.daysOverdue || 0;
      if (d === 0) buckets.current += amt;
      else if (d <= 30) buckets['1_30'] += amt;
      else if (d <= 60) buckets['31_60'] += amt;
      else if (d <= 90) buckets['61_90'] += amt;
      else buckets['90_plus'] += amt;
    });
    const total = Object.values(buckets).reduce((a, b) => a + b, 0);
    return { ...buckets, total, count: customerInvoices.length };
  }, [customerInvoices]);

  const exportStatementCSV = () => {
    if (!statementCustomer) return;
    const rows = [
      ['Customer', statementCustomer.name || '', 'Code', statementCustomer.code || ''],
      ['Total Invoices', String(statementAging.count), 'Total Amount', String(statementAging.total)],
      [],
      ['Invoice #', 'Date', 'Due', 'Amount', 'Days Overdue'],
      ...customerInvoices.map(inv => [inv.number, inv.date, inv.dueDate, inv.amount, inv.daysOverdue]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_statement_${(statementCustomer.code || statementCustomer.name || 'customer')}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="customers-page">
      <div className="page-header">
        <h1>Customer Management</h1>
        <button className="btn primary" onClick={() => setShowForm(true)}>
          + New Customer
        </button>
      </div>

      <div className="customers-content">
        <div className="toolbar" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <input
            type="search"
            placeholder="Search name/email/city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: '1 1 auto' }}
          />
        </div>
        {customers.length === 0 ? (
          <div className="empty-state">
            <p>No customers found. Add your first customer!</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => toggleCustSort('code')}>Code</th>
                <th onClick={() => toggleCustSort('name')}>Name</th>
                <th onClick={() => toggleCustSort('email')}>Email</th>
                <th onClick={() => toggleCustSort('phone')}>Phone</th>
                <th onClick={() => toggleCustSort('city')}>City</th>
                <th onClick={() => toggleCustSort('creditLimit')}>Credit Limit</th>
                <th onClick={() => toggleCustSort('balance')}>Balance</th>
                <th onClick={() => toggleCustSort('paymentTerms')}>Payment Terms</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.code}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.city}</td>
                  <td>Rp {customer.creditLimit.toLocaleString()}</td>
                  <td className={customer.balance > 0 ? 'positive' : customer.balance < 0 ? 'negative' : ''}>
                    Rp {customer.balance.toLocaleString()}
                  </td>
                  <td>{customer.paymentTerms} days</td>
                  <td>
                    <button className="btn ghost small">Edit</button>
                    <button className="btn ghost small">View</button>
                    <button className="btn ghost small" onClick={() => openStatement(customer)}>{t ? t('statement') : 'Statement'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showStatement && statementCustomer && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h2>{t ? t('customerStatement') : 'Customer Statement'}</h2>
              <button className="btn ghost" onClick={closeStatement}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '12px' }}>
                <strong>{statementCustomer.name}</strong> ({statementCustomer.code})<br />
                {statementCustomer.email} • {statementCustomer.city}
              </div>

              <div className="card" style={{ marginBottom: '12px' }}>
                <h3>{t ? t('summary') : 'Summary'}</h3>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div>{t ? t('totalInvoices') : 'Total Invoices'}: {statementAging.count}</div>
                  <div>{t ? t('totalAmount') : 'Total Amount'}: Rp {Number(statementAging.total).toLocaleString()}</div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: '12px' }}>
                <h3>{t ? t('arAgingSummary') : 'A/R Aging Summary'}</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t ? t('bucket') : 'Bucket'}</th>
                      <th>{t ? t('amount') : 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>{t ? t('current') : 'Current'}</td><td>Rp {Number(statementAging.current).toLocaleString()}</td></tr>
                    <tr><td>{t ? t('days_1_30') : '1-30 days'}</td><td>Rp {Number(statementAging['1_30']).toLocaleString()}</td></tr>
                    <tr><td>{t ? t('days_31_60') : '31-60 days'}</td><td>Rp {Number(statementAging['31_60']).toLocaleString()}</td></tr>
                    <tr><td>{t ? t('days_61_90') : '61-90 days'}</td><td>Rp {Number(statementAging['61_90']).toLocaleString()}</td></tr>
                    <tr><td>{t ? t('days_90_plus') : '90+ days'}</td><td>Rp {Number(statementAging['90_plus']).toLocaleString()}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h3>{t ? t('invoices') : 'Invoices'}</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t ? t('invoice') : 'Invoice #'}</th>
                      <th>{t ? t('date') : 'Date'}</th>
                      <th>{t ? t('due') : 'Due'}</th>
                      <th>{t ? t('amount') : 'Amount'}</th>
                      <th>{t ? t('daysOverdue') : 'Days Overdue'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInvoices.map(inv => (
                      <tr key={inv.id || inv.number}>
                        <td>{inv.number}</td>
                        <td>{inv.date || '-'}</td>
                        <td>{inv.dueDate || '-'}</td>
                        <td>Rp {Number(inv.amount).toLocaleString()}</td>
                        <td>{inv.daysOverdue}</td>
                      </tr>
                    ))}
                    {customerInvoices.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', opacity: 0.6 }}>No invoices found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn ghost" onClick={exportStatementCSV}>{t ? t('exportCsv') : 'Export CSV'}</button>
              <button className="btn" onClick={() => window.print()}>{t ? t('print') : 'Print'}</button>
              <button className="btn primary" onClick={closeStatement}>{t ? t('close') : 'Close'}</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h2>New Customer</h2>
              <button className="btn ghost" onClick={() => setShowForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="customer-form">
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Customer Code</label>
                    <input 
                      type="text" 
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({...prev, code: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Customer Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Contact Person</label>
                  <input 
                    type="text" 
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({...prev, contactPerson: e.target.value}))}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Address Information</h3>
                <div className="form-group">
                  <label>Address</label>
                  <textarea 
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input 
                      type="text" 
                      value={formData.postalCode}
                      onChange={(e) => setFormData(prev => ({...prev, postalCode: e.target.value}))}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Business Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tax ID (NPWP)</label>
                    <input 
                      type="text" 
                      value={formData.taxId}
                      onChange={(e) => setFormData(prev => ({...prev, taxId: e.target.value}))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Terms (days)</label>
                    <input 
                      type="number" 
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData(prev => ({...prev, paymentTerms: parseInt(e.target.value) || 30}))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Credit Limit</label>
                  <input 
                    type="number" 
                    value={formData.creditLimit}
                    onChange={(e) => setFormData(prev => ({...prev, creditLimit: parseFloat(e.target.value) || 0}))}
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;