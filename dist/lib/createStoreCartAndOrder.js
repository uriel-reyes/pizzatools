"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yesPay = void 0;
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
                    quantity: 2,
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
var createPayment = function (cartAmount) {
    return BuildClient_1.default
        .payments()
        .post({ body: {
            amountPlanned: cartAmount,
            paymentMethodInfo: {
                method: "Cash on Delivery"
            }
        }
    })
        .execute();
};
var addPaymentToCart = function (cartId, paymentId, version) {
    return BuildClient_1.default
        .carts()
        .withId({ ID: cartId })
        .post({
        body: {
            version: version,
            actions: [{
                    action: "addPayment",
                    payment: {
                        id: paymentId,
                        typeId: "payment"
                    }
                }]
        }
    }).execute();
};
// Function responsible for creating an order from a cart
var createOrder = function (cartId, version, cartAmount) {
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
var yesPay = function () {
    return createCart()
        .then(function (cartResponse) {
        var _a = cartResponse.body, cartId = _a.id, cartVersion = _a.version, cartAmount = _a.totalPrice;
        return createPayment(cartAmount) // Assuming cartAmount is an object with centAmount
            .then(function (paymentResponse) {
            var paymentId = paymentResponse.body.id;
            return addPaymentToCart(cartId, paymentId, cartVersion)
                .then(function (paymentAddedResponse) {
                // After adding payment, you often need to update the version as the cart has changed
                var updatedVersion = paymentAddedResponse.body.version;
                return createOrder(cartId, updatedVersion, cartAmount.centAmount);
            });
        });
    });
};
exports.yesPay = yesPay;
