"use strict";
// import apiRoot from "../src/BuildClient";
Object.defineProperty(exports, "__esModule", { value: true });
// const getStoreOrders = () =>{
//     return apiRoot
//     .inStoreKeyWithStoreKeyValue({storeKey:"pizza-palace-1"})
//     .orders()
//     .get()
//     .execute()
//     .then(response => {
//               const orders = response.body.results;
//               orders.forEach(order => {
//                 // This will convert lineItems array into a readable JSON string.
//                 const makeLine = JSON.stringify(order.lineItems, null, 2);
//                 console.log(`Order ID: ${order.id}, Items: ${makeLine}`);
//               });
//             }
//         )}
// export default getStoreOrders;
var BuildClient_1 = require("../src/BuildClient");
var getStoreOrders = function () {
    return BuildClient_1.default
        .inStoreKeyWithStoreKeyValue({ storeKey: "pizza-palace-1" })
        .orders()
        .get({
        queryArgs: {
            where: 'orderState = "Confirmed"'
        }
    })
        .execute()
        .then(function (response) {
        var orders = response.body.results;
        orders.forEach(function (order) {
            // Map each lineItem to extract only the product name and fields object, safely checking for undefined properties
            var lineItemsSummary = order.lineItems.map(function (lineItem) { return ({
                productName: lineItem.name.en,
                ingredients: lineItem.custom && lineItem.custom.fields ? lineItem.custom.fields.Ingredients : []
            }); });
            console.log("Order ID: ".concat(order.id, ", Items: ").concat(JSON.stringify(lineItemsSummary, null, 2)));
        });
    });
};
exports.default = getStoreOrders;
