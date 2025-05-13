import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './CustomerDashboard.css'; 

export default function CustomerDashboard() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get('/items-for-sale', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setItems(res.data);
      } catch (err) {
        console.error('Failed to fetch items:', err.response?.data || err.message);
      }
    };

    const fetchOrders = async () => {
      try {
        const res = await axios.get('/my-orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders:', err.response?.data || err.message);
      }
    };

    fetchItems();
    fetchOrders();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleAddToCart = (item) => {
    const alreadyInCart = cartItems.find(cart => cart.id === item.id);
    if (!alreadyInCart) {
      setCartItems([...cartItems, item]);
      alert(`"${item.name}" added to your cart.`);
    } else {
      alert(`"${item.name}" is already in your cart.`);
    }
  };

  const handleBuy = async (item) => {
    const quantity = prompt(`Enter quantity to buy (Available: ${item.quantity}):`);
    if (!quantity || isNaN(quantity) || quantity <= 0 || quantity > item.quantity) return;

    try {
      await axios.post('/buy-item', { item_id: item.id, quantity }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Order placed! Awaiting employee approval.');
      setCartItems(cartItems.filter(cartItem => cartItem.id !== item.id));

      const res = await axios.get('/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      alert(`Failed to place order: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleReceived = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const confirmReceived = async () => {
    try {
      await axios.post(`/mark-received/${selectedOrder.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Order marked as received!');
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrder.id ? { ...order, status: 'received' } : order
        )
      );
      setShowOrderModal(false);
    } catch (err) {
      alert(`Failed to mark as received: ${err.response?.data?.message || err.message}`);
    }
  };

  const toggleCart = () => {
    setShowCart(prev => !prev);
  };

  // Filter items based on the search query
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate the total price for each item in the cart
  const calculateTotal = (item, quantity) => {
    return item.price * quantity;
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>🛍️ Customer Dashboard</h2>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search for items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} // Update search query
        />
      </div>

      <div className="mb-3 d-flex gap-2">
        <button className={`btn ${showCart ? 'btn-dark' : 'btn-secondary'}`} onClick={toggleCart}>
          🛒 Your Cart ({cartItems.length})
        </button>
        <button className={`btn ${!showCart ? 'btn-dark' : 'btn-info'}`} onClick={toggleCart}>
          📦 Your Orders ({orders.length})
        </button>
      </div>

      {/* Orders Section */}
      {!showCart && (
        <div className="card mb-4 p-3 fade-slide show">
          <h5>📦 Your Orders:</h5>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <ul className="list-group">
              {orders.map(order => (
                <li key={order.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Item: {order.item?.name || 'Unknown'}</strong><br />
                    <span>Handled by: {order.employee_name || 'Unknown'}</span><br />
                    Quantity: {order.quantity}<br />
                    Status:{' '}
                    <span className={order.status === 'pending' ? 'badge bg-warning' :
                      order.status === 'accepted' ? 'badge bg-success' :
                      order.status === 'declined' ? 'badge bg-danger' :
                      order.status === 'received' ? 'badge bg-secondary' :
                      'badge bg-light text-dark'}>
                      {order.status}
                    </span>
                  </div>
                  {order.status === 'accepted' && (
                    <button className="btn btn-sm btn-primary" onClick={() => handleReceived(order)}>
                      Received
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Cart Section */}
      {showCart && (
        <div className="card mb-4 p-3 fade-slide show">
          <h5>🛒 Cart Items:</h5>
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <ul className="list-group">
              {cartItems.map(item => (
                <li className="list-group-item d-flex justify-content-between align-items-center" key={item.id}>
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={item.image ? `http://localhost:8000/storage/${item.image}` : 'https://via.placeholder.com/50'}
                      alt={item.name}
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <div>
                      <strong>{item.name}</strong><br />
                      ${item.price}
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-danger" onClick={() =>
                      setCartItems(cartItems.filter(cartItem => cartItem.id !== item.id))
                    }>
                      Remove
                    </button>
                    <button className="btn btn-sm btn-success" onClick={() => handleBuy(item)}>
                      Buy
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Item Cards */}
      <div className="row g-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div className="col-md-6 col-lg-4" key={item.id}>
              <div className="card h-100 shadow-sm">
                <img
                  src={item.image ? `http://localhost:8000/storage/${item.image}` : 'https://via.placeholder.com/150'}
                  alt={item.name}
                  className="card-img-top"
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5 className="card-title">{item.name}</h5>
                  <p className="card-text">{item.description || 'No description available'}</p>
                  <p className="card-text text-muted">Quantity: {item.quantity}</p>
                  <p className="card-text text-muted">Price: ${item.price}</p>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => handleAddToCart(item)}>
                      Add to Cart
                    </button>
                    <button className="btn btn-success btn-sm" onClick={() => handleBuy(item)}>
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No items found.</p>
        )}
      </div>

      {/* Modal: Order Details */}
      {selectedOrder && (
        <div className={`modal fade fade-slide ${showOrderModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowOrderModal(false)}></button>
              </div>
              <div className="modal-body">
                <p><strong>Item:</strong> {selectedOrder.item?.name || 'Unknown'}</p>
                <p><strong>Quantity:</strong> {selectedOrder.quantity}</p>
                <p><strong>Total Price:</strong> ${calculateTotal(selectedOrder.item, selectedOrder.quantity)}</p>
                <p><strong>Seller:</strong> {selectedOrder.employee_name || 'Unknown'}</p>
                <p><strong>Ordered At:</strong> {selectedOrder.created_at}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={confirmReceived}>Confirm Received</button>
                <button className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
