import React from 'react';
import './App.css';
import OrdersList from './components/OrdersList';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Pizza Makeline</h1>
        <p className="App-subtitle">Kitchen Display System</p>
      </header>
      <main className="App-main">
        <OrdersList />
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