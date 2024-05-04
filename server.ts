import express = require('express');
import cors = require('cors');
import getStoreOrders from './lib/storeGetOrders';

const app = express();
const port = process.env.PORT || 3001;  // Ensure this port does not conflict with your frontend

app.use(cors()); // Enables CORS to allow your frontend to communicate with this backend

// Endpoint to get orders
app.get('/orders', (req, res) => {
    getStoreOrders().then(orders => {
        res.json(orders);
    }).catch(error => {
        console.error('Failed to retrieve orders:', error);
        res.status(500).send('Failed to retrieve orders');
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
