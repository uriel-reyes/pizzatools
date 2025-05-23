import React, { useState } from 'react';
import './App.css';
import DeliveryMap from './components/DeliveryMap';
import OrdersList from './components/OrdersList';

function App() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Pizza Dispatch</h1>
        <p className="App-subtitle">Delivery Management System</p>
      </header>
      <main className="App-main">
        <div className="dispatch-container">
          <div className="orders-panel">
            <OrdersList 
              onSelectOrder={(orderId) => setSelectedOrderId(orderId)}
              selectedOrderId={selectedOrderId}
            />
          </div>
          <div className="map-panel">
            <DeliveryMap selectedOrderId={selectedOrderId} />
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
            <span className="key">Enter</span> <span className="description">Mark as Delivered</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
