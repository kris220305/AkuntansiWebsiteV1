import React, { useState } from 'react';
import { useStore } from '../state/store.jsx';

const MultiCurrency = () => {
  const { state, dispatch } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    rate: 1,
    isBase: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const currency = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_CURRENCY', payload: currency });
    setShowForm(false);
    setFormData({
      code: '',
      name: '',
      symbol: '',
      rate: 1,
      isBase: false
    });
  };

  const currencies = state.currencies || [
    { id: 1, code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', rate: 1, isBase: true, lastUpdated: new Date().toISOString() }
  ];

  const updateRate = (currencyId, newRate) => {
    dispatch({ 
      type: 'UPDATE_CURRENCY_RATE', 
      payload: { id: currencyId, rate: newRate, lastUpdated: new Date().toISOString() } 
    });
  };

  return (
    <div className="multi-currency-page">
      <div className="page-header">
        <h1>Multi-Currency Management</h1>
        <button className="btn primary" onClick={() => setShowForm(true)}>
          + Add Currency
        </button>
      </div>

      <div className="currency-content">
        <div className="currency-info">
          <div className="info-card">
            <h3>Exchange Rate Information</h3>
            <p>Base Currency: <strong>IDR (Indonesian Rupiah)</strong></p>
            <p>Last Updated: <strong>{new Date().toLocaleDateString()}</strong></p>
            <button className="btn ghost">Update All Rates</button>
          </div>
        </div>

        <div className="currencies-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Currency Code</th>
                <th>Currency Name</th>
                <th>Symbol</th>
                <th>Exchange Rate</th>
                <th>Base Currency</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map(currency => (
                <tr key={currency.id}>
                  <td>
                    <strong>{currency.code}</strong>
                  </td>
                  <td>{currency.name}</td>
                  <td>{currency.symbol}</td>
                  <td>
                    {currency.isBase ? (
                      <span className="base-rate">1.00 (Base)</span>
                    ) : (
                      <input 
                        type="number" 
                        value={currency.rate}
                        onChange={(e) => updateRate(currency.id, parseFloat(e.target.value))}
                        className="rate-input"
                        step="0.01"
                      />
                    )}
                  </td>
                  <td>
                    {currency.isBase ? (
                      <span className="status-badge success">Base</span>
                    ) : (
                      <span className="status-badge">Foreign</span>
                    )}
                  </td>
                  <td>{new Date(currency.lastUpdated).toLocaleDateString()}</td>
                  <td>
                    {!currency.isBase && (
                      <>
                        <button className="btn ghost small">Edit</button>
                        <button className="btn ghost small">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="currency-converter">
          <div className="converter-card">
            <h3>Currency Converter</h3>
            <div className="converter-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input type="number" placeholder="Enter amount" />
                </div>
                <div className="form-group">
                  <label>From</label>
                  <select>
                    {currencies.map(currency => (
                      <option key={currency.id} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>To</label>
                  <select>
                    {currencies.map(currency => (
                      <option key={currency.id} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="converter-result">
                <strong>Result: Rp 0</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Currency</h2>
              <button className="btn ghost" onClick={() => setShowForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="currency-form">
              <div className="form-section">
                <div className="form-row">
                  <div className="form-group">
                    <label>Currency Code</label>
                    <input 
                      type="text" 
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({...prev, code: e.target.value.toUpperCase()}))}
                      placeholder="USD, EUR, SGD"
                      maxLength="3"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Currency Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      placeholder="US Dollar"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Symbol</label>
                    <input 
                      type="text" 
                      value={formData.symbol}
                      onChange={(e) => setFormData(prev => ({...prev, symbol: e.target.value}))}
                      placeholder="$, €, S$"
                      maxLength="3"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Exchange Rate (to IDR)</label>
                    <input 
                      type="number" 
                      value={formData.rate}
                      onChange={(e) => setFormData(prev => ({...prev, rate: parseFloat(e.target.value) || 1}))}
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={formData.isBase}
                      onChange={(e) => setFormData(prev => ({...prev, isBase: e.target.checked}))}
                    />
                    Set as base currency
                  </label>
                  <small>Note: Only one currency can be set as base currency</small>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Add Currency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiCurrency;