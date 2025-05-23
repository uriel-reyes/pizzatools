# Pizza Dispatch

A delivery management system for pizza orders. This application displays pending deliveries on a map and helps drivers navigate to customer addresses.

## Features

- Real-time map view of pending deliveries
- Order information with customer details and addresses
- Navigation integration with Google Maps
- Keyboard shortcuts for quick order management

## Setup

1. Clone the repository
2. Navigate to the dispatch directory: `cd dispatch`
3. Install dependencies: `npm install`
4. Create a `.env` file in the root directory with your Google Maps API key:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```
5. Start the development server: `npm start`

## Google Maps Integration

This application uses Google Maps API for displaying delivery locations:
- The map automatically plots delivery addresses
- Location markers are color-coded (blue for regular, red for selected)
- Clicking on a marker displays order information
- Each order includes a "Navigate" button that opens Google Maps directions in a new tab

## API Integration

This application connects to the backend API (running on port 3001) to fetch orders with:
- State: "Open"
- State ID: "118b88e6-013e-45db-8608-d8b2358ecbb4"

The API endpoint URL is: `http://localhost:3001/api/orders?state=Open&stateId=118b88e6-013e-45db-8608-d8b2358ecbb4`

## Running the Full System

To run both the Makeline and Dispatch applications together with the backend:

```
npm run start-all
```

This will start:
- Backend API server (port 3001)
- Makeline app (port 3000)
- Dispatch app (port 3002)

## Keyboard Shortcuts

- **↑ (Up Arrow)**: Select previous order
- **↓ (Down Arrow)**: Select next order
- **Enter**: Mark selected order as delivered

## Troubleshooting

If the dispatch app doesn't show any orders, check the following:
1. Make sure the backend server is running on port 3001
2. Verify that your Google Maps API key is correctly set in the `.env` file 
3. Confirm that there are orders with state "Open" and the correct state ID in your commercetools project
4. Check browser console for any API errors

## Technologies Used

- React
- TypeScript
- Google Maps API
- Commercetools integration via backend API
