"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors = require("cors");
const getStoreOrders_1 = __importDefault(require("./lib/getStoreOrders"));
const BuildClient_1 = __importDefault(require("./src/BuildClient"));
const app = express();
const port = process.env.PORT || 3001;
// Middleware
app.use(cors());
app.use(express.json());
// Endpoint to get orders
app.get('/orders', (req, res) => {
    (0, getStoreOrders_1.default)().then(orders => {
        res.json(orders);
    }).catch(error => {
        console.error('Failed to retrieve orders:', error);
        res.status(500).send('Failed to retrieve orders');
    });
});
// New endpoint to get orders with specific state
app.get('/api/orders', async (req, res) => {
    const { state, stateId } = req.query;
    if (!state || typeof state !== 'string') {
        return res.status(400).json({ error: 'State parameter is required' });
    }
    try {
        // First fetch state names
        const statesResponse = await BuildClient_1.default
            .states()
            .get()
            .execute();
        // Create a map of state ID to state name
        const stateMap = new Map();
        statesResponse.body.results.forEach(state => {
            var _a;
            stateMap.set(state.id, {
                name: ((_a = state.name) === null || _a === void 0 ? void 0 : _a.en) || state.key,
                key: state.key
            });
        });
        // Build the where clause based on provided parameters
        let whereClause = `orderState = "${state}"`;
        if (stateId && typeof stateId === 'string') {
            whereClause += ` AND state(id="${stateId}")`;
        }
        const response = await BuildClient_1.default
            .inStoreKeyWithStoreKeyValue({ storeKey: "pizza-palace-1" })
            .orders()
            .get({
            queryArgs: {
                where: whereClause
            }
        })
            .execute();
        const orders = response.body.results.map(order => {
            var _a;
            // Get state name from map if available
            const stateInfo = order.state ? stateMap.get(order.state.id) : null;
            // Extract customer information
            const customerName = order.customerEmail ? order.customerEmail.split('@')[0] : 'Customer';
            // Get the shipping address
            const shippingAddress = order.shippingAddress || {};
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
        return res.json(orders);
    }
    catch (error) {
        console.error('Failed to retrieve orders:', error);
        return res.status(500).send('Failed to retrieve orders');
    }
});
// New endpoint to update order state with correct action
app.post('/orders/:id/state', async (req, res) => {
    const orderId = req.params.id;
    const { state } = req.body;
    if (!orderId || !state) {
        return res.status(400).json({ error: 'Order ID and state are required' });
    }
    try {
        // First, get all available states to find the right state ID
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
        // Update the order with the correct transitionState action
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
        console.error(`Failed to update order ${orderId} state:`, error);
        let errorMessage = 'Failed to update order state';
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
            error: 'Failed to update order state',
            message: errorMessage,
            details: errorDetails
        });
    }
});
// Debug endpoint to test state transitions
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
        console.error('Error fetching states:', error);
        let errorMessage = 'Failed to fetch order states';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return res.status(500).json({
            error: errorMessage
        });
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
                // Include other relevant fields
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
        console.error(`Error fetching order ${orderId}:`, error);
        let errorMessage = 'Failed to fetch order';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return res.status(500).json({
            error: errorMessage
        });
    }
});
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
