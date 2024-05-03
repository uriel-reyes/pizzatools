"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BuildClient_1 = require("../src/BuildClient");
var getStoreOrders = function () {
    return BuildClient_1.default
        .inStoreKeyWithStoreKeyValue({ storeKey: "pizza-palace-1" })
        .orders()
        .get()
        .execute()
        .then(function (response) {
        var orders = response.body.results;
        orders.forEach(function (order) {
            // This will convert lineItems array into a readable JSON string.
            var makeLine = JSON.stringify(order.lineItems, null, 2);
            console.log("Order ID: ".concat(order.id, ", Items: ").concat(makeLine));
        });
    });
};
exports.default = getStoreOrders;
