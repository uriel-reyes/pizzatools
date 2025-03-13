import React from 'react';
import PizzaItem from './PizzaItem';
import './OrderItem.css';

interface Pizza {
  productName: string;
  ingredients: string[];
}

interface Order {
  id: string;
  createdAt: string;
  lineItems: Pizza[];
  state?: {
    typeId: string;
    id: string;
  };
}

interface OrderItemProps {
  order: Order;
  isActive: boolean;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, isActive }) => {
  // Debug output to console
  console.log('Rendering OrderItem:', order);
  
  const activeClass = isActive ? 'active' : '';
  
  // Safely check for empty line items array
  if (!order.lineItems || !Array.isArray(order.lineItems) || order.lineItems.length === 0) {
    console.warn(`Order ${order.id} has no line items`);
    return (
      <div className={`order-container ${activeClass} order-empty`}>
        <div className="order-header">
          <h2>Order: {order.id}</h2>
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

  return (
    <div className={`order-container ${activeClass}`}>
      <div className="order-header">
        <h2>Order: {order.id.substring(0, 8)}...</h2>
        <div className="order-meta">
          <span className="order-time">Received: {formatDate(order.createdAt)}</span>
          <span className="order-state">Status: {order.state ? order.state.id : 'Unknown'}</span>
        </div>
      </div>
      <div className="order-items">
        <h3>Pizzas ({order.lineItems.length})</h3>
        {order.lineItems.map((pizza, index) => (
          <PizzaItem key={index} pizza={pizza} />
        ))}
      </div>
      {isActive && (
        <div className="order-controls">
          <p>Press ENTER to move to "In Oven"</p>
        </div>
      )}
    </div>
  );
};

export default OrderItem;