import React, { useState, useEffect, useCallback } from 'react';
import './DriversList.css';
import { Driver } from '../types/Driver';

interface DriversListProps {
  onSelectDriver?: (driverId: string) => void;
  selectedDriverId?: string | null;
}

const DriversList: React.FC<DriversListProps> = ({ onSelectDriver, selectedDriverId }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      // API endpoint for available drivers
      const response = await fetch('http://localhost:3001/api/drivers');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setDrivers(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch drivers. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and setup refresh interval
  useEffect(() => {
    fetchDrivers();
    
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchDrivers, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchDrivers]);

  if (loading && drivers.length === 0) {
    return <div className="drivers-list-loading">Loading available drivers...</div>;
  }

  if (error && drivers.length === 0) {
    return <div className="drivers-list-error">{error}</div>;
  }

  if (drivers.length === 0) {
    return <div className="drivers-list-empty">No drivers available</div>;
  }

  return (
    <div className="drivers-list">
      <h2 className="drivers-list-title">Available Drivers ({drivers.length})</h2>
      <div className="drivers-list-container">
        {drivers.map((driver) => (
          <div 
            key={driver.id}
            className={`driver-item ${selectedDriverId === driver.id ? 'selected' : ''}`}
            onClick={() => onSelectDriver && onSelectDriver(driver.id)}
          >
            <div className="driver-header">
              <span className="driver-name">{driver.firstName} {driver.lastName}</span>
            </div>
            {driver.phoneNumber && (
              <div className="driver-phone">{driver.phoneNumber}</div>
            )}
            <div className="driver-status available">Available</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriversList; 