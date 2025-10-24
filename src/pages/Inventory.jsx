import React, { useState } from 'react';
import { useStore } from '../state/store.jsx';

const Inventory = () => {
  const { state, dispatch } = useStore();
  const [activeTab, setActiveTab] = useState('items');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    unit: 'pcs',
    costPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 0,
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const item = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_INVENTORY_ITEM', payload: item });
    setShowForm(false);
    setFormData({
      code: '',
      name: '',
      category: '',
      unit: 'pcs',
      costPrice: 0,
      sellPrice: 0,
      stock: 0,
      minStock: 0,
      description: ''
    });
  };

  const inventoryItems = state.inventoryItems || [];
  const lowStockItems = inventoryItems.filter(item => item.stock <= item.minStock);

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1>Inventory Management</h1>
        <button className="btn primary" onClick={() => setShowForm(true)}>
          + New Item
        </button>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          All Items ({inventoryItems.length})
        </button>
        <button 
          className={`tab ${activeTab === 'lowstock' ? 'active' : ''}`}
          onClick={() => setActiveTab('lowstock')}
        >
          Low Stock ({lowStockItems.length})
        </button>
        <button 
          className={`tab ${activeTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          Stock Movements
        </button>
      </div>

      <div className="inventory-content">
        {activeTab === 'items' && (
          <div className="items-list">
            {inventoryItems.length === 0 ? (
              <div className="empty-state">
                <p>No inventory items found. Add your first item!</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Unit</th>
                    <th>Cost Price</th>
                    <th>Sell Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td className={item.stock <= item.minStock ? 'low-stock' : ''}>
                        {item.stock}
                      </td>
                      <td>{item.unit}</td>
                      <td>Rp {item.costPrice.toLocaleString()}</td>
                      <td>Rp {item.sellPrice.toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${item.stock <= item.minStock ? 'warning' : 'success'}`}>
                          {item.stock <= item.minStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td>
                        <button className="btn ghost small">Edit</button>
                        <button className="btn ghost small">Adjust</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'lowstock' && (
          <div className="low-stock-list">
            {lowStockItems.length === 0 ? (
              <div className="empty-state">
                <p>No low stock items. All items are well stocked!</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Current Stock</th>
                    <th>Min Stock</th>
                    <th>Shortage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item.name}</td>
                      <td className="low-stock">{item.stock}</td>
                      <td>{item.minStock}</td>
                      <td className="shortage">{item.minStock - item.stock}</td>
                      <td>
                        <button className="btn primary small">Reorder</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="movements-list">
            <div className="empty-state">
              <p>Stock movement tracking will be implemented here.</p>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>New Inventory Item</h2>
              <button className="btn ghost" onClick={() => setShowForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="inventory-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Item Code</label>
                  <input 
                    type="text" 
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({...prev, code: e.target.value}))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Item Name</label>
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
                  <label>Category</label>
                  <input 
                    type="text" 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select 
                    value={formData.unit} 
                    onChange={(e) => setFormData(prev => ({...prev, unit: e.target.value}))}
                  >
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kilogram</option>
                    <option value="ltr">Liter</option>
                    <option value="box">Box</option>
                    <option value="set">Set</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cost Price</label>
                  <input 
                    type="number" 
                    value={formData.costPrice}
                    onChange={(e) => setFormData(prev => ({...prev, costPrice: parseFloat(e.target.value) || 0}))}
                  />
                </div>
                <div className="form-group">
                  <label>Sell Price</label>
                  <input 
                    type="number" 
                    value={formData.sellPrice}
                    onChange={(e) => setFormData(prev => ({...prev, sellPrice: parseFloat(e.target.value) || 0}))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Initial Stock</label>
                  <input 
                    type="number" 
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({...prev, stock: parseFloat(e.target.value) || 0}))}
                  />
                </div>
                <div className="form-group">
                  <label>Minimum Stock</label>
                  <input 
                    type="number" 
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({...prev, minStock: parseFloat(e.target.value) || 0}))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;