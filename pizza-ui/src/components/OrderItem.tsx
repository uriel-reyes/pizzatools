// import React from 'react';
// import PizzaItem from './PizzaItem';
// import './OrderItem.css'; // Ensure this points to the correct file

// interface Pizza {
//   id: string;
//   productName: string;
//   ingredients: string[];
// }

// interface Order {
//   id: string;
//   lineItems: Pizza[];
// }

// interface OrderItemProps {
//   order: Order;
// }

// const OrderItem: React.FC<OrderItemProps> = ({ order }) => {
//   return (
//     <div className="order-container"> {/* Use the style class here */}
//       <h2>Order ID: {order.id}</h2>
//       {order.lineItems.map((pizza, index) => (
//         <PizzaItem key={index} pizza={pizza} />
//       ))}
//     </div>
//   );
// };

// export default OrderItem;

import React from 'react';
import PizzaItem from './PizzaItem';
import './OrderItem.css';

interface Pizza {
  id: string;
  productName: string;
  ingredients: string[];
}

interface Order {
  id: string;
  createdAt: string; // Add createdAt property
  lineItems: Pizza[];
}

interface OrderItemProps {
  order: Order;
}

const OrderItem: React.FC<OrderItemProps> = ({ order }) => {
  return (
    <div className="order-container">
      <h2>Order ID: {order.id}</h2>
      <p>Created At: {order.createdAt}</p> {/* Display createdAt property */}
      {order.lineItems.map((pizza, index) => (
        <PizzaItem key={index} pizza={pizza} />
      ))}
    </div>
  );
};

export default OrderItem;
