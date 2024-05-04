"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var PizzaItem = function (_a) {
    var pizza = _a.pizza;
    return (<div>
      <h3>{pizza.productName}</h3>
      <ul>
        {pizza.ingredients.map(function (ingredient, index) { return (<li key={index}>{ingredient}</li>); })}
      </ul>
    </div>);
};
exports.default = PizzaItem;
