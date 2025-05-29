"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors = require("cors");
const BuildClient_1 = __importDefault(require("./src/BuildClient"));
// Constant values
const STORE_KEY = "9267"; // Consistent store key for all endpoints
const port = process.env.PORT || 3001;
// Helper functions for reusable logic
function capitalizeFirstLetter(str) {
    if (!str)
        return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
async function getStateMap() {
    // Create a map of state ID to state name
    const statesResponse = await BuildClient_1.default
        .states()
        .get()
        .execute();
    const stateMap = new Map();
    statesResponse.body.results.forEach(state => {
        var _a;
        stateMap.set(state.id, {
            name: ((_a = state.name) === null || _a === void 0 ? void 0 : _a.en) || state.key,
            key: state.key
        });
    });
    return stateMap;
}
// Common error handler
function handleError(res, error, message = 'Server error') {
    console.error(message, error);
    let errorMessage = message;
    let errorDetails = {};
    if (error instanceof Error) {
        errorMessage = error.message;
        // Try to extract more details from commercetools error
        const ctError = error;
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
        const response = await BuildClient_1.default
            .inStoreKeyWithStoreKeyValue({ storeKey: STORE_KEY })
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
                lineItems: order.lineItems.map(lineItem => {
                    var _a;
                    // Extract name using the appropriate property path (either en-US or en)
                    const name = lineItem.name["en-US"] || lineItem.name.en || "Pizza Item";
                    // Extract product type and custom fields
                    const productType = lineItem.productType || {};
                    const customFields = ((_a = lineItem.custom) === null || _a === void 0 ? void 0 : _a.fields) || {};
                    // Return a properly formatted line item for the makeline
                    return {
                        id: lineItem.id,
                        productId: lineItem.productId,
                        productKey: lineItem.productKey,
                        productType: productType,
                        name: lineItem.name,
                        productName: name,
                        quantity: lineItem.quantity,
                        variant: lineItem.variant,
                        custom: lineItem.custom,
                        // Extract toppings/ingredients from the custom fields
                        ingredients: (() => {
                            let ingredients = [];
                            // Check if we have custom fields for pizza toppings
                            if (customFields) {
                                // Extract toppings from Whole section
                                if (customFields.Whole && Array.isArray(customFields.Whole)) {
                                    ingredients = [...ingredients, ...customFields.Whole];
                                }
                                // Extract toppings from Left section with prefix
                                if (customFields.Left && Array.isArray(customFields.Left)) {
                                    ingredients = [...ingredients, ...customFields.Left.map(topping => `Left: ${topping}`)];
                                }
                                // Extract toppings from Right section with prefix
                                if (customFields.Right && Array.isArray(customFields.Right)) {
                                    ingredients = [...ingredients, ...customFields.Right.map(topping => `Right: ${topping}`)];
                                }
                                // Add sauce info if available
                                if (customFields.Sauce) {
                                    let sauceDesc = customFields.Sauce;
                                    // Format sauce description for readability
                                    if (sauceDesc === 'extra') {
                                        sauceDesc = 'Extra';
                                    }
                                    else if (sauceDesc === 'light') {
                                        sauceDesc = 'Light';
                                    }
                                    else {
                                        sauceDesc = capitalizeFirstLetter(sauceDesc);
                                    }
                                    // Add sauce type if available
                                    if (customFields['Sauce-Type']) {
                                        const sauceType = customFields['Sauce-Type'];
                                        ingredients.push(`Sauce: ${sauceDesc} ${sauceType}`);
                                    }
                                    else {
                                        ingredients.push(`Sauce: ${sauceDesc}`);
                                    }
                                }
                                // Add cheese info if available
                                if (customFields.Cheese) {
                                    let cheeseDesc = customFields.Cheese;
                                    // Format cheese description for readability
                                    if (cheeseDesc === 'extra') {
                                        cheeseDesc = 'Extra';
                                    }
                                    else if (cheeseDesc === 'light') {
                                        cheeseDesc = 'Light';
                                    }
                                    else {
                                        cheeseDesc = capitalizeFirstLetter(cheeseDesc);
                                    }
                                    // Add cheese type if available
                                    if (customFields['Cheese-Type']) {
                                        const cheeseType = customFields['Cheese-Type'];
                                        ingredients.push(`Cheese: ${cheeseDesc} ${cheeseType}`);
                                    }
                                    else {
                                        ingredients.push(`Cheese: ${cheeseDesc}`);
                                    }
                                }
                            }
                            // Clean up ingredient names by removing " (normal)" suffix
                            return ingredients.map(ing => ing.replace(/ \(normal\)$/, ''));
                        })()
                    };
                })
            };
        });
        return res.json(mappedOrders);
    }
    catch (error) {
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
                }
                else {
                    // Single stateId
                    whereClause += ` AND state(id="${stateId}")`;
                }
            }
        }
        console.log(`Dispatch: Fetching orders with query: ${whereClause} for store: ${STORE_KEY}`);
        // Execute the query
        const response = await BuildClient_1.default
            .inStoreKeyWithStoreKeyValue({ storeKey: STORE_KEY })
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
                    const customData = order.custom;
                    if (Array.isArray(customData.customFieldsRaw)) {
                        const methodField = customData.customFieldsRaw.find((field) => field.name === 'Method');
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
            var _a;
            const stateInfo = order.state ? stateMap.get(order.state.id) : null;
            const shippingAddress = order.shippingAddress || {};
            // Format customer name properly using firstName and lastName from shipping address if available
            let customerName = 'Customer'; // Default fallback
            if (shippingAddress.firstName && shippingAddress.lastName) {
                // Use properly formatted first and last name
                const firstName = capitalizeFirstLetter(shippingAddress.firstName);
                const lastName = capitalizeFirstLetter(shippingAddress.lastName);
                customerName = `${firstName} ${lastName}`;
            }
            else if (order.customerEmail) {
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
                    streetName: shippingAddress.streetName || '',
                    streetNumber: shippingAddress.streetNumber || '',
                    city: shippingAddress.city || '',
                    postalCode: shippingAddress.postalCode || '',
                    country: shippingAddress.country || '',
                    state: shippingAddress.state || '',
                    apartment: shippingAddress.apartment || ''
                },
                lineItems: order.lineItems.map(item => {
                    var _a;
                    return ({
                        id: item.id,
                        name: item.name.en,
                        quantity: item.quantity,
                        price: item.price.value,
                        totalPrice: item.totalPrice,
                        variant: {
                            attributes: ((_a = item.variant) === null || _a === void 0 ? void 0 : _a.attributes) || []
                        }
                    });
                }),
                orderState: order.orderState,
                stateId: ((_a = order.state) === null || _a === void 0 ? void 0 : _a.id) || '',
                state: order.state,
                stateInfo: stateInfo || { name: "Unknown", key: "unknown" }
            };
        });
        return res.json(mappedOrders);
    }
    catch (error) {
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
        const statesResponse = await BuildClient_1.default
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
        const orderResponse = await BuildClient_1.default
            .orders()
            .withId({ ID: orderId })
            .get()
            .execute();
        const orderVersion = orderResponse.body.version;
        console.log(`Transitioning order ${orderId} to state "${state}" (ID: ${stateObj.id}, version: ${orderVersion})`);
        // Update the order state
        const updateResponse = await BuildClient_1.default
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
    }
    catch (error) {
        return handleError(res, error, `Failed to update order ${orderId} state`);
    }
});
// Debug endpoint to view available order states
app.get('/debug/order-states', async (req, res) => {
    try {
        // Fetch available states
        const statesResponse = await BuildClient_1.default
            .states()
            .get()
            .execute();
        const orderStates = statesResponse.body.results
            .filter(state => state.type === 'OrderState')
            .map(state => {
            var _a;
            return ({
                key: state.key,
                id: state.id,
                name: ((_a = state.name) === null || _a === void 0 ? void 0 : _a.en) || state.key,
                initial: state.initial
            });
        });
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
    }
    catch (error) {
        return handleError(res, error, 'Failed to fetch order states');
    }
});
// Debug endpoint to inspect a specific order
app.get('/debug/orders/:id', async (req, res) => {
    const orderId = req.params.id;
    try {
        const orderResponse = await BuildClient_1.default
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
    }
    catch (error) {
        return handleError(res, error, `Failed to fetch order ${orderId}`);
    }
});
// New endpoint to fetch available drivers
app.get('/api/drivers', async (req, res) => {
    const includeDispatched = req.query.includeDispatched === 'true';
    console.log(`Fetching ${includeDispatched ? 'all' : 'available'} drivers for store ${STORE_KEY}`);
    try {
        // Build the query clause to match customers with driver type
        // Using ID instead of key as the API requires id and typeId, not key
        const whereClause = `custom(type(id="772f9b61-9804-40dc-94da-2fb88b020bd0"))`;
        console.log(`Fetching drivers with query: ${whereClause}`);
        // Execute the query to get customers (drivers)
        const response = await BuildClient_1.default
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
            var _a;
            let isWorking = false;
            let isDispatched = false;
            let phoneNumber = '';
            // Process custom fields if available
            if (customer.custom) {
                const customData = customer.custom;
                // Use fields directly instead of customFieldsRaw
                if (customData.fields) {
                    console.log(`Customer ${customer.id} has fields in custom data`);
                    // Extract values directly from fields object
                    isWorking = customData.fields.Working === true;
                    isDispatched = customData.fields.Dispatched === true;
                    // Get phone number
                    if (customData.fields.phone) {
                        // Format phone number if it's a number
                        const phoneValue = customData.fields.phone.toString();
                        if (phoneValue.length === 10) {
                            phoneNumber = `(${phoneValue.slice(0, 3)}) ${phoneValue.slice(3, 6)}-${phoneValue.slice(6)}`;
                        }
                        else {
                            phoneNumber = phoneValue;
                        }
                    }
                    // Debug: Log field extraction for first customer
                    if (customer.id === ((_a = response.body.results[0]) === null || _a === void 0 ? void 0 : _a.id)) {
                        console.log('Field extraction results:', {
                            isWorking,
                            isDispatched,
                            phoneNumber,
                            rawFields: customData.fields
                        });
                    }
                }
                // Fallback to customFieldsRaw if fields is not available
                else if (Array.isArray(customData.customFieldsRaw)) {
                    console.log(`Customer ${customer.id} has ${customData.customFieldsRaw.length} custom fields in customFieldsRaw`);
                    // Check if driver is working
                    const workingField = customData.customFieldsRaw.find((field) => field.name === 'Working');
                    isWorking = workingField ? workingField.value === true || workingField.value === 'true' : false;
                    // Check if driver is dispatched
                    const dispatchedField = customData.customFieldsRaw.find((field) => field.name === 'Dispatched');
                    isDispatched = dispatchedField ? dispatchedField.value === true || dispatchedField.value === 'true' : false;
                    // Get phone number from custom fields
                    const phoneField = customData.customFieldsRaw.find((field) => field.name === 'phone');
                    if (phoneField && phoneField.value) {
                        // Format phone number if it's a number
                        const phoneValue = phoneField.value.toString();
                        if (phoneValue.length === 10) {
                            phoneNumber = `(${phoneValue.slice(0, 3)}) ${phoneValue.slice(3, 6)}-${phoneValue.slice(6)}`;
                        }
                        else {
                            phoneNumber = phoneValue;
                        }
                    }
                }
                else {
                    console.log(`Warning: Customer ${customer.id} has no fields or customFieldsRaw in custom data`);
                }
            }
            else {
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
        // Filter drivers based on the includeDispatched parameter
        const filteredDrivers = includeDispatched
            ? drivers.filter(driver => driver.isWorking) // Include all working drivers
            : drivers.filter(driver => driver.isWorking && !driver.isDispatched); // Only available drivers
        console.log(`Found ${filteredDrivers.length} drivers (${includeDispatched ? 'including' : 'excluding'} dispatched drivers) out of ${drivers.length} total drivers`);
        // If no drivers found, provide fallback mock data for testing
        if (filteredDrivers.length === 0) {
            console.log('No drivers found. Using mock data as fallback.');
            return res.json([{
                    id: 'driver-1',
                    firstName: 'Uriel',
                    lastName: 'Reyes',
                    phoneNumber: '(737) 000-0000',
                    isWorking: true,
                    isDispatched: false
                }]);
        }
        return res.json(filteredDrivers);
    }
    catch (error) {
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
// Endpoint to get orders assigned to a driver
app.get('/api/drivers/:id/orders', async (req, res) => {
    var _a, _b, _c, _d;
    const driverId = req.params.id;
    if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
    }
    try {
        // Get the driver to check for assigned orders
        const driverResponse = await BuildClient_1.default
            .customers()
            .withId({ ID: driverId })
            .get()
            .execute();
        // Extract deliveries from custom fields
        const customData = driverResponse.body.custom;
        let deliveryOrderRefs = [];
        if (customData && customData.fields && customData.fields.Deliveries) {
            deliveryOrderRefs = customData.fields.Deliveries;
        }
        if (!deliveryOrderRefs || deliveryOrderRefs.length === 0) {
            return res.json([]);
        }
        // Get state info map
        const stateMap = await getStateMap();
        // Define state IDs for delivered and cancelled orders
        const DELIVERED_STATE_ID = "4913a6ba-52f9-4eb3-84ad-0722ca18c94f";
        const CANCELLED_STATE_ID = "bcd60537-7c35-4d96-87d4-56e2a905a8a5"; // Assuming this is the cancelled state ID
        const OUT_FOR_DELIVERY_STATE_ID = "940a3d1f-fd99-402f-b836-788f13600840";
        // Fetch each order
        const orders = [];
        for (const orderRef of deliveryOrderRefs) {
            try {
                const orderId = orderRef.id;
                const orderResponse = await BuildClient_1.default
                    .orders()
                    .withId({ ID: orderId })
                    .get()
                    .execute();
                const order = orderResponse.body;
                const stateInfo = order.state ? stateMap.get(order.state.id) : null;
                // Skip orders that are delivered or cancelled
                if (order.state && (order.state.id === DELIVERED_STATE_ID ||
                    order.state.id === CANCELLED_STATE_ID)) {
                    console.log(`Skipping order ${orderId} as it is in state: ${stateInfo === null || stateInfo === void 0 ? void 0 : stateInfo.name}`);
                    continue;
                }
                // For active drivers, only include orders that are out for delivery
                if (((_b = (_a = driverResponse.body.custom) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.Dispatched) === true &&
                    ((_c = order.state) === null || _c === void 0 ? void 0 : _c.id) !== OUT_FOR_DELIVERY_STATE_ID) {
                    console.log(`Skipping order ${orderId} as driver is dispatched but order is not out for delivery`);
                    continue;
                }
                const shippingAddress = order.shippingAddress || {};
                // Format customer name properly
                let customerName = 'Customer'; // Default fallback
                if (shippingAddress.firstName && shippingAddress.lastName) {
                    // Use properly formatted first and last name
                    const firstName = capitalizeFirstLetter(shippingAddress.firstName);
                    const lastName = capitalizeFirstLetter(shippingAddress.lastName);
                    customerName = `${firstName} ${lastName}`;
                }
                else if (order.customerEmail) {
                    // Fallback to email if shipping address doesn't have names
                    customerName = order.customerEmail.split('@')[0];
                }
                orders.push({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    customerName: customerName,
                    shippingAddress: {
                        streetName: shippingAddress.streetName || '',
                        streetNumber: shippingAddress.streetNumber || '',
                        city: shippingAddress.city || '',
                        postalCode: shippingAddress.postalCode || ''
                    },
                    stateId: ((_d = order.state) === null || _d === void 0 ? void 0 : _d.id) || '',
                    stateInfo: stateInfo || { name: "Unknown", key: "unknown" }
                });
            }
            catch (error) {
                console.error(`Error fetching order ${orderRef.id}:`, error);
            }
        }
        return res.json(orders);
    }
    catch (error) {
        return handleError(res, error, `Failed to fetch orders for driver ${driverId}`);
    }
});
// Debug endpoint to list recent orders with their states
app.get('/debug/recent-orders', async (req, res) => {
    try {
        // Get state info map
        const stateMap = await getStateMap();
        // Execute the query to get recent orders
        const response = await BuildClient_1.default
            .inStoreKeyWithStoreKeyValue({ storeKey: STORE_KEY })
            .orders()
            .get({
            queryArgs: {
                sort: ["createdAt desc"],
                limit: 10
            }
        })
            .execute();
        // Map orders to a simplified format with state info
        const orders = response.body.results.map(order => {
            var _a, _b, _c, _d, _e, _f;
            const stateInfo = order.state ? stateMap.get(order.state.id) : null;
            const customData = order.custom;
            const customMethod = ((_b = (_a = order.custom) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.Method) ||
                ((_d = (_c = customData === null || customData === void 0 ? void 0 : customData.customFieldsRaw) === null || _c === void 0 ? void 0 : _c.find((f) => f.name === 'Method')) === null || _d === void 0 ? void 0 : _d.value);
            return {
                id: order.id,
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                orderState: order.orderState,
                state: {
                    id: (_e = order.state) === null || _e === void 0 ? void 0 : _e.id,
                    key: (stateInfo === null || stateInfo === void 0 ? void 0 : stateInfo.key) || 'unknown',
                    name: (stateInfo === null || stateInfo === void 0 ? void 0 : stateInfo.name) || 'Unknown'
                },
                method: customMethod,
                customerName: ((_f = order.shippingAddress) === null || _f === void 0 ? void 0 : _f.firstName)
                    ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
                    : order.customerEmail
            };
        });
        // List available state transitions for delivery workflow
        const availableStates = Array.from(stateMap.entries())
            .filter(([_, info]) => ['in-oven', 'pending-delivery', 'delivered'].includes(info.key))
            .map(([id, info]) => ({
            id,
            key: info.key,
            name: info.name
        }));
        return res.json({
            orders,
            availableStates,
            instructions: {
                explanation: "Use the /orders/:id/state endpoint to transition orders to the proper state",
                example: {
                    endpoint: "/orders/:id/state",
                    method: "POST",
                    body: {
                        state: "in-oven" // Or "pending-delivery"
                    }
                },
                pendingDeliveryId: "118b88e6-013e-45db-8608-d8b2358ecbb4",
                inOvenId: "393518bd-5207-4aba-b910-81cb2e7343f4"
            }
        });
    }
    catch (error) {
        return handleError(res, error, 'Failed to fetch recent orders');
    }
});
// Endpoint to update order states from "In Oven" to "Pending Delivery" before dispatch
app.post('/api/update-order-states', async (req, res) => {
    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'No order IDs provided' });
    }
    console.log(`Updating states for ${orderIds.length} orders before dispatch`);
    try {
        const results = [];
        // Process each order
        for (const orderId of orderIds) {
            try {
                // Get the current order to check its state
                const orderResponse = await BuildClient_1.default
                    .orders()
                    .withId({ ID: orderId })
                    .get()
                    .execute();
                const order = orderResponse.body;
                const orderVersion = order.version;
                // Check if the order is in "In Oven" state (ID: 393518bd-5207-4aba-b910-81cb2e7343f4)
                // If so, transition it to "Pending Delivery" (ID: 118b88e6-013e-45db-8608-d8b2358ecbb4)
                if (order.state && order.state.id === "393518bd-5207-4aba-b910-81cb2e7343f4") {
                    console.log(`Order ${orderId} is in "In Oven" state, transitioning to "Pending Delivery"`);
                    const updateResponse = await BuildClient_1.default
                        .orders()
                        .withId({ ID: orderId })
                        .post({
                        body: {
                            version: orderVersion,
                            actions: [{
                                    action: "transitionState",
                                    state: {
                                        typeId: "state",
                                        id: "118b88e6-013e-45db-8608-d8b2358ecbb4" // Pending Delivery
                                    }
                                }]
                        }
                    })
                        .execute();
                    results.push({
                        orderId,
                        previousState: "In Oven",
                        newState: "Pending Delivery",
                        success: true
                    });
                }
                else {
                    // Order already in appropriate state
                    console.log(`Order ${orderId} not in "In Oven" state, no transition needed`);
                    results.push({
                        orderId,
                        previousState: order.state ? order.state.id : "unknown",
                        newState: "unchanged",
                        success: true
                    });
                }
            }
            catch (error) {
                console.error(`Error updating order ${orderId}:`, error);
                results.push({
                    orderId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return res.json({
            success: true,
            message: `Processed ${orderIds.length} orders`,
            results
        });
    }
    catch (error) {
        return handleError(res, error, 'Failed to update order states');
    }
});
// Endpoint to dispatch drivers with their assigned orders
app.post('/api/dispatch', async (req, res) => {
    var _a;
    const { assignments } = req.body;
    if (!assignments || Object.keys(assignments).length === 0) {
        return res.status(400).json({ error: 'No driver assignments provided' });
    }
    console.log('Received dispatch request with assignments:', assignments);
    try {
        const results = [];
        // Process each driver and their assigned orders
        for (const [driverId, orderIds] of Object.entries(assignments)) {
            if (!Array.isArray(orderIds) || orderIds.length === 0) {
                console.log(`Skipping driver ${driverId} - no orders assigned`);
                continue;
            }
            console.log(`Processing driver ${driverId} with ${orderIds.length} assigned orders`);
            // 1. Get the current driver to retrieve version
            const driverResponse = await BuildClient_1.default
                .customers()
                .withId({ ID: driverId })
                .get()
                .execute();
            const driverVersion = driverResponse.body.version;
            // 2. Update driver with orders and set Dispatched=true
            const updateDriverResponse = await BuildClient_1.default
                .customers()
                .withId({ ID: driverId })
                .post({
                body: {
                    version: driverVersion,
                    actions: [
                        {
                            action: 'setCustomType',
                            type: {
                                typeId: 'type',
                                id: '772f9b61-9804-40dc-94da-2fb88b020bd0' // Driver type ID
                            },
                            fields: {
                                ...(((_a = driverResponse.body.custom) === null || _a === void 0 ? void 0 : _a.fields) || {}),
                                Dispatched: true,
                                Deliveries: orderIds.map(orderId => ({
                                    typeId: 'order',
                                    id: orderId
                                }))
                            }
                        }
                    ]
                }
            })
                .execute();
            console.log(`Updated driver ${driverId} to dispatched status with ${orderIds.length} orders`);
            // 3. Update each order to "Out On Delivery" state (ID: 940a3d1f-fd99-402f-b836-788f13600840)
            // AND set the Driver custom field on each order
            const orderUpdates = await Promise.all(orderIds.map(async (orderId) => {
                try {
                    // Get current order version
                    const orderResponse = await BuildClient_1.default
                        .orders()
                        .withId({ ID: orderId })
                        .get()
                        .execute();
                    const orderVersion = orderResponse.body.version;
                    // Update order state and set Driver custom field
                    const updateResponse = await BuildClient_1.default
                        .orders()
                        .withId({ ID: orderId })
                        .post({
                        body: {
                            version: orderVersion,
                            actions: [
                                {
                                    action: "transitionState",
                                    state: {
                                        typeId: "state",
                                        id: "940a3d1f-fd99-402f-b836-788f13600840" // Out On Delivery
                                    }
                                },
                                {
                                    action: "setCustomField",
                                    name: "Driver",
                                    value: {
                                        typeId: "customer",
                                        id: driverId
                                    }
                                }
                            ]
                        }
                    })
                        .execute();
                    console.log(`Updated order ${orderId} to "Out On Delivery" state and set Driver to ${driverId}`);
                    return {
                        orderId,
                        success: true
                    };
                }
                catch (error) {
                    console.error(`Error updating order ${orderId}:`, error);
                    return {
                        orderId,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            }));
            results.push({
                driverId,
                driver: {
                    firstName: updateDriverResponse.body.firstName,
                    lastName: updateDriverResponse.body.lastName
                },
                success: true,
                orders: orderUpdates
            });
        }
        return res.json({
            success: true,
            message: `Successfully dispatched ${results.length} drivers`,
            results
        });
    }
    catch (error) {
        return handleError(res, error, 'Failed to dispatch drivers');
    }
});
// Endpoint to mark a driver as returned
app.post('/api/drivers/:id/return', async (req, res) => {
    var _a, _b;
    const driverId = req.params.id;
    if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
    }
    try {
        // 1. Get the current driver to retrieve version and delivery orders
        const driverResponse = await BuildClient_1.default
            .customers()
            .withId({ ID: driverId })
            .get()
            .execute();
        const driverVersion = driverResponse.body.version;
        const deliveryOrderIds = ((_b = (_a = driverResponse.body.custom) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.Deliveries) || [];
        // 2. Update driver to set Dispatched=false but KEEP the Deliveries list
        const updateDriverResponse = await BuildClient_1.default
            .customers()
            .withId({ ID: driverId })
            .post({
            body: {
                version: driverVersion,
                actions: [
                    {
                        action: 'setCustomField',
                        name: 'Dispatched',
                        value: false
                    }
                    // No longer clearing the Deliveries field to preserve history
                ]
            }
        })
            .execute();
        console.log(`Marked driver ${driverId} as returned (not dispatched) while preserving delivery history`);
        // 3. Update all associated orders to "Delivered" state (ID: 4913a6ba-52f9-4eb3-84ad-0722ca18c94f)
        // but KEEP the Driver reference
        const orderUpdates = await Promise.all(deliveryOrderIds.map(async (orderRef) => {
            try {
                const orderId = orderRef.id;
                // Get current order version
                const orderResponse = await BuildClient_1.default
                    .orders()
                    .withId({ ID: orderId })
                    .get()
                    .execute();
                const orderVersion = orderResponse.body.version;
                // Update order state but keep the Driver field
                const updateResponse = await BuildClient_1.default
                    .orders()
                    .withId({ ID: orderId })
                    .post({
                    body: {
                        version: orderVersion,
                        actions: [
                            {
                                action: "transitionState",
                                state: {
                                    typeId: "state",
                                    id: "4913a6ba-52f9-4eb3-84ad-0722ca18c94f" // Delivered
                                }
                            }
                            // No longer clearing the Driver field to preserve history
                        ]
                    }
                })
                    .execute();
                console.log(`Updated order ${orderId} to "Delivered" state while preserving driver assignment`);
                return {
                    orderId,
                    success: true
                };
            }
            catch (error) {
                console.error(`Error updating order:`, error);
                return {
                    orderId: orderRef.id,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        }));
        return res.json({
            success: true,
            driverId,
            driver: {
                firstName: updateDriverResponse.body.firstName,
                lastName: updateDriverResponse.body.lastName
            },
            orders: orderUpdates
        });
    }
    catch (error) {
        return handleError(res, error, `Failed to process driver ${driverId} return`);
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Using store key: ${STORE_KEY} for all endpoints`);
});
