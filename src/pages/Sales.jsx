import React, { useState } from 'react';
import { useStore } from '../state/store.jsx';
import NumberInput from '../components/NumberInput.jsx';
import { formatCurrency, nextDocNumber } from '../lib/format.js';

const Sales = () => {
  const { state, dispatch } = useStore();
  const [activeTab, setActiveTab] = useState('quotes');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'quote', // quote, order, invoice
    customer: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    currency: 'IDR',
    exchangeRate: 1,
    items: [{ description: '', quantity: 1, price: 0, amount: 0 }],
    subtotal: 0,
    tax: 0,
    total: 0,
    subtotalIDR: 0,
    taxIDR: 0,
    totalIDR: 0,
    notes: ''
  });

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, price: 0, amount: 0 }]
    }));
  };

  const handleCurrencyChange = (currency) => {
    const currencies = state.currencies || [{ code: 'IDR', rate: 1 }];
    const selectedCurrency = currencies.find(c => c.code === currency) || { code: 'IDR', rate: 1 };
    
    setFormData(prev => {
      const subtotal = prev.items.reduce((sum, item) => sum + item.amount, 0);
      const tax = subtotal * 0.11;
      const total = subtotal + tax;
      const exchangeRate = selectedCurrency.rate;
      
      return {
        ...prev,
        currency,
        exchangeRate,
        subtotal,
        tax,
        total,
        subtotalIDR: subtotal * exchangeRate,
        taxIDR: tax * exchangeRate,
        totalIDR: total * exchangeRate
      };
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].price;
    }
    
    const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.11; // 11% PPN
    const total = subtotal + tax;
    const exchangeRate = formData.exchangeRate;
    
    setFormData(prev => ({
      ...prev,
      items: newItems,
      subtotal,
      tax,
      total,
      subtotalIDR: subtotal * exchangeRate,
      taxIDR: tax * exchangeRate,
      totalIDR: total * exchangeRate
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add to sales data in state
    const prefix = formData.type === 'quote' ? 'SQ' : (formData.type === 'order' ? 'SO' : 'SI');
    const docNumber = nextDocNumber(prefix);
    const salesDoc = {
      id: Date.now(),
      docNumber,
      ...formData,
      createdAt: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_SALES_DOCUMENT', payload: salesDoc });
    setShowForm(false);
    setFormData({
      type: 'quote',
      customer: '',
      date: new Date().toISOString().slice(0, 10),
      dueDate: '',
      items: [{ description: '', quantity: 1, price: 0, amount: 0 }],
      subtotal: 0,
      tax: 0,
      total: 0,
      notes: ''
    });
  };

  const salesDocs = state.salesDocuments || [];
  const filteredDocs = salesDocs.filter(doc => doc.type === activeTab.slice(0, -1));

  return (
    <div className="sales-page">
      <div className="page-header">
        <h1>Sales Management</h1>
        <button className="btn primary" onClick={() => setShowForm(true)}>
          + New {activeTab.slice(0, -1)}
        </button>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'quotes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quotes')}
        >
          Sales Quotes
        </button>
        <button 
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Sales Orders
        </button>
        <button 
          className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Sales Invoices
        </button>
      </div>

      <div className="sales-list">
        {filteredDocs.length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab} found. Create your first {activeTab.slice(0, -1)}!</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id}>
                  <td>{new Date(doc.date).toLocaleDateString()}</td>
                  <td>{doc.customer}</td>
                  <td>Rp {doc.total.toLocaleString()}</td>
                  <td>
                    <span className="status-badge">Draft</span>
                  </td>
                  <td>
                    <button className="btn ghost small">Edit</button>
                    <button className="btn ghost small">Print</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>New Sales {formData.type}</h2>
              <button className="btn ghost" onClick={() => setShowForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="sales-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData(prev => ({...prev, type: e.target.value}))}
                  >
                    <option value="quote">Quote</option>
                    <option value="order">Order</option>
                    <option value="invoice">Invoice</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Customer</label>
                  <input 
                    type="text" 
                    value={formData.customer}
                    onChange={(e) => setFormData(prev => ({...prev, customer: e.target.value}))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input 
                    type="date" 
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({...prev, dueDate: e.target.value}))}
                  />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select 
                    value={formData.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                  >
                    {(state.currencies || [{ code: 'IDR', name: 'Indonesian Rupiah', rate: 1 }]).map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} (Rate: {currency.rate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="items-section">
                <h3>Items</h3>
                {formData.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <input 
                      type="text" 
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                    <NumberInput 
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(value) => handleItemChange(index, 'quantity', value)}
                      allowNegative={false}
                      min={0}
                    />
                    <NumberInput 
                      placeholder="Price"
                      value={item.price}
                      onChange={(value) => handleItemChange(index, 'price', value)}
                      allowNegative={false}
                      min={0}
                    />
                    <NumberInput 
                      placeholder="Amount"
                      value={item.amount}
                      disabled={true}
                    />
                  </div>
                ))}
                <button type="button" className="btn ghost" onClick={handleAddItem}>
                  + Add Item
                </button>
              </div>

              <div className="totals-section">
                <div className="total-row">
                  <span>Subtotal ({formData.currency}):</span>
                  <span>{formatCurrency(formData.subtotal, formData.currency)}</span>
                </div>
                <div className="total-row">
                  <span>Tax (11%) ({formData.currency}):</span>
                  <span>{formatCurrency(formData.tax, formData.currency)}</span>
                </div>
                <div className="total-row total">
                  <span>Total ({formData.currency}):</span>
                  <span>{formatCurrency(formData.total, formData.currency)}</span>
                </div>
                {formData.currency !== 'IDR' && (
                  <>
                    <div className="total-row">
                      <span>Subtotal (IDR):</span>
                      <span>{formatCurrency(formData.subtotalIDR, 'IDR')}</span>
                    </div>
                    <div className="total-row">
                      <span>Tax (IDR):</span>
                      <span>{formatCurrency(formData.taxIDR, 'IDR')}</span>
                    </div>
                    <div className="total-row total">
                      <span>Total (IDR):</span>
                      <span>{formatCurrency(formData.totalIDR, 'IDR')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Save {formData.type}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;