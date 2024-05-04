"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var PizzaItem_1 = require("./PizzaItem");
var OrderItem = function (_a) {
    var order = _a.order;
    var _b = (0, react_1.useState)(0), activePizzaIndex = _b[0], setActivePizzaIndex = _b[1];
    var handleNextPizza = function () {
        if (activePizzaIndex < order.lineItems.length - 1) {
            setActivePizzaIndex(activePizzaIndex + 1);
        }
    };
    var handlePrevPizza = function () {
        if (activePizzaIndex > 0) {
            setActivePizzaIndex(activePizzaIndex - 1);
        }
    };
    return (<div>
      <h2>Order ID: {order.id}</h2>
      <button onClick={handlePrevPizza}>&lt;</button>
      <PizzaItem_1.default pizza={order.lineItems[activePizzaIndex]}/>
      <button onClick={handleNextPizza}>&gt;</button>
    </div>);
};
exports.default = OrderItem;
