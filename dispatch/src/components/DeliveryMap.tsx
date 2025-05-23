import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from '@react-google-maps/api';
import './DeliveryMap.css';
import { Order } from '../types/Order';

// CommerceTools order type definition
interface CTOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  lastModifiedAt: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    streetName: string;
    city: string;
    postalCode: string;
  };
  lineItems: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  totalPrice: {
    centAmount: number;
    currencyCode: string;
  };
  custom: {
    customFieldsRaw: Array<{
      name: string;
      value: string;
    }>;
  };
  state: {
    key: string;
    id: string;
  };
  store: {
    key: string;
  };
}

// Define libraries array outside the component to prevent recreation on each render
const mapLibraries: Libraries = ['places', 'geocoding'];

// Use environment variable for the API key instead of hardcoding it
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
console.log("Using Google Maps API Key:", GOOGLE_MAPS_API_KEY ? 
  `${GOOGLE_MAPS_API_KEY.substring(0, 5)}...${GOOGLE_MAPS_API_KEY.substring(GOOGLE_MAPS_API_KEY.length - 4)}` : "MISSING");

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Center on Domino's in Pflugerville, TX
const defaultCenter = {
  lat: 30.466031, // Domino's Pflugerville latitude
  lng: -97.584150 // Domino's Pflugerville longitude
};

// Real Domino's address to display in the map UI
const dominosAddress = "18701 Limestone Commercial Dr Suite 400, Pflugerville, TX 78660";

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
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  // Load the Google Maps JavaScript API with direct API key
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: mapLibraries
  });

  // Initialize geocoder when maps load
  useEffect(() => {
    if (isLoaded && !geocoder) {
      console.log("Google Maps loaded successfully, initializing geocoder");
      setGeocoder(new google.maps.Geocoder());
    }
  }, [isLoaded, geocoder]);

  // Modified geocode function to attempt actual geocoding
  const geocodeAddress = async (address: string): Promise<Location | null> => {
    if (!geocoder) {
      console.warn("Geocoder not initialized yet");
      return null;
    }
    
    try {
      console.log(`Attempting to geocode address: ${address}`);
      const result = await geocoder.geocode({ address });
      
      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        console.log(`Successfully geocoded ${address}`);
        return {
          lat: location.lat(),
          lng: location.lng()
        };
      } else {
        console.warn(`No results found for address: ${address}`);
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  // Fetch orders with delivery status
  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/orders?state=Open&stateId=118b88e6-013e-45db-8608-d8b2358ecbb4,393518bd-5207-4aba-b910-81cb2e7343f4&method=delivery&storeKey=9267');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data: Order[] = await response.json();
      
      // Process orders to add location data (geocoding)
      const ordersWithLocation: MapOrder[] = await Promise.all(
        data.map(async (order) => {
          try {
            // Build a properly formatted address string for Pflugerville
            const shippingAddress = order.shippingAddress;
            const addressString = `${shippingAddress.streetNumber} ${shippingAddress.streetName}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`;
            
            let location: Location | null = null;
            
            // Try to geocode the address if we have meaningful address data
            if (shippingAddress.streetName && shippingAddress.city && geocoder) {
              try {
                location = await geocodeAddress(addressString);
              } catch (geocodeError) {
                console.error(`Geocoding error for ${addressString}:`, geocodeError);
              }
            }
            
            // Fallback to a random location if geocoding fails or address is incomplete
            if (!location) {
              // Generate random locations within ~3-5 miles of the Domino's store
              location = {
                lat: defaultCenter.lat + (Math.random() - 0.5) * 0.08,
                lng: defaultCenter.lng + (Math.random() - 0.5) * 0.08
              };
              
              console.log(`Using random location for order ${order.id} in Pflugerville area. Address was: ${addressString}`);
            } else {
              console.log(`Successfully geocoded address for order ${order.id}: ${addressString}`);
            }
            
            return { ...order, location };
          } catch (error) {
            console.error('Error processing order location:', error);
            
            // Fallback to random location on error
            const location: Location = {
              lat: defaultCenter.lat + (Math.random() - 0.5) * 0.08,
              lng: defaultCenter.lng + (Math.random() - 0.5) * 0.08
            };
            
            return { ...order, location };
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
  }, [selectedOrderId, geocoder]);

  // Load orders when component mounts or selected order changes
  useEffect(() => {
    // Only fetch if geocoder is available or if this is the initial load
    if (isLoaded) {
      fetchOrders();
      
      // Refresh every 10 seconds
      const intervalId = setInterval(fetchOrders, 10000);
      
      return () => clearInterval(intervalId);
    }
  }, [fetchOrders, isLoaded]);

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
        zoom={12}
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
        {/* Domino's Store Marker */}
        <Marker
          position={defaultCenter}
          icon={{
            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24'%3E%3Cpath fill='%23006491' d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
            scaledSize: new window.google.maps.Size(42, 42),
            anchor: new window.google.maps.Point(21, 42)
          }}
          onClick={() => setActiveMarker('dominos')}
        >
          {activeMarker === 'dominos' && (
            <InfoWindow onCloseClick={() => setActiveMarker(null)}>
              <div className="info-window">
                <h3>Domino's Pizza</h3>
                <p className="info-address">{dominosAddress}</p>
                <p className="info-description">Dispatch Center</p>
              </div>
            </InfoWindow>
          )}
        </Marker>

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
                      {order.shippingAddress.streetNumber} {order.shippingAddress.streetName}
                      <br />
                      {order.shippingAddress.postalCode} {order.shippingAddress.city}
                    </p>
                    <p className="info-total">
                      ${order.taxedPrice?.totalGross 
                        ? (order.taxedPrice.totalGross.centAmount / 100).toFixed(2) 
                        : (order.totalPrice.centAmount / 100).toFixed(2)}
                    </p>
                    <button 
                      className="info-navigate-btn"
                      onClick={() => {
                        // Open Google Maps directions in a new tab
                        const address = `${order.shippingAddress.streetNumber} ${order.shippingAddress.streetName}, ${order.shippingAddress.city}, ${order.shippingAddress.state}`;
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&origin=${encodeURIComponent(dominosAddress)}`, '_blank');
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