import React, { useState, useEffect, useCallback, useRef } from 'react';
import OrderItem from './OrderItem';
import './OrderList.css';
import Order from '../types/Order';

// Pizza product type ID constant
const PIZZA_PRODUCT_TYPE_ID = '1950208a-8703-4ce5-b4e0-fea5fee190f3';
const PIZZA_CUSTOM_TYPE_ID = '2e00d9bb-361b-4b73-bca2-3bc15cfaf7e5';

// Types for CommerceTools order data
interface CommerceToolsLineItem {
  id: string;
  productId: string;
  productKey: string;
  name: {
    "en-US"?: string;
    en?: string;
  };
  productType?: {
    typeId: string;
    id: string;
    version?: number;
  };
  variant?: {
    id: number;
    sku: string;
    key?: string;
    attributes?: Array<{
      name: string;
      value: any;
    }>;
  };
  quantity: number;
  custom?: {
    type: {
      typeId: string;
      id: string;
    };
    fields: {
      Whole?: string[];
      Left?: string[];
      Right?: string[];
      Sauce?: string;
      'Sauce-Type'?: string;
      Cheese?: string;
      'Cheese-Type'?: string;
      Method?: string;
    };
  };
}

interface CommerceToolsOrder {
  id: string;
  createdAt: string;
  state: {
    typeId: string;
    id: string;
  };
  stateInfo: {
    name: string;
    key: string;
  };
  orderNumber: string;
  lineItems: CommerceToolsLineItem[];
}

interface OrdersListProps {
  onOrderCompleted: () => void;
}

const OrdersList: React.FC<OrdersListProps> = ({ onOrderCompleted }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderIndex, setActiveOrderIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null); // Track which order is being updated
  
  // Create refs for each order item
  const orderRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Add a ref to track if a fetch is in progress
  const fetchingRef = useRef<boolean>(false);
  // Add a ref to prevent multiple quick updates for the same order
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    
    try {
      fetchingRef.current = true;
      console.log('Fetching orders...');
      
      // Only show loading indicator for initial fetch
      if (orders.length === 0) {
      setLoading(true);
      }
      
      const response = await fetch('http://localhost:3001/orders');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json() as CommerceToolsOrder[];
      console.log(`Orders received: ${data.length}`);
      
      if (!Array.isArray(data)) {
        console.error('Received non-array data:', data);
        setError('Received invalid data format from the server');
        return;
      }
      
      // Process and transform orders for display - simplify the logging
      const processedOrders = data.map(order => {
        // Filter line items to only include pizza items
        const pizzaItems = order.lineItems
          .filter(item => {
            // Check if it's a pizza product by product type ID
            const isPizzaByType = item.productType?.id === PIZZA_PRODUCT_TYPE_ID;
            
            // Check if it has custom pizza fields
            const hasPizzaCustomFields = item.custom?.type?.id === PIZZA_CUSTOM_TYPE_ID;
            
            // Check for pizza in product name or key
            const nameLower = (item.name?.['en-US'] || item.name?.en || '').toLowerCase();
            const keyLower = (item.productKey || '').toLowerCase();
            const isPizzaByName = nameLower.includes('pizza') || keyLower.includes('pizza');
            
            return isPizzaByType || hasPizzaCustomFields || isPizzaByName;
          })
          .map(item => {
            // Extract ingredients from different parts of the pizza
            let ingredients: string[] = [];
            
            if (item.custom?.fields) {
              // Collect all toppings from different sections
              if (item.custom.fields.Whole && Array.isArray(item.custom.fields.Whole)) {
                ingredients = [...ingredients, ...item.custom.fields.Whole];
              }
              
              if (item.custom.fields.Left && Array.isArray(item.custom.fields.Left)) {
                ingredients = [...ingredients, ...item.custom.fields.Left.map((topping: string) => `Left: ${topping}`)];
              }
              
              if (item.custom.fields.Right && Array.isArray(item.custom.fields.Right)) {
                ingredients = [...ingredients, ...item.custom.fields.Right.map((topping: string) => `Right: ${topping}`)];
              }
              
              // Add sauce and cheese info if available
              if (item.custom.fields.Sauce) {
                let sauceDesc = item.custom.fields.Sauce;
                if (item.custom.fields['Sauce-Type']) {
                  ingredients.push(`Sauce: ${sauceDesc} ${item.custom.fields['Sauce-Type']}`);
                } else {
                  ingredients.push(`Sauce: ${sauceDesc}`);
                }
              }
              
              if (item.custom.fields.Cheese) {
                let cheeseDesc = item.custom.fields.Cheese;
                if (item.custom.fields['Cheese-Type']) {
                  ingredients.push(`Cheese: ${cheeseDesc} ${item.custom.fields['Cheese-Type']}`);
                } else {
                  ingredients.push(`Cheese: ${cheeseDesc}`);
                }
              }
            }
            
            // Clean up ingredient names by removing " (normal)" suffix
            ingredients = ingredients.map(ing => ing.replace(/ \(normal\)$/, ''));
            
            return {
              productName: item.name?.["en-US"] || item.name?.en || "Pizza",
              quantity: item.quantity || 1,
              ingredients
            };
          });
        
        return {
          ...order,
          lineItems: pizzaItems
        };
      });
      
      // Filter out orders with no pizza items
      const ordersWithPizzas = processedOrders.filter(order => 
        order.lineItems && order.lineItems.length > 0
      );
      
      console.log(`Found ${ordersWithPizzas.length} orders with pizza items`);
      
      if (ordersWithPizzas.length === 0 && data.length > 0) {
        console.log('No pizza items found with strict filtering. Using fallback approach...');
        
        // Fallback: Use all line items as pizza items
        const fallbackOrders = data.map(order => {
          return {
            ...order,
            lineItems: order.lineItems.map(item => {
              // Try to extract some meaningful info from the item
              const productName = item.name?.["en-US"] || item.name?.en || 
                                  item.productKey || "Pizza Item";
              
              // Try to find variant attributes if any
              const variantAttributes = item.variant?.attributes || [];
              const ingredients = variantAttributes
                .filter(attr => attr.value)
                .map(attr => `${attr.name}: ${attr.value}`)
                .filter(ing => ing.length > 0);
              
              return {
                productName,
                quantity: item.quantity || 1,
                ingredients
              };
            })
          };
        });
        
        setOrders(fallbackOrders);
        setActiveOrderIndex(fallbackOrders.length > 0 ? 0 : -1);
      } else {
        setOrders(ordersWithPizzas);
        // Only reset active index if we don't have one or if it's out of bounds
        if (activeOrderIndex < 0 || activeOrderIndex >= ordersWithPizzas.length) {
          setActiveOrderIndex(ordersWithPizzas.length > 0 ? 0 : -1);
        }
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders. See console for details.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [orders.length, activeOrderIndex]);

  useEffect(() => {
    fetchOrders();
    
    // Set up a polling interval to refresh orders - reduced to 10 seconds for more responsive updates
    const intervalId = setInterval(fetchOrders, 10000);
    
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  // Update the order status on the backend
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    // Prevent updating if loading or already updating this order
    if (loading || updating === orderId) return;
    
    // Prevent multiple rapid updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    setUpdating(orderId);
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
      
      // Call the callback to update the completion time
      onOrderCompleted();
      
    } catch (error) {
      console.error(`Error updating order status:`, error);
      setError(`Failed to update order. See console for details.`);
      
      // Refresh orders to ensure UI is in sync with backend
      updateTimeoutRef.current = setTimeout(() => {
        fetchOrders();
      }, 2000);
      
    } finally {
      setLoading(false);
      setUpdating(null);
    }
  }, [loading, updating, orders.length, onOrderCompleted, fetchOrders]);

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
          // Prevent multiple rapid Enter key presses
          if (!updating && !loading) {
          await updateOrderStatus(orders[activeOrderIndex].id, 'in-oven');
          }
        }
        break;
      
      default:
        break;
    }
  }, [orders, activeOrderIndex, updateOrderStatus, updating, loading]);

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