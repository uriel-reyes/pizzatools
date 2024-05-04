// import React, { useState, useEffect } from 'react';
// import OrderItem from './OrderItem';

// interface Order {
//   id: string;
//   lineItems: any[];
// }

// const OrdersList: React.FC = () => {
//   const [orders, setOrders] = useState<Order[]>([]);

//   useEffect(() => {
//     fetch('http://localhost:3001/orders')  // Adjust this URL to where your backend is hosted
//       .then(response => response.json())
//       .then(data => setOrders(data))
//       .catch(error => console.error('Error fetching orders:', error));
//   }, []);

//   return (
//     <div>
//       {orders.map(order => (
//         <OrderItem key={order.id} order={order} />
//       ))}
//     </div>
//   );
// };

// export default OrdersList;

import React, { useState, useEffect } from 'react';
import OrderItem from './OrderItem';

interface Order {
  id: string;
  createdAt: string; // Ensure that the Order interface includes createdAt property
  lineItems: any[];
}

const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/orders')  
      .then(response => response.json())
      .then(data => setOrders(data))
      .catch(error => console.error('Error fetching orders:', error));
  }, []);

  return (
    <div>
      {orders.map(order => (
        <OrderItem key={order.id} order={order} />
      ))}
    </div>
  );
};

export default OrdersList;
