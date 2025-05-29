"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var properOrder_1 = require("./lib/properOrder");
// Generate test orders
console.log('Generating test orders...');
(0, properOrder_1.properOrder)()
    .then(function (results) {
    console.log("Successfully generated ".concat(results.length, " test orders."));
})
    .catch(function (error) {
    console.error('Error generating test orders:', error);
});
