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

### 3. Dispatch - Delivery Management System

A React application that shows pending deliveries on a map.
- Displays delivery locations on an interactive map using Google Maps
- Shows customer details and addresses
- Allows navigation to delivery addresses via Google Maps integration
- Provides keyboard shortcuts for efficient order management
- Filters for orders with state "Open" and state ID "118b88e6-013e-45db-8608-d8b2358ecbb4"

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

## Setup

Each component has its own setup instructions. Please refer to the README in each directory:

- Backend API: See root directory instructions
- Makeline: See `/makeline/README.md`
- Dispatch: See `/dispatch/README.md`

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

The Dispatch app requires a Google Maps API key:
- Create a `.env` file in the `/dispatch` directory
- Add `REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here`

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
| `/orders` | GET | Fetches orders for makeline | None |
| `/api/orders` | GET | Fetches orders for dispatch | `state` (required), `stateId` (optional) |
| `/orders/:id/state` | POST | Updates order state | `state` (required in body) |
| `/debug/order-states` | GET | Lists all available order states | None |
| `/debug/orders/:id` | GET | Shows detailed information about an order | None |

## Technologies Used

- Backend: Node.js, Express, TypeScript, commercetools SDK
- Frontend: React, TypeScript, Google Maps API
- Styling: Custom CSS with Domino's-inspired theming
