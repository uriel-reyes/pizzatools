# 🍕 Pizza Tools

A comprehensive system for managing pizza operations, from order preparation to delivery.

## System Components

### 1. Backend API Server

An Express-based API that connects to commercetools for e-commerce functionality.
- Port: 3001
- Handles order management, state transitions, and provides data to the frontends

### 2. Makeline - Kitchen Display System

A React application that shows pending orders to be prepared in the kitchen.
- Displays orders ready to be made
- Allows staff to mark orders as completed
- Tracks time since last order completion
- Features keyboard shortcuts for efficient operation

### 3. Dispatch - Delivery Management System

A React application that shows pending deliveries on a map.
- Displays delivery locations on an interactive map
- Shows customer details and addresses
- Allows navigation to delivery addresses
- Provides keyboard shortcuts for efficient order management

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
- Backend API server
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

## Technologies Used

- Backend: Node.js, Express, TypeScript, commercetools SDK
- Frontend: React, TypeScript, Google Maps API
- Styling: Custom CSS with Domino's-inspired theming
