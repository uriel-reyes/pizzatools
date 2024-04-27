"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noPay = void 0;
var BuildClient_1 = require("../src/BuildClient");
// Function responsible for creating a cart
var createCart = function () {
    return BuildClient_1.default.carts().post({
        body: {
            currency: "USD",
            store: {
                key: "pizza-palace-1",
                typeId: "store"
            },
            lineItems: [
                {
                    sku: "pizza",
                    quantity: 6,
                    distributionChannel: {
                        key: "pizza-palace-1",
                        typeId: "channel"
                    },
                    supplyChannel: {
                        key: "pizza-palace-1",
                        typeId: "channel"
                    },
                    inventoryMode: "ReserveOnOrder"
                }
            ],
            shippingAddress: {
                country: "US",
                state: "Texas"
            },
            billingAddress: {
                firstName: "Loyal",
                lastName: "Customer",
                country: "US"
            }
        }
    }).execute();
};
// Function responsible for creating an order from a cart
var createOrder = function (cartId, version) {
    return BuildClient_1.default.orders().post({
        body: {
            version: version,
            cart: {
                typeId: "cart",
                id: cartId
            },
            state: {
                typeId: "state",
                key: "prepping"
            }
        }
    }).execute();
};
// Function that orchestrates the creation of a cart and then creates an order from that cart
var noPay = function () {
    return createCart()
        .then(function (cartResponse) {
        var _a = cartResponse.body, cartId = _a.id, cartVersion = _a.version;
        return createOrder(cartId, cartVersion);
    });
};
exports.noPay = noPay;
