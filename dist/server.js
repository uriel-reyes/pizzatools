"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors = require("cors");
const getStoreOrders_1 = __importDefault(require("./lib/getStoreOrders"));
const app = express();
const port = process.env.PORT || 3001; // Ensure this port does not conflict with your frontend
app.use(cors()); // Enables CORS to allow your frontend to communicate with this backend
// Endpoint to get orders
app.get('/orders', (req, res) => {
    (0, getStoreOrders_1.default)().then(orders => {
        res.json(orders);
    }).catch(error => {
        console.error('Failed to retrieve orders:', error);
        res.status(500).send('Failed to retrieve orders');
    });
});
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
