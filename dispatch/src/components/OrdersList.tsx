import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import './OrdersList.css';
import { Order } from '../types/Order';

interface OrdersListProps {
  onSelectOrder: (orderId: string) => void;
  selectedOrderId: string | null;
  onOrderSelectionChange?: (selectedOrderIds: string[]) => void;
}

// Define the imperative handle type for ref
export interface OrdersListHandle {
  refreshOrders: () => void;
}

const OrdersList = forwardRef<OrdersListHandle, OrdersListProps>(({ 
  onSelectOrder, 
  selectedOrderId,
  onOrderSelectionChange
}, ref) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track selected orders for assignment
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // API endpoint for orders with the "Open" state and specific state IDs
      // This includes "In Oven" (393518bd-5207-4aba-b910-81cb2e7343f4) and "Pending Delivery" (118b88e6-013e-45db-8608-d8b2358ecbb4)
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
      
      // Clear selections if any selected orders are no longer in the list
      setSelectedOrderIds(prev => 
        prev.filter(id => data.some((order: Order) => order.id === id))
      );
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch orders. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [onSelectOrder, selectedOrderId]);

  // Expose the refreshOrders method via ref
  useImperativeHandle(ref, () => ({
    refreshOrders: fetchOrders
  }));

  // Initial fetch and setup refresh interval
  useEffect(() => {
    fetchOrders();
    
    // Refresh every 10 seconds
    const intervalId = setInterval(fetchOrders, 10000);
    
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
            toggleOrderSelection(selectedOrderId);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orders, selectedOrderId, onSelectOrder]);

  // Toggle selection of an order for driver assignment
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => {
      const newSelection = prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId];
      
      // Notify parent of selection change
      if (onOrderSelectionChange) {
        onOrderSelectionChange(newSelection);
      }
      
      return newSelection;
    });
  };

  // Select all visible orders
  const selectAllOrders = () => {
    const allOrderIds = orders.map(order => order.id);
    setSelectedOrderIds(allOrderIds);
    
    if (onOrderSelectionChange) {
      onOrderSelectionChange(allOrderIds);
    }
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedOrderIds([]);
    
    if (onOrderSelectionChange) {
      onOrderSelectionChange([]);
    }
  };

  // Helper to get a readable state name
  const getReadableStateName = (order: Order): string => {
    if (!order.stateInfo) return 'Unknown';
    
    // Convert key to readable name
    const stateKey = order.stateInfo.key;
    if (stateKey === 'in-oven') return 'In Oven';
    if (stateKey === 'pending-delivery') return 'Pending Delivery';
    
    return order.stateInfo.name || 'Unknown';
  };

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
      <h2 className="orders-list-title">
        Pending Deliveries ({orders.length})
        <div className="selection-controls">
          {selectedOrderIds.length > 0 ? (
            <span className="selection-count">{selectedOrderIds.length} selected</span>
          ) : null}
          {orders.length > 0 && (
            <>
              <button 
                className="selection-btn select-all"
                onClick={selectAllOrders}
                title="Select all orders"
              >
                All
              </button>
              {selectedOrderIds.length > 0 && (
                <button 
                  className="selection-btn clear-all"
                  onClick={clearSelections}
                  title="Clear selection"
                >
                  Clear
                </button>
              )}
            </>
          )}
        </div>
      </h2>
      <div className="orders-list-container">
        {orders.map((order) => (
          <div 
            key={order.id}
            className={`order-item ${selectedOrderId === order.id ? 'selected' : ''} ${selectedOrderIds.includes(order.id) ? 'assigned' : ''} ${order.stateInfo?.key === 'in-oven' ? 'in-oven' : ''}`}
            onClick={() => onSelectOrder(order.id)}
          >
            <div className="order-selection">
              <input 
                type="checkbox"
                checked={selectedOrderIds.includes(order.id)}
                onChange={() => toggleOrderSelection(order.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="order-content">
            <div className="order-header">
              <span className="order-id">#{order.orderNumber}</span>
              <span className="order-time">{new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="order-customer">{order.customerName}</div>
            <div className="order-address">{order.shippingAddress.streetName} {order.shippingAddress.streetNumber}</div>
            <div className="order-address-details">
              {order.shippingAddress.postalCode} {order.shippingAddress.city}
            </div>
              <div className="order-state-info">
                <span className={`order-state ${order.stateInfo?.key || 'unknown'}`}>
                  {getReadableStateName(order)}
                </span>
              </div>
            <div className="order-total">
              ${order.taxedPrice?.totalGross 
                ? (order.taxedPrice.totalGross.centAmount / 100).toFixed(2) 
                : (order.totalPrice.centAmount / 100).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default OrdersList; 