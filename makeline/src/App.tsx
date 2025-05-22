import React, { useState } from 'react';
import './App.css';
import OrdersList from './components/OrdersList';
import Timer from './components/Timer';

function App() {
  // Track the last time an order was completed (initially null)
  const [lastCompletionTime, setLastCompletionTime] = useState<number | null>(null);
  
  // Handler for when an order is completed
  const handleOrderCompleted = () => {
    setLastCompletionTime(Date.now());
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Pizza Makeline</h1>
        <p className="App-subtitle">Kitchen Display System</p>
        <div className="timer-container">
          <Timer lastCompletionTime={lastCompletionTime} targetTime={180} />
        </div>
      </header>
      <main className="App-main">
        <OrdersList onOrderCompleted={handleOrderCompleted} />
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
            <span className="key">Enter</span> <span className="description">Move to "In Oven"</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;