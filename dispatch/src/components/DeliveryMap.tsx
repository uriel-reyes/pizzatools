import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import './DeliveryMap.css';
import { Order } from '../types/Order';

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center (can be changed to your pizza store location)
const defaultCenter = {
  lat: 37.7749, // San Francisco latitude
  lng: -122.4194 // San Francisco longitude
};

interface DeliveryMapProps {
  selectedOrderId: string | null;
}

interface Location {
  lat: number;
  lng: number;
}

interface MapOrder extends Order {
  location?: Location;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({ selectedOrderId }) => {
  const [orders, setOrders] = useState<MapOrder[]>([]);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [error, setError] = useState<string | null>(null);

  // Load the Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "", // Set your API key in .env
    // Additional libraries if needed
    // libraries: ['places']
  });

  // Fetch orders with delivery status
  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/orders?state=Open&stateId=118b88e6-013e-45db-8608-d8b2358ecbb4');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data: Order[] = await response.json();
      
      // Process orders to add location data (geocoding)
      const ordersWithLocation: MapOrder[] = await Promise.all(
        data.map(async (order) => {
          try {
            // In a real app, you would use Google Geocoding API
            // For this example, we'll generate random locations around the default center
            const location: Location = {
              lat: defaultCenter.lat + (Math.random() - 0.5) * 0.05,
              lng: defaultCenter.lng + (Math.random() - 0.5) * 0.05
            };
            
            return { ...order, location };
          } catch (error) {
            console.error('Error geocoding address:', error);
            return order as MapOrder;
          }
        })
      );
      
      setOrders(ordersWithLocation);
      
      // If there's a selected order, center the map on it
      if (selectedOrderId) {
        const selectedOrder = ordersWithLocation.find(order => order.id === selectedOrderId);
        if (selectedOrder && selectedOrder.location) {
          setMapCenter(selectedOrder.location);
          setActiveMarker(selectedOrderId);
        }
      }
    } catch (err) {
      setError('Failed to fetch order locations');
      console.error(err);
    }
  }, [selectedOrderId]);

  // Load orders when component mounts or selected order changes
  useEffect(() => {
    fetchOrders();
    
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchOrders, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchOrders, selectedOrderId]);

  // Center map on selected order when it changes
  useEffect(() => {
    if (selectedOrderId && mapInstance) {
      const selectedOrder = orders.find(order => order.id === selectedOrderId);
      if (selectedOrder && selectedOrder.location) {
        setMapCenter(selectedOrder.location);
        setActiveMarker(selectedOrderId);
        mapInstance.panTo(selectedOrder.location);
      }
    }
  }, [selectedOrderId, orders, mapInstance]);

  // Handle click on marker
  const handleMarkerClick = (orderId: string) => {
    setActiveMarker(orderId);
    const clickedOrder = orders.find(order => order.id === orderId);
    if (clickedOrder && clickedOrder.location) {
      setMapCenter(clickedOrder.location);
    }
  };

  const onMapLoad = (map: google.maps.Map) => {
    setMapInstance(map);
  };

  if (loadError) {
    return <div className="map-error">Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div className="map-loading">Loading maps...</div>;
  }

  return (
    <div className="delivery-map">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={13}
        onLoad={onMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: [
            // Custom map styles can be added here
          ]
        }}
      >
        {orders.map((order) => 
          order.location && (
            <Marker
              key={order.id}
              position={order.location}
              animation={selectedOrderId === order.id ? google.maps.Animation.BOUNCE : undefined}
              icon={{
                url: selectedOrderId === order.id 
                  ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24'%3E%3Cpath fill='%23e31837' d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E"
                  : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%230078ae' d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
                scaledSize: new window.google.maps.Size(selectedOrderId === order.id ? 36 : 24, selectedOrderId === order.id ? 36 : 24),
                anchor: new window.google.maps.Point(selectedOrderId === order.id ? 18 : 12, selectedOrderId === order.id ? 36 : 24)
              }}
              onClick={() => handleMarkerClick(order.id)}
            >
              {activeMarker === order.id && (
                <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                  <div className="info-window">
                    <h3>Order #{order.orderNumber}</h3>
                    <p className="info-customer">{order.customerName}</p>
                    <p className="info-address">
                      {order.shippingAddress.streetName} {order.shippingAddress.streetNumber}
                      <br />
                      {order.shippingAddress.postalCode} {order.shippingAddress.city}
                    </p>
                    <p className="info-total">${order.totalPrice.centAmount / 100}</p>
                    <button 
                      className="info-navigate-btn"
                      onClick={() => {
                        // Open Google Maps directions in a new tab
                        const address = `${order.shippingAddress.streetName} ${order.shippingAddress.streetNumber}, ${order.shippingAddress.city}`;
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
                      }}
                    >
                      Navigate
                    </button>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          )
        )}
      </GoogleMap>
      
      {error && <div className="map-overlay-error">{error}</div>}
      
      {orders.length === 0 && !error && (
        <div className="map-overlay-message">No delivery orders to display</div>
      )}
    </div>
  );
};

export default DeliveryMap; 