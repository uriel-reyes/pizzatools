"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var OrderItem_1 = require("./OrderItem");
var OrdersList = function () {
    var _a = (0, react_1.useState)([]), orders = _a[0], setOrders = _a[1];
    (0, react_1.useEffect)(function () {
        fetch('http://localhost:3001/orders') // Adjust this URL to where your backend is hosted
            .then(function (response) { return response.json(); })
            .then(function (data) { return setOrders(data); })
            .catch(function (error) { return console.error('Error fetching orders:', error); });
    }, []);
    return (<div>
      {orders.map(function (order) { return (<OrderItem_1.default key={order.id} order={order}/>); })}
    </div>);
};
exports.default = OrdersList;
