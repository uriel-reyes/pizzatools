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
                lineItems: order.lineItems.map(lineItem => ({
                    productName: lineItem.name.en,
                    quantity: lineItem.quantity,
                    ingredients: lineItem.custom && lineItem.custom.fields ? lineItem.custom.fields.Ingredients : []
                }))
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
// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Using store key: ${STORE_KEY} for all endpoints`);
});
