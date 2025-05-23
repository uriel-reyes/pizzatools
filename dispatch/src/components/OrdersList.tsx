import React, { useState, useEffect, useCallback } from 'react';
import './OrdersList.css';
import { Order } from '../types/Order';

interface OrdersListProps {
  onSelectOrder: (orderId: string) => void;
  selectedOrderId: string | null;
}

const OrdersList: React.FC<OrdersListProps> = ({ onSelectOrder, selectedOrderId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // API endpoint for orders with the "Open" state and specific state IDs
      const response = await fetch('http://localhost:3001/api/orders?state=Open&stateId=118b88e6-013e-45db-8608-d8b2358ecbb4,393518bd-5207-4aba-b910-81cb2e7343f4&method=delivery&storeKey=9267');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setOrders(data);
      
      // Auto-select the first order if none is selected
      if (data.length > 0 && !selectedOrderId) {
        onSelectOrder(data[0].id);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch orders. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [onSelectOrder, selectedOrderId]);

  // Initial fetch and setup refresh interval
  useEffect(() => {
    fetchOrders();
    
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchOrders, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!orders.length) return;
      
      const currentIndex = selectedOrderId 
        ? orders.findIndex(order => order.id === selectedOrderId) 
        : -1;
      
      switch (e.key) {
        case 'ArrowUp':
          if (currentIndex > 0) {
            onSelectOrder(orders[currentIndex - 1].id);
          }
          break;
        case 'ArrowDown':
          if (currentIndex < orders.length - 1) {
            onSelectOrder(orders[currentIndex + 1].id);
          }
          break;
        case 'Enter':
          if (selectedOrderId) {
            // Mark as delivered logic would go here
            console.log(`Order ${selectedOrderId} marked as delivered`);
            // In a real app, this would call an API endpoint
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orders, selectedOrderId, onSelectOrder]);

  if (loading && orders.length === 0) {
    return <div className="orders-list-loading">Loading delivery orders...</div>;
  }

  if (error && orders.length === 0) {
    return <div className="orders-list-error">{error}</div>;
  }

  if (orders.length === 0) {
    return <div className="orders-list-empty">No delivery orders waiting</div>;
  }

  return (
    <div className="orders-list">
      <h2 className="orders-list-title">Pending Deliveries ({orders.length})</h2>
      <div className="orders-list-container">
        {orders.map((order) => (
          <div 
            key={order.id}
            className={`order-item ${selectedOrderId === order.id ? 'selected' : ''}`}
            onClick={() => onSelectOrder(order.id)}
          >
            <div className="order-header">
              <span className="order-id">#{order.orderNumber}</span>
              <span className="order-time">{new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="order-customer">{order.customerName}</div>
            <div className="order-address">{order.shippingAddress.streetName} {order.shippingAddress.streetNumber}</div>
            <div className="order-address-details">
              {order.shippingAddress.postalCode} {order.shippingAddress.city}
            </div>
            <div className="order-total">${order.totalPrice.centAmount / 100}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersList; 