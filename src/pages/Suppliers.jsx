import React, { useState } from 'react';
import { useStore } from '../state/store.jsx';

const Suppliers = () => {
  const { state, dispatch } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    taxId: '',
    paymentTerms: 30,
    contactPerson: '',
    bankAccount: '',
    bankName: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const supplier = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
      balance: 0
    };
    
    dispatch({ type: 'ADD_SUPPLIER', payload: supplier });
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
      paymentTerms: 30,
      contactPerson: '',
      bankAccount: '',
      bankName: '',
      notes: ''
    });
  };

  const suppliers = state.suppliers || [];

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <h1>Supplier Management</h1>
        <button className="btn primary" onClick={() => setShowForm(true)}>
          + New Supplier
        </button>
      </div>

      <div className="suppliers-content">
        {suppliers.length === 0 ? (
          <div className="empty-state">
            <p>No suppliers found. Add your first supplier!</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>City</th>
                <th>Balance</th>
                <th>Payment Terms</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td>{supplier.code}</td>
                  <td>{supplier.name}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.city}</td>
                  <td className={supplier.balance > 0 ? 'positive' : supplier.balance < 0 ? 'negative' : ''}>
                    Rp {supplier.balance.toLocaleString()}
                  </td>
                  <td>{supplier.paymentTerms} days</td>
                  <td>
                    <button className="btn ghost small">Edit</button>
                    <button className="btn ghost small">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h2>New Supplier</h2>
              <button className="btn ghost" onClick={() => setShowForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="supplier-form">
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Supplier Code</label>
                    <input 
                      type="text" 
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({...prev, code: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Supplier Name</label>
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

                <div className="form-row">
                  <div className="form-group">
                    <label>Bank Name</label>
                    <input 
                      type="text" 
                      value={formData.bankName}
                      onChange={(e) => setFormData(prev => ({...prev, bankName: e.target.value}))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bank Account</label>
                    <input 
                      type="text" 
                      value={formData.bankAccount}
                      onChange={(e) => setFormData(prev => ({...prev, bankAccount: e.target.value}))}
                    />
                  </div>
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;