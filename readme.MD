<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a>
</p>

# 🍕 pizzatools

A comprehensive system for managing pizza operations, from order preparation to delivery.

## System Components

### 1. Backend API Server

An Express-based API that connects to commercetools for e-commerce functionality.
- Port: 3001
- Handles order management, state transitions, and provides data to the frontends
- API endpoints:
  - `/orders` - Used by makeline to fetch orders in preparation
  - `/api/orders` - Used by dispatch to fetch delivery orders with specific state and stateId
  - `/orders/:id/state` - Updates order state (for both makeline and dispatch)

### 2. Makeline - Kitchen Display System

A React application that shows pending orders to be prepared in the kitchen.
- Displays orders ready to be made
- Allows staff to mark orders as completed
- Tracks time since last order completion
- Features keyboard shortcuts for efficient operation
- **Query Details**: Fetches orders with state "Open" and stateId "1c25473a-05e1-46f4-82a7-acc66d0a5154" from store "9267"

### 3. Dispatch - Delivery Management System

A React application that shows pending deliveries on a map.
- Displays delivery locations on an interactive map using Google Maps
- Shows customer details and addresses
- Allows navigation to delivery addresses via Google Maps integration
- Provides keyboard shortcuts for efficient order management
- **Query Details**: Fetches orders with state "Open", stateId "118b88e6-013e-45db-8608-d8b2358ecbb4" and "393518bd-5207-4aba-b910-81cb2e7343f4", method "delivery", and from store "9267"

## Configuration

You can create a commercetools `extension` to validate payment. For demo purposes we would use the `properOrder` function to create an order with/without payment. The cloud function tied to the `extension` would then update the order's state dependent on whether or not a payment was present. If payment is available the order is confirmed, otherwise the order is cancelled.

Will need a custom type similar to what's modeled below:

```json
{
  "key": "lineitemtype",
  "name": {
    "en": "Pizza Information"
  },
  "description": {
    "en": "Used to store temperature, ingredients and other information related to a pizza."
  },
  "resourceTypeIds": ["line-item"],
  "fieldDefinitions": [
    {
      "type": {
        "name": "Set",
        "elementType": {
          "name": "Enum",
          "values": [
            {
              "key": "cheese",
              "label": "Cheese"
            },
            {
              "key": "pepperoni",
              "label": "pepperoni"
            },
            {
              "key": "ham",
              "label": "Ham"
            },
            {
              "key": "bacon",
              "label": "Bacon"
            },
            {
              "key": "mushroom",
              "label": "Mushroom"
            },
            {
              "key": "pineapple",
              "label": "Pineapple"
            },
            {
              "key": "jalapeno",
              "label": "Jalapeño"
            },
            {
              "key": "onion",
              "label": "Onion"
            }
          ]
        }
      },
      "name": "Ingredients",
      "label": {
        "en": "Ingredients"
      },
      "required": false
    }
  ]
}
```

## Quickstart

To run the entire system with a single command:

```
npm run start-all
```

This will start:
- Backend API server on port 3001
- Makeline app on port 3000
- Dispatch app on port 3002

## API Configuration

The backend API requires configuration for commercetools:
- Create a `.env` file in the root directory with commercetools credentials
- See `.env.example` for required fields

## Google Maps Integration

The Dispatch app uses Google Maps API for displaying delivery locations on an interactive map:

### API Key Configuration
For security, the Google Maps API key is stored in an environment variable:

1. Create a `.env` file in the `dispatch` directory with:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
2. The `.env` file is already added to `.gitignore` to prevent exposing your API key in version control
3. The application reads this environment variable with:
   ```javascript
   const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
   ```

### Map Features
- Uses Google Maps JavaScript API with 'places' and 'geocoding' libraries
- Centers on Domino's in Pflugerville, TX by default (30.466031, -97.584150)
- Provides geocoding of customer addresses with fallback to random locations if geocoding fails
- Displays custom markers for store location and delivery addresses
- Includes navigation capabilities via Google Maps directions

## Order States

The system uses the following order states:
- New orders: Default state from commercetools
- In preparation: Orders being worked on in the kitchen (displayed in Makeline)
- Ready for delivery: Orders completed in the kitchen and ready for dispatch
- In delivery: Orders currently being delivered (State ID: 118b88e6-013e-45db-8608-d8b2358ecbb4)
- Delivered: Completed orders

## API Endpoints

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/orders` | GET | Fetches orders for makeline | None (hardcoded query for Open orders with stateId "1c25473a-05e1-46f4-82a7-acc66d0a5154" from store "9267") |
| `/api/orders` | GET | Fetches orders for dispatch | `state` (required), `stateId` (required), `method` (optional), `storeKey` (hardcoded as "9267") |
| `/orders/:id/state` | POST | Updates order state | `state` (required in body) |
| `/debug/order-states` | GET | Lists all available order states | None |
| `/debug/orders/:id` | GET | Shows detailed information about an order | None |

## Query Structure Details

### Makeline App Query
```
GET /orders
```
- Fixed parameters (handled by server):
  - `state`: "Open"
  - `stateId`: "1c25473a-05e1-46f4-82a7-acc66d0a5154" (preparation pending)
  - `storeKey`: "9267"
- Returns orders ready for preparation in the kitchen

### Dispatch App Query
```
GET /api/orders?state=Open&stateId=118b88e6-013e-45db-8608-d8b2358ecbb4,393518bd-5207-4aba-b910-81cb2e7343f4&method=delivery
```
- Parameters:
  - `state`: "Open" 
  - `stateId`: Multiple IDs for orders ready for delivery
  - `method`: "delivery"
  - `storeKey`: "9267" (handled by server)
- Returns delivery orders for display on the map

## Technologies Used

- Backend: Node.js, Express, TypeScript, commercetools SDK
- Frontend: React, TypeScript, Google Maps API
- Styling: Custom CSS with Domino's-inspired theming

## Recent Updates

### Auto-Refresh Capabilities
- **Dispatch App**: Both the order list and map components automatically refresh data every 10 seconds to ensure up-to-date delivery information.
- **Makeline App**: Refreshes every 30 seconds to show new orders ready for preparation.
- Auto-refresh is implemented using React's `useEffect` and `setInterval` to periodically fetch the latest data without requiring manual user intervention.

### Customer Name Formatting
- Improved display of customer names in the Dispatch app to show proper names (e.g., "Jennifer Gonzalez" instead of "jennifer.gonzalez").
- The system now uses firstName and lastName from shipping address data with proper capitalization.
- Falls back to email-based names only when shipping address name data is unavailable.

### Multi-Status Order Support
- The Dispatch app now supports fetching orders with multiple state IDs using comma-separated values.
- Currently configured to show delivery orders with stateIds: 
  - "118b88e6-013e-45db-8608-d8b2358ecbb4"
  - "393518bd-5207-4aba-b910-81cb2e7343f4"
- Server efficiently handles multiple IDs by building appropriate OR conditions in the database queries.

### Store Identification
- Both applications now display "Store #9267" in their titles for clear store identification.
- This prepares the system for future multi-store functionality.
