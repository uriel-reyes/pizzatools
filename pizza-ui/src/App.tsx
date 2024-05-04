import React from 'react';
import './App.css';
import OrdersList from './components/OrdersList';  // Import the OrdersList component

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Pizza Makeline</h1>
        {/* Render the OrdersList component */}
        <OrdersList />
      </header>
    </div>
  );
}

export default App;
