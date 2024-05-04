import React from 'react';
import PizzaItem from './PizzaItem';

interface Pizza {
  id: string;
  productName: string;
  ingredients: string[];
}

interface Order {
  id: string;
  lineItems: Pizza[];
}

interface OrderItemProps {
  order: Order;
}

const OrderItem: React.FC<OrderItemProps> = ({ order }) => {
  return (
    <div>
      <h2>Order ID: {order.id}</h2>
      {order.lineItems.map((pizza, index) => (
        <PizzaItem key={pizza.id} pizza={pizza} />
      ))}
    </div>
  );
};

export default OrderItem;
