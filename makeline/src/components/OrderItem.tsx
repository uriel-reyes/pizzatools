import React from 'react';
import PizzaItem from './PizzaItem';
import './OrderItem.css';
import Order from '../types/Order';

interface OrderItemProps {
  order: Order;
  isActive: boolean;
  onComplete: () => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, isActive, onComplete }) => {
  // Remove the debug output that was causing excessive re-renders
  
  const activeClass = isActive ? 'active' : '';
  
  // Safely check for empty line items array
  if (!order.lineItems || !Array.isArray(order.lineItems) || order.lineItems.length === 0) {
    console.warn(`Order ${order.id} has no line items`);
    return (
      <div className={`order-container ${activeClass} order-empty`}>
        <div className="order-header">
          <h2>{order.orderNumber ? `#${order.orderNumber}` : `Order: ${order.id.substring(0, 6)}`}</h2>
          <div className="order-meta">
            <span className="order-time">Received: {new Date(order.createdAt).toLocaleTimeString()}</span>
            <span className="order-state">No items found</span>
          </div>
        </div>
        <div className="order-error">This order has no items to display</div>
      </div>
    );
  }
  
  // Format the timestamp to be more readable
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error(`Error formatting date ${dateString}:`, e);
      return dateString; // Return the original string if formatting fails
    }
  };

  // Calculate total number of pizzas (considering quantities)
  const totalPizzaCount = order.lineItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Get a user-friendly display ID - either orderNumber or a shorter version of the ID
  const displayId = order.orderNumber || order.id.substring(0, 6);
  
  // Add a CSS class based on the order state
  const orderStateClass = order.stateInfo?.key ? `order-state-${order.stateInfo.key}` : '';

  return (
    <div className={`order-container ${activeClass} ${orderStateClass}`}>
      <div className="order-header">
        <h2>#{displayId}</h2>
        <div className="order-meta">
          <span className="order-time">Received: {formatDate(order.createdAt)}</span>
          <span className="order-state">
            Status: <span className="state-name" data-status={order.stateInfo?.key || 'unknown'}>
              {order.stateInfo?.name || 'Preparing'}
            </span>
          </span>
        </div>
      </div>
      <div className="order-items">
        <h3>Pizzas ({totalPizzaCount})</h3>
        {order.lineItems.map((pizza, index) => (
          <PizzaItem key={index} pizza={pizza} />
        ))}
      </div>
      {isActive && (
        <div className="order-controls">
          <div className="action-instruction" onClick={onComplete}>
            Press <span className="key-hint">ENTER</span> to move to "In Oven"
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderItem;