import React, { useState, useEffect, useCallback, useRef } from 'react';
import OrderItem from './OrderItem';
import './OrderList.css';
import Order from '../types/Order';

interface OrdersListProps {
  onOrderCompleted: () => void;
}

const OrdersList: React.FC<OrdersListProps> = ({ onOrderCompleted }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderIndex, setActiveOrderIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create refs for each order item
  const orderRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Reset refs when orders change
  useEffect(() => {
    orderRefs.current = orderRefs.current.slice(0, orders.length);
  }, [orders]);

  // Scroll active order into view when it changes
  useEffect(() => {
    if (activeOrderIndex >= 0 && orderRefs.current[activeOrderIndex]) {
      orderRefs.current[activeOrderIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeOrderIndex]);

  // Fetch orders from the backend
  const fetchOrders = useCallback(async () => {
    try {
      console.log('Fetching orders...');
      setLoading(true);
      const response = await fetch('http://localhost:3001/orders');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Orders received:', data);
      
      if (!Array.isArray(data)) {
        console.error('Received non-array data:', data);
        setError('Received invalid data format from the server');
        return;
      }
      
      if (data.length === 0) {
        console.log('No orders to display');
      }
      
      setOrders(data);
      // Set activeOrderIndex to 0 if there are orders, otherwise -1
      setActiveOrderIndex(data.length > 0 ? 0 : -1);
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders. See console for details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    
    // Set up a polling interval to refresh orders
    const intervalId = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  // Update the order status on the backend
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log(`Updating order ${orderId} to ${newStatus}...`);
      const response = await fetch(`http://localhost:3001/orders/${orderId}/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state: newStatus })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
      }

      const result = await response.json();
      console.log('Update response:', result);

      // Remove the order from the list
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      
      // Adjust active index if needed
      setActiveOrderIndex(prev => {
        // If we removed the last order or an order before the active one
        if (prev >= orders.length - 1) {
          // If there are still orders, select the last one
          return Math.max(0, orders.length - 2);
        } else if (prev > 0) {
          // Keep the same index as it will now point to the next order
          return prev;
        }
        // If we're at the first order and there are more orders, stay at 0
        return orders.length > 1 ? 0 : -1;
      });
      
      // Show a temporary success message
      console.log(`Order ${orderId} moved to ${newStatus}`);
      
      // Call the callback to update the completion time
      onOrderCompleted();
      
    } catch (error) {
      console.error(`Error updating order ${orderId} to ${newStatus}:`, error);
      setError(`Failed to update order. See console for details.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard navigation and actions
  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    if (orders.length === 0) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setActiveOrderIndex(prev => Math.max(prev - 1, 0));
        break;
      
      case 'ArrowDown':
        event.preventDefault();
        setActiveOrderIndex(prev => Math.min(prev + 1, orders.length - 1));
        break;
      
      case 'Enter':
        event.preventDefault();
        if (activeOrderIndex >= 0 && activeOrderIndex < orders.length) {
          await updateOrderStatus(orders[activeOrderIndex].id, 'in-oven');
        }
        break;
      
      default:
        break;
    }
  }, [orders, activeOrderIndex]);

  useEffect(() => {
    // Add event listener for keyboard navigation
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Render loading state
  if (loading && orders.length === 0) {
    return <div className="loading-message">Loading orders...</div>;
  }

  // Render error state
  if (error && orders.length === 0) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchOrders}>Try Again</button>
      </div>
    );
  }

  // Render empty state
  if (orders.length === 0) {
    return <div className="no-orders">No orders to display</div>;
  }

  return (
    <div className="orders-list">
      {orders.map((order, index) => (
        <div 
          ref={el => orderRefs.current[index] = el} 
          key={order.id}
          className="order-wrapper"
        >
          <OrderItem 
            order={order} 
            isActive={index === activeOrderIndex} 
            onComplete={() => updateOrderStatus(order.id, 'in-oven')}
          />
        </div>
      ))}
      <div className="order-status">
        {loading ? 'Updating order...' : `${orders.length} order(s) ready for preparation`}
      </div>
    </div>
  );
};

export default OrdersList;