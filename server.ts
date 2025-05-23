import express = require('express');
import cors = require('cors');
import apiRoot from './src/BuildClient';

// Constant values
const STORE_KEY = "9267"; // Consistent store key for all endpoints
const port = process.env.PORT || 3001;

// Common type definitions
interface StateInfo {
  name: string;
  key: string;
}

// Define the custom field types for better type safety
interface CustomField {
  name: string;
  value: any;
}

interface CustomerCustomFields {
  type: {
    key: string;
  };
  customFieldsRaw: CustomField[];
}

// Helper functions for reusable logic
function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function getStateMap(): Promise<Map<string, StateInfo>> {
  // Create a map of state ID to state name
  const statesResponse = await apiRoot
    .states()
    .get()
    .execute();
  
  const stateMap = new Map<string, StateInfo>();
  statesResponse.body.results.forEach(state => {
    stateMap.set(state.id, {
      name: state.name?.en || state.key,
      key: state.key
    });
  });
  
  return stateMap;
}

// Common error handler
function handleError(res: express.Response, error: unknown, message: string = 'Server error') {
  console.error(message, error);
  
  let errorMessage = message;
  let errorDetails = {};
  
  if (error instanceof Error) {
    errorMessage = error.message;
    
    // Try to extract more details from commercetools error
    const ctError = error as any;
    if (ctError.body) {
      errorDetails = ctError.body;
    }
  }
  
  return res.status(500).json({ 
    error: message,
    message: errorMessage,
    details: errorDetails
  });
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint for Makeline app (Kitchen Display System)
app.get('/orders', async (req, res) => {
  console.log(`Makeline orders endpoint called - fetching orders for store ${STORE_KEY}`);
  try {
    // Parameters for Makeline orders
    const state = "Open";
    const stateId = "1c25473a-05e1-46f4-82a7-acc66d0a5154"; // ID for 'preparation pending' state
    
    // Get state info map
    const stateMap = await getStateMap();

    // Build the query clause
    const whereClause = `orderState = "${state}" AND state(id="${stateId}")`;
    
    console.log(`Makeline: Fetching orders with query: ${whereClause} for store: ${STORE_KEY}`);
    
    // Execute the query
    const response = await apiRoot
      .inStoreKeyWithStoreKeyValue({storeKey: STORE_KEY})
      .orders()
      .get({
        queryArgs: {
          where: whereClause,
          sort: ["createdAt desc"]
        }
      })
      .execute();
    
    // Map orders to the format expected by Makeline app
    const mappedOrders = response.body.results.map(order => {
      const stateInfo = order.state ? stateMap.get(order.state.id) : null;
      
      return {
        id: order.id,
        createdAt: order.createdAt,
        state: order.state,
        stateInfo: stateInfo || { name: "Unknown", key: "unknown" },
        orderNumber: order.orderNumber,
        totalItems: order.lineItems.length,
        lineItems: order.lineItems.map(lineItem => ({
          productName: lineItem.name.en,
          quantity: lineItem.quantity,
          ingredients: lineItem.custom && (lineItem.custom as any).fields ? (lineItem.custom as any).fields.Ingredients : []
        }))
      };
    });
    
    return res.json(mappedOrders);
  } catch (error) {
    return handleError(res, error, 'Failed to retrieve makeline orders');
  }
});

// Endpoint for Dispatch app (Delivery Management)
app.get('/api/orders', async (req, res) => {
  const { state, stateId, method } = req.query;
  
  // Log the request parameters
  console.log('Dispatch orders endpoint called:', { 
    state, 
    stateId, 
    method, 
    storeKey: STORE_KEY
  });
  
  // Validate required parameters
  if (!state || typeof state !== 'string') {
    return res.status(400).json({ error: 'State parameter is required' });
  }

  try {
    // Get state info map
    const stateMap = await getStateMap();

    // Build the query clause
    let whereClause = `orderState = "${state}"`;
    
    // Handle stateId parameter which can be a single value or comma-separated list
    if (stateId) {
      if (typeof stateId === 'string') {
        // Check if stateId contains commas (multiple IDs)
        if (stateId.includes(',')) {
          const stateIds = stateId.split(',').map(id => id.trim());
          const stateIdConditions = stateIds.map(id => `state(id="${id}")`).join(' OR ');
          whereClause += ` AND (${stateIdConditions})`;
        } else {
          // Single stateId
          whereClause += ` AND state(id="${stateId}")`;
        }
      }
    }
    
    console.log(`Dispatch: Fetching orders with query: ${whereClause} for store: ${STORE_KEY}`);
    
    // Execute the query
    const response = await apiRoot
      .inStoreKeyWithStoreKeyValue({storeKey: STORE_KEY})
      .orders()
      .get({
        queryArgs: {
          where: whereClause,
          sort: ["createdAt desc"]
        }
      })
      .execute();
    
    // Get all orders and then filter by method if required
    let orders = response.body.results;
    
    // Filter by delivery method if specified
    if (method && typeof method === 'string') {
      orders = orders.filter(order => {
        // Check if order has custom fields
        if (order.custom) {
          // Check for Method in customFieldsRaw
          const customData = order.custom as any;
          if (Array.isArray(customData.customFieldsRaw)) {
            const methodField = customData.customFieldsRaw.find(
              (field: { name: string; value: any }) => field.name === 'Method'
            );
            return methodField && methodField.value === method;
          }
          
          // Try to access Method directly as a fallback
          if (customData.fields && customData.fields.Method) {
            return customData.fields.Method === method;
          }
        }
        
        return false; // No method field found
      });
    }
    
    // Map orders to the format expected by the Dispatch app
    const mappedOrders = orders.map(order => {
      const stateInfo = order.state ? stateMap.get(order.state.id) : null;
      const shippingAddress = order.shippingAddress || {};
      
      // Format customer name properly using firstName and lastName from shipping address if available
      let customerName = 'Customer'; // Default fallback
      
      if ((shippingAddress as any).firstName && (shippingAddress as any).lastName) {
        // Use properly formatted first and last name
        const firstName = capitalizeFirstLetter((shippingAddress as any).firstName);
        const lastName = capitalizeFirstLetter((shippingAddress as any).lastName);
        customerName = `${firstName} ${lastName}`;
      } else if (order.customerEmail) {
        // Fallback to email if shipping address doesn't have names
        customerName = order.customerEmail.split('@')[0];
      }
      
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId || '',
        customerName: customerName,
        customerEmail: order.customerEmail || '',
        createdAt: order.createdAt,
        lastModifiedAt: order.lastModifiedAt,
        totalPrice: order.totalPrice,
        taxedPrice: order.taxedPrice,
        shippingAddress: {
          streetName: (shippingAddress as any).streetName || '',
          streetNumber: (shippingAddress as any).streetNumber || '',
          city: (shippingAddress as any).city || '',
          postalCode: (shippingAddress as any).postalCode || '',
          country: (shippingAddress as any).country || '',
          state: (shippingAddress as any).state || '',
          apartment: (shippingAddress as any).apartment || ''
        },
        lineItems: order.lineItems.map(item => ({
          id: item.id,
          name: item.name.en,
          quantity: item.quantity,
          price: item.price.value,
          totalPrice: item.totalPrice,
          variant: {
            attributes: item.variant?.attributes || []
          }
        })),
        orderState: order.orderState,
        stateId: order.state?.id || '',
        state: order.state,
        stateInfo: stateInfo || { name: "Unknown", key: "unknown" }
      };
    });
    
    return res.json(mappedOrders);
  } catch (error) {
    return handleError(res, error, 'Failed to retrieve dispatch orders');
  }
});

// Endpoint to update order state
app.post('/orders/:id/state', async (req, res) => {
  const orderId = req.params.id;
  const { state } = req.body;
  
  if (!orderId || !state) {
    return res.status(400).json({ error: 'Order ID and state are required' });
  }
  
  try {
    // Get all available states
    const statesResponse = await apiRoot
      .states()
      .get()
      .execute();
    
    // Find the state object by key
    const stateObj = statesResponse.body.results
      .find(s => s.key === state && s.type === 'OrderState');
    
    if (!stateObj) {
      return res.status(400).json({ 
        error: 'Invalid state',
        message: `State "${state}" not found. Available order states: ${statesResponse.body.results
          .filter(s => s.type === 'OrderState')
          .map(s => s.key)
          .join(', ')}`
      });
    }
    
    // Get the current order to retrieve its version
    const orderResponse = await apiRoot
      .orders()
      .withId({ ID: orderId })
      .get()
      .execute();
    
    const orderVersion = orderResponse.body.version;
    
    console.log(`Transitioning order ${orderId} to state "${state}" (ID: ${stateObj.id}, version: ${orderVersion})`);
    
    // Update the order state
    const updateResponse = await apiRoot
      .orders()
      .withId({ ID: orderId })
      .post({
        body: {
          version: orderVersion,
          actions: [{
            action: "transitionState",
            state: {
              typeId: "state",
              id: stateObj.id
            }
          }]
        }
      })
      .execute();
    
    return res.json({
      success: true,
      message: `Order ${orderId} transitioned to state "${state}"`,
      order: updateResponse.body
    });
    
  } catch (error) {
    return handleError(res, error, `Failed to update order ${orderId} state`);
  }
});

// Debug endpoint to view available order states
app.get('/debug/order-states', async (req, res) => {
  try {
    // Fetch available states
    const statesResponse = await apiRoot
      .states()
      .get()
      .execute();
    
    const orderStates = statesResponse.body.results
      .filter(state => state.type === 'OrderState')
      .map(state => ({
        key: state.key,
        id: state.id,
        name: state.name?.en || state.key,
        initial: state.initial
      }));
    
    return res.json({
      available_states: orderStates,
      usage_example: {
        endpoint: "/orders/:id/state",
        method: "POST",
        body: {
          state: "in-oven" // Use the state key
        }
      }
    });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch order states');
  }
});

// Debug endpoint to inspect a specific order
app.get('/debug/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  
  try {
    const orderResponse = await apiRoot
      .orders()
      .withId({ ID: orderId })
      .get()
      .execute();
    
    return res.json({
      order: {
        id: orderResponse.body.id,
        version: orderResponse.body.version,
        state: orderResponse.body.state,
        orderState: orderResponse.body.orderState,
        custom: orderResponse.body.custom
      },
      update_example: {
        endpoint: `/orders/${orderId}/state`,
        method: "POST",
        body: {
          state: "in-oven" // Use the state key
        }
      }
    });
  } catch (error) {
    return handleError(res, error, `Failed to fetch order ${orderId}`);
  }
});

// New endpoint to fetch available drivers
app.get('/api/drivers', async (req, res) => {
  console.log(`Fetching available drivers for store ${STORE_KEY}`);
  
  try {
    // Build the query clause to match customers with driver type
    const whereClause = `custom(type(key="driver"))`;
    
    console.log(`Fetching drivers with query: ${whereClause}`);
    
    // Execute the query to get customers (drivers)
    const response = await apiRoot
      .customers()
      .get({
        queryArgs: {
          where: whereClause,
          limit: 100
        }
      })
      .execute();
    
    console.log(`Retrieved ${response.body.results.length} customers with driver type from API`);
    
    // Debug: Log first customer data to inspect structure
    if (response.body.results.length > 0) {
      const firstCustomer = response.body.results[0];
      console.log('First customer data:', JSON.stringify({
        id: firstCustomer.id,
        firstName: firstCustomer.firstName,
        lastName: firstCustomer.lastName,
        custom: firstCustomer.custom
      }, null, 2));
    }
    
    // Map customers to the driver format needed by the client
    const drivers = response.body.results.map(customer => {
      let isWorking = false;
      let isDispatched = false;
      let phoneNumber = '';
      
      // Process custom fields if available
      if (customer.custom) {
        const customData = customer.custom as any;
        
        if (Array.isArray(customData.customFieldsRaw)) {
          console.log(`Customer ${customer.id} has ${customData.customFieldsRaw.length} custom fields`);
          
          // Check if driver is working
          const workingField = customData.customFieldsRaw.find(
            (field: CustomField) => field.name === 'Working'
          );
          isWorking = workingField ? workingField.value === true || workingField.value === 'true' : false;
          
          // Check if driver is dispatched
          const dispatchedField = customData.customFieldsRaw.find(
            (field: CustomField) => field.name === 'Dispatched'
          );
          isDispatched = dispatchedField ? dispatchedField.value === true || dispatchedField.value === 'true' : false;
          
          // Get phone number from custom fields
          const phoneField = customData.customFieldsRaw.find(
            (field: CustomField) => field.name === 'phone'
          );
          
          if (phoneField && phoneField.value) {
            // Format phone number if it's a number
            const phoneValue = phoneField.value.toString();
            if (phoneValue.length === 10) {
              phoneNumber = `(${phoneValue.slice(0, 3)}) ${phoneValue.slice(3, 6)}-${phoneValue.slice(6)}`;
            } else {
              phoneNumber = phoneValue;
            }
          }
          
          // Debug: Log field extraction for first customer
          if (customer.id === response.body.results[0]?.id) {
            console.log('Field extraction results:', {
              workingField: workingField ? workingField.value : undefined,
              isWorking,
              dispatchedField: dispatchedField ? dispatchedField.value : undefined,
              isDispatched,
              phoneField: phoneField ? phoneField.value : undefined,
              phoneNumber
            });
          }
        } else {
          console.log(`Warning: Customer ${customer.id} has no customFieldsRaw array`);
        }
      } else {
        console.log(`Warning: Customer ${customer.id} has no custom data`);
      }
      
      return {
        id: customer.id,
        firstName: capitalizeFirstLetter(customer.firstName || ''),
        lastName: capitalizeFirstLetter(customer.lastName || ''),
        phoneNumber,
        isWorking,
        isDispatched
      };
    });
    
    // Filter to only return available drivers (Working=true AND Dispatched=false)
    const availableDrivers = drivers.filter(driver => 
      driver.isWorking && !driver.isDispatched
    );
    
    console.log(`Found ${availableDrivers.length} available drivers out of ${drivers.length} total drivers`);
    
    // If no drivers found, provide fallback mock data for testing
    if (availableDrivers.length === 0) {
      console.log('No available drivers found. Using mock data as fallback.');
      return res.json([{
        id: 'driver-1',
        firstName: 'Uriel',
        lastName: 'Reyes',
        phoneNumber: '(281) 330-8004',
        isWorking: true,
        isDispatched: false
      }]);
    }
    
    return res.json(availableDrivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    
    // In case of error, return mock data
    console.log('Error occurred. Using mock data as fallback.');
    return res.json([{
      id: 'driver-1',
      firstName: 'Uriel',
      lastName: 'Reyes',
      phoneNumber: '(281) 330-8004',
      isWorking: true,
      isDispatched: false
    }]);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Using store key: ${STORE_KEY} for all endpoints`);
});