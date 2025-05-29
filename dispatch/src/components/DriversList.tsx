import React, { useState, useEffect, useCallback } from 'react';
import './DriversList.css';
import { Driver } from '../types/Driver';
import { Order } from '../types/Order';

interface DriversListProps {
  onSelectDriver?: (driverId: string) => void;
  selectedDriverId?: string | null;
  selectedOrderIds?: string[];
  onDispatchComplete?: () => void;
}

const DriversList: React.FC<DriversListProps> = ({ 
  onSelectDriver, 
  selectedDriverId,
  selectedOrderIds = [],
  onDispatchComplete
}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [dispatchedDrivers, setDispatchedDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track which drivers have temporary order assignments
  const [tempAssignments, setTempAssignments] = useState<{[driverId: string]: string[]}>({});
  // Track dispatched driver orders
  const [driverOrders, setDriverOrders] = useState<{[driverId: string]: Order[]}>({});
  // Track if we're in 'return mode' where we show dispatched drivers for return
  const [returnMode, setReturnMode] = useState(false);
  // Track if we're dispatching (to disable buttons during API calls)
  const [isDispatching, setIsDispatching] = useState(false);
  // Track dispatch times for drivers
  const [dispatchTimes, setDispatchTimes] = useState<{[driverId: string]: Date}>({});
  // Timer for updating elapsed time
  const [, setTimerTick] = useState(0);

  // Fetch available drivers
  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      // API endpoint for drivers (both available and dispatched)
      const response = await fetch('http://localhost:3001/api/drivers?includeDispatched=true');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Separate available and dispatched drivers
      const available = data.filter((driver: Driver) => !driver.isDispatched);
      const dispatched = data.filter((driver: Driver) => driver.isDispatched);
      
      setDrivers(available);
      setDispatchedDrivers(dispatched);
      
      // Fetch orders for dispatched drivers
      if (dispatched.length > 0) {
        fetchDriverOrders(dispatched);
      }
      
      // Record dispatch times for newly dispatched drivers
      dispatched.forEach((driver: Driver) => {
        if (!dispatchTimes[driver.id]) {
          setDispatchTimes(prev => ({
            ...prev,
            [driver.id]: new Date() // We don't have the exact time, so we use the current time
          }));
        }
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch drivers. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dispatchTimes]);

  // Fetch orders assigned to dispatched drivers
  const fetchDriverOrders = async (dispatchedDrivers: Driver[]) => {
    try {
      const orderData: {[driverId: string]: Order[]} = {};
      
      for (const driver of dispatchedDrivers) {
        const response = await fetch(`http://localhost:3001/api/drivers/${driver.id}/orders`);
        
        if (response.ok) {
          const orders = await response.json();
          orderData[driver.id] = orders;
        }
      }
      
      setDriverOrders(orderData);
    } catch (error) {
      console.error('Error fetching driver orders:', error);
    }
  };

  // Initial fetch and setup refresh interval
  useEffect(() => {
    fetchDrivers();
    
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchDrivers, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchDrivers]);

  // Set up timer for updating elapsed time displays
  useEffect(() => {
    const timerId = setInterval(() => {
      setTimerTick(tick => tick + 1);
    }, 1000); // Update every second instead of every minute
    
    return () => clearInterval(timerId);
  }, []);

  // Function to format elapsed time with minutes and seconds
  const formatElapsedTime = (dispatchTime: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - dispatchTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    
    if (minutes < 60) {
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m ${seconds}s`;
    }
  };

  // Function to handle assigning selected orders to a driver temporarily
  const handleAssignOrders = (driverId: string) => {
    if (selectedOrderIds.length === 0 || returnMode) return;
    
    setTempAssignments(prev => ({
      ...prev,
      [driverId]: [...(prev[driverId] || []), ...selectedOrderIds]
    }));

    // Let parent component know a driver was selected
    if (onSelectDriver) {
      onSelectDriver(driverId);
    }
  };

  // Function to dispatch drivers with their assigned orders
  const handleDispatch = async () => {
    // Only dispatch if we have assignments
    if (Object.keys(tempAssignments).length === 0) return;
    
    try {
      setIsDispatching(true);
      
      // First, update any "In Oven" orders to "Pending Delivery" state
      // This needs to be done before dispatching
      const allOrderIds = Object.values(tempAssignments).flat();
      
      // Call API to update order states (In Oven -> Pending Delivery)
      const updateResponse = await fetch('http://localhost:3001/api/update-order-states', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderIds: allOrderIds })
      });
      
      if (!updateResponse.ok) {
        throw new Error(`Failed to update order states: ${updateResponse.status}`);
      }
      
      // Call API to dispatch drivers with their assignments
      const response = await fetch('http://localhost:3001/api/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignments: tempAssignments })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to dispatch drivers: ${response.status}`);
      }
      
      // Record dispatch times for newly dispatched drivers
      Object.keys(tempAssignments).forEach(driverId => {
        setDispatchTimes(prev => ({
          ...prev,
          [driverId]: new Date()
        }));
      });
      
      // Clear temporary assignments after successful dispatch
      setTempAssignments({});
      
      // Refresh drivers list to show updated status
      fetchDrivers();
      
      // Call the onDispatchComplete callback if provided
      if (onDispatchComplete) {
        onDispatchComplete();
      }
      
    } catch (err) {
      console.error('Error dispatching drivers:', err);
      setError('Failed to dispatch drivers. Please try again.');
    } finally {
      setIsDispatching(false);
    }
  };

  // Function to handle driver return
  const handleReturn = async (driverId: string) => {
    if (!returnMode) return;
    
    try {
      // Call API to mark driver as returned
      const response = await fetch(`http://localhost:3001/api/drivers/${driverId}/return`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark driver as returned: ${response.status}`);
      }
      
      // Remove dispatch time for this driver
      setDispatchTimes(prev => {
        const newTimes = {...prev};
        delete newTimes[driverId];
        return newTimes;
      });
      
      // Refresh drivers to update UI
      fetchDrivers();
      
      // Call the onDispatchComplete callback if provided
      if (onDispatchComplete) {
        onDispatchComplete();
      }
      
    } catch (err) {
      console.error('Error returning driver:', err);
      setError('Failed to process driver return. Please try again.');
    }
  };

  // Toggle return mode
  const toggleReturnMode = () => {
    setReturnMode(prev => !prev);
  };

  // Clear all temporary assignments
  const clearAssignments = () => {
    setTempAssignments({});
  };

  if (loading && drivers.length === 0 && dispatchedDrivers.length === 0) {
    return <div className="drivers-list-loading">Loading drivers...</div>;
  }

  if (error && drivers.length === 0 && dispatchedDrivers.length === 0) {
    return <div className="drivers-list-error">{error}</div>;
  }

  // Render the list - showing either all drivers or only dispatched drivers for return
  const driversToShow = returnMode ? dispatchedDrivers : drivers;
  const totalDrivers = drivers.length + dispatchedDrivers.length;

  return (
    <div className="drivers-list">
      <h2 className="drivers-list-title">
        {returnMode 
          ? 'Select Driver to Return' 
          : `Drivers (${totalDrivers})`}
      </h2>
      
      <div className="drivers-list-container">
        {/* Available drivers (only shown in normal mode) */}
        {!returnMode && (
          <>
            {drivers.length > 0 && (
              <div className="drivers-section">
                <h3 className="drivers-section-title">Available ({drivers.length})</h3>
                {drivers.map((driver) => (
                  <div 
                    key={driver.id}
                    className={`driver-item available ${selectedDriverId === driver.id ? 'selected' : ''} ${tempAssignments[driver.id]?.length > 0 ? 'has-assignments' : ''}`}
                    onClick={() => handleAssignOrders(driver.id)}
                  >
                    <div className="driver-header">
                      <span className="driver-name">{driver.firstName} {driver.lastName}</span>
                    </div>
                    {driver.phoneNumber && (
                      <div className="driver-phone">{driver.phoneNumber}</div>
                    )}
                    <div className="driver-status available">Available</div>
                    
                    {/* Show temporary order assignments if any */}
                    {tempAssignments[driver.id]?.length > 0 && (
                      <div className="driver-assignments">
                        <div className="assignments-header">Assigned Orders:</div>
                        <div className="assignments-count">{tempAssignments[driver.id].length} orders</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Dispatched drivers (always shown but with different styling) */}
            {dispatchedDrivers.length > 0 && (
              <div className="drivers-section">
                <h3 className="drivers-section-title">Out on Delivery ({dispatchedDrivers.length})</h3>
                {dispatchedDrivers.map((driver) => (
                  <div 
                    key={driver.id}
                    className="driver-item dispatched"
                  >
                    <div className="driver-header">
                      <span className="driver-name">{driver.firstName} {driver.lastName}</span>
                      {dispatchTimes[driver.id] && (
                        <span className="driver-time-out">
                          {formatElapsedTime(dispatchTimes[driver.id])}
                        </span>
                      )}
                    </div>
                    {driver.phoneNumber && (
                      <div className="driver-phone">{driver.phoneNumber}</div>
                    )}
                    <div className="driver-status out">Out on Delivery</div>
                    
                    {/* Show assigned orders */}
                    {driverOrders[driver.id]?.length > 0 && (
                      <div className="driver-assigned-orders">
                        <div className="assigned-orders-header">Delivering:</div>
                        <div className="assigned-orders-list">
                          {driverOrders[driver.id].map(order => (
                            <div key={order.id} className="assigned-order">
                              <span className="assigned-order-number">#{order.orderNumber}</span>
                              <span className="assigned-order-customer">{order.customerName}</span>
                              <span className="assigned-order-address">
                                {order.shippingAddress.streetName} {order.shippingAddress.streetNumber}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Only dispatched drivers in return mode */}
        {returnMode && (
          <>
            {dispatchedDrivers.length === 0 ? (
              <div className="empty-section-message">No drivers currently out on delivery</div>
            ) : (
              dispatchedDrivers.map((driver) => (
                <div 
                  key={driver.id}
                  className="driver-item dispatched return-selectable"
                  onClick={() => handleReturn(driver.id)}
                >
                  <div className="driver-header">
                    <span className="driver-name">{driver.firstName} {driver.lastName}</span>
                    {dispatchTimes[driver.id] && (
                      <span className="driver-time-out">
                        {formatElapsedTime(dispatchTimes[driver.id])}
                      </span>
                    )}
                  </div>
                  {driver.phoneNumber && (
                    <div className="driver-phone">{driver.phoneNumber}</div>
                  )}
                  <div className="driver-status out">Out on Delivery</div>
                  
                  {/* Show assigned orders */}
                  {driverOrders[driver.id]?.length > 0 && (
                    <div className="driver-assigned-orders">
                      <div className="assigned-orders-header">Click to mark as returned:</div>
                      <div className="assigned-orders-list">
                        {driverOrders[driver.id].map(order => (
                          <div key={order.id} className="assigned-order">
                            <span className="assigned-order-number">#{order.orderNumber}</span>
                            <span className="assigned-order-customer">{order.customerName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Fixed action buttons at the bottom - just Out and In */}
      <div className="drivers-action-buttons">
        {returnMode ? (
          <button 
            className="driver-action-btn in-btn"
            onClick={toggleReturnMode}
          >
            Cancel
          </button>
        ) : (
          <div className="button-row">
            <button 
              className="driver-action-btn out-btn"
              onClick={handleDispatch}
              disabled={isDispatching || Object.keys(tempAssignments).length === 0}
            >
              {isDispatching ? 'Dispatching...' : 'Out'}
            </button>
            <button 
              className="driver-action-btn in-btn"
              onClick={toggleReturnMode}
              disabled={dispatchedDrivers.length === 0}
            >
              In
            </button>
          </div>
        )}
        
        {!returnMode && Object.keys(tempAssignments).length > 0 && (
          <button 
            className="driver-action-btn clear-btn"
            onClick={clearAssignments}
            disabled={isDispatching}
          >
            Clear Assignments
          </button>
        )}
      </div>
    </div>
  );
};

export default DriversList; 