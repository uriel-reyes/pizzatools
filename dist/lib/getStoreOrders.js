"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BuildClient_1 = __importDefault(require("../src/BuildClient"));
// Function to fetch order states and return a map of id -> state name
const getStateNames = async () => {
    try {
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
        return stateMap;
    }
    catch (error) {
        console.error("Error fetching state names:", error);
        return new Map(); // Return empty map in case of error
    }
};
const getStoreOrders = async () => {
    // First fetch state names
    const stateMap = await getStateNames();
    return BuildClient_1.default
        .inStoreKeyWithStoreKeyValue({ storeKey: "pizza-palace-1" })
        .orders()
        .get({
        queryArgs: {
            where: 'orderState = "Open" AND state(id="1c25473a-05e1-46f4-82a7-acc66d0a5154")'
        }
    })
        .execute()
        .then(response => {
        return response.body.results.map(order => {
            // Get state name from map if available
            const stateInfo = order.state ? stateMap.get(order.state.id) : null;
            return {
                id: order.id,
                createdAt: order.createdAt,
                // Include both state object and human-readable state information
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
    });
};
exports.default = getStoreOrders;
