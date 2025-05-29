import React, { useState, useRef } from 'react';
import './App.css';
import DeliveryMap from './components/DeliveryMap';
import OrdersList from './components/OrdersList';
import DriversList from './components/DriversList';

// Store information - hardcoded for now but could come from config or API in the future
const STORE_NUMBER = '9267';

function App() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  // Track selected orders for assignment to drivers
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  // Reference to OrdersList component to trigger manual refresh
  const ordersListRef = useRef<any>(null);

  // Handle order selection for map display
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  // Handle driver selection
  const handleDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
  };

  // Handle order selection for driver assignment
  const handleOrderSelectionChange = (orderIds: string[]) => {
    setSelectedOrderIds(orderIds);
  };

  // Function to refresh orders list - can be called after dispatch
  const refreshOrders = () => {
    if (ordersListRef.current && ordersListRef.current.refreshOrders) {
      ordersListRef.current.refreshOrders();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Pizza Dispatch - Store #{STORE_NUMBER}</h1>
        <p className="App-subtitle">Delivery Management System</p>
      </header>
      <main className="App-main">
        <div className="dispatch-container">
          <div className="orders-panel">
            <OrdersList 
              ref={ordersListRef}
              onSelectOrder={handleOrderSelect}
              selectedOrderId={selectedOrderId}
              onOrderSelectionChange={handleOrderSelectionChange}
            />
          </div>
          <div className="map-panel">
            <DeliveryMap selectedOrderId={selectedOrderId} />
          </div>
          <div className="drivers-panel">
            <DriversList 
              onSelectDriver={handleDriverSelect}
              selectedDriverId={selectedDriverId}
              selectedOrderIds={selectedOrderIds}
              onDispatchComplete={refreshOrders}
            />
          </div>
        </div>
      </main>
      <footer className="App-footer">
        <div className="keyboard-instructions">
          <div className="key-instruction">
            <span className="key">↑</span> <span className="description">Previous Order</span>
          </div>
          <div className="key-instruction">
            <span className="key">↓</span> <span className="description">Next Order</span>
          </div>
          <div className="key-instruction">
            <span className="key">Enter</span> <span className="description">Select Order</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
