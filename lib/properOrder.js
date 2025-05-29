"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.properOrder = void 0;
var BuildClient_1 = require("../src/BuildClient");
// Pflugerville neighborhoods and areas
var neighborhoods = [
    "Avalon", "Blackhawk", "Bohls Place", "Cambridge Estates",
    "Cantarra", "Commons at Rowe Lane", "Estates at Lake Creek",
    "Falcon Pointe", "Fairways at Blackhawk", "Gatlinburg",
    "Heatherwilde", "Highland Park", "Meadows at Blackhawk",
    "Mountain Creek", "Pflugerville Heights", "Reserve at Westcreek",
    "Royal Pointe", "Settlers Ridge", "Sorento", "Villages of Hidden Lake"
];
// Updated with actual street names in Pflugerville for better geocoding
var streetNames = [
    "Limestone Commercial Dr", "Pflugerville Pkwy", "Pecan St",
    "Dessau Rd", "Grand Avenue Pkwy", "Heatherwilde Blvd",
    "Kelly Ln", "Rowe Ln", "Weiss Ln", "Wells Branch Pkwy",
    "Immanuel Rd", "Hidden Lake Dr", "Windermere Dr", "Picadilly Dr",
    "Copperfield Dr", "Black Locust Dr", "Settlers Valley Dr",
    "Wilke Ridge Ln", "Ridge Line Dr", "Collingwood Dr",
    "Olympic Dr", "Yellow Sage Dr", "Tumbleweed Dr", "Kickapoo Cavern Dr"
];
// Sample data for Pflugerville, TX (78660, 78664, 78691)
var firstNames = [
    "Michael", "Jennifer", "David", "Jessica", "Christopher",
    "Ashley", "Matthew", "Amanda", "Joshua", "Sarah",
    "Robert", "Emma", "James", "Olivia", "John",
    "Sophia", "William", "Isabella", "Daniel", "Emily",
    "Thomas", "Madison", "Joseph", "Ava", "Charles",
    "Mia", "Andrew", "Abigail", "Kevin", "Charlotte"
];
var lastNames = [
    "Johnson", "Smith", "Williams", "Brown", "Jones",
    "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris",
    "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
];
// Generate Pflugerville area street numbers
var streetNumbers = ["123", "456", "789", "1024", "555", "842", "2020", "1550",
    "3651", "4872", "18701", "10001", "12345", "2468", "3579"];
// Pflugerville zip codes
var zipCodes = ["78660", "78664", "78691"];
// Generate a random customer
var generateRandomCustomer = function () {
    var firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    var lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    var streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    var streetNumber = streetNumbers[Math.floor(Math.random() * streetNumbers.length)];
    var zipCode = zipCodes[Math.floor(Math.random() * zipCodes.length)];
    var neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
    // Generate a random apartment number for some addresses
    var hasApartment = Math.random() > 0.7;
    var apartmentNumber = hasApartment ? ", Apt ".concat(Math.floor(Math.random() * 999) + 100) : '';
    var fullStreet = "".concat(streetNumber, " ").concat(streetName).concat(apartmentNumber);
    // Generate a random phone number with Austin area code
    var phoneDigits = Math.floor(Math.random() * 10000000) + 1000000;
    var phone = "512-".concat(Math.floor(phoneDigits / 10000), "-").concat(phoneDigits % 10000);
    return {
        firstName: firstName,
        lastName: lastName,
        street: fullStreet,
        city: "Pflugerville - ".concat(neighborhood),
        state: "Texas",
        zipCode: zipCode,
        phone: phone
    };
};
// Available ingredients from the provided type definition
var availableIngredients = [
    "cheese", "pepperoni", "ham", "bacon",
    "mushroom", "pineapple", "jalapeno", "onion"
];
// Common pizza combinations
var commonPizzas = [
    { name: "Cheese", ingredients: ["cheese"] },
    { name: "Pepperoni", ingredients: ["cheese", "pepperoni"] },
    { name: "Supreme", ingredients: ["cheese", "pepperoni", "mushroom", "onion"] },
    { name: "Meat Lovers", ingredients: ["cheese", "pepperoni", "ham", "bacon"] },
    { name: "Hawaiian", ingredients: ["cheese", "ham", "pineapple"] },
    { name: "Veggie", ingredients: ["cheese", "mushroom", "onion"] },
    { name: "Spicy", ingredients: ["cheese", "pepperoni", "jalapeno"] },
    { name: "BBQ Chicken", ingredients: ["cheese", "bacon", "onion"] }
];
// Function to randomly select items from an array
var getRandomItems = function (items, count) {
    var shuffled = __spreadArray([], items, true).sort(function () { return 0.5 - Math.random(); });
    return shuffled.slice(0, count);
};
// Generate a random 6-digit order number
var generateOrderNumber = function () {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
// Function to generate random pizza order
var generateRandomPizzaOrder = function () {
    // Random number of pizzas (1-6)
    var pizzaCount = Math.floor(Math.random() * 6) + 1;
    // Generate order
    var order = [];
    // Track ingredients combinations to avoid duplicates
    var existingCombinations = new Set();
    for (var i = 0; i < pizzaCount; i++) {
        // Either pick a common pizza or create a custom one
        var useCommonPizza = Math.random() > 0.3;
        var ingredients = [];
        var ingredientsKey = "";
        var isUnique = false;
        // Keep trying until we get a unique pizza combination
        while (!isUnique) {
            if (useCommonPizza) {
                var pizza = commonPizzas[Math.floor(Math.random() * commonPizzas.length)];
                ingredients = __spreadArray([], pizza.ingredients, true); // Create a copy
            }
            else {
                // Generate a custom pizza with 2-4 random ingredients (always include cheese)
                var toppingCount = Math.floor(Math.random() * 3) + 1; // 1-3 additional toppings
                var toppings = getRandomItems(availableIngredients.filter(function (i) { return i !== "cheese"; }), toppingCount);
                // Always add cheese
                ingredients = __spreadArray(["cheese"], toppings, true);
            }
            // Sort ingredients to create a consistent key regardless of order
            ingredientsKey = __spreadArray([], ingredients, true).sort().join(',');
            // Check if this combination already exists
            if (!existingCombinations.has(ingredientsKey)) {
                isUnique = true;
                existingCombinations.add(ingredientsKey);
            }
        }
        // Always set quantity to 1 instead of random
        var quantity = 1;
        order.push({ quantity: quantity, ingredients: ingredients });
    }
    // If we ended up with no pizzas (rare edge case), add a default one
    if (order.length === 0) {
        order.push({ quantity: 1, ingredients: ["cheese", "pepperoni"] });
    }
    return order;
};
// Function responsible for creating a cart with custom pizzas and customer info
var createCartWithCustomerData = function (customer, pizzas) {
    return BuildClient_1.default.carts().post({
        body: {
            currency: "USD",
            store: {
                key: "pizza-palace-1",
                typeId: "store"
            },
            lineItems: pizzas.map(function (pizza) { return ({
                sku: "pizza",
                quantity: pizza.quantity,
                distributionChannel: {
                    key: "pizza-palace-1",
                    typeId: "channel"
                },
                supplyChannel: {
                    key: "pizza-palace-1",
                    typeId: "channel"
                },
                inventoryMode: "ReserveOnOrder",
                taxCategory: {
                    typeId: "tax-category",
                    id: "0e8fb68d-1b81-4d0c-922d-41a081fd6ebd"
                },
                custom: {
                    type: {
                        typeId: "type",
                        key: "lineitemtype",
                    },
                    fields: {
                        "Ingredients": pizza.ingredients
                    }
                }
            }); }),
            taxMode: "Platform",
            taxRoundingMode: "HalfEven",
            taxCalculationMode: "LineItemLevel",
            shippingAddress: {
                firstName: customer.firstName,
                lastName: customer.lastName,
                streetName: customer.street,
                city: customer.city,
                state: customer.state,
                postalCode: customer.zipCode,
                country: "US",
                phone: customer.phone
            },
            billingAddress: {
                firstName: customer.firstName,
                lastName: customer.lastName,
                streetName: customer.street,
                city: customer.city,
                state: customer.state,
                postalCode: customer.zipCode,
                country: "US",
                phone: customer.phone
            },
            customerEmail: "".concat(customer.firstName.toLowerCase(), ".").concat(customer.lastName.toLowerCase(), "@example.com")
        }
    }).execute();
};
var createPayment = function (cartAmount) {
    return BuildClient_1.default
        .payments()
        .post({
        body: {
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
    var orderNumber = generateOrderNumber();
    return BuildClient_1.default.orders().post({
        body: {
            version: version,
            cart: {
                typeId: "cart",
                id: cartId
            },
            orderNumber: orderNumber,
            state: {
                typeId: "state",
                id: "1c25473a-05e1-46f4-82a7-acc66d0a5154"
            },
            orderState: "Open"
        }
    }).execute();
};
// Create an order for a random customer
var createRandomCustomerOrder = function () {
    // Generate a random customer
    var customer = generateRandomCustomer();
    // Generate random pizza order for this customer
    var pizzaOrder = generateRandomPizzaOrder();
    return createCartWithCustomerData(customer, pizzaOrder)
        .then(function (cartResponse) {
        var _a = cartResponse.body, cartId = _a.id, cartVersion = _a.version, cartAmount = _a.totalPrice;
        return createPayment(cartAmount)
            .then(function (paymentResponse) {
            var paymentId = paymentResponse.body.id;
            return addPaymentToCart(cartId, paymentId, cartVersion)
                .then(function (paymentAddedResponse) {
                var updatedVersion = paymentAddedResponse.body.version;
                return createOrder(cartId, updatedVersion, cartAmount).then(function (orderResponse) {
                    console.log("Created order ".concat(orderResponse.body.orderNumber, " for ").concat(customer.firstName, " ").concat(customer.lastName));
                    return orderResponse;
                });
            });
        });
    });
};
// Function to create orders for random Pflugerville customers
var properOrder = function () { return __awaiter(void 0, void 0, void 0, function () {
    var results, orderCount, i, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                results = [];
                orderCount = 10;
                i = 0;
                _a.label = 1;
            case 1:
                if (!(i < orderCount)) return [3 /*break*/, 5];
                console.log("Creating order ".concat(i + 1, " of ").concat(orderCount, "..."));
                return [4 /*yield*/, createRandomCustomerOrder()];
            case 2:
                result = _a.sent();
                results.push(result);
                // Add a small delay between orders
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
            case 3:
                // Add a small delay between orders
                _a.sent();
                _a.label = 4;
            case 4:
                i++;
                return [3 /*break*/, 1];
            case 5:
                console.log("Successfully created ".concat(results.length, " orders for random customers"));
                return [2 /*return*/, results];
            case 6:
                error_1 = _a.sent();
                console.error("Error creating orders:", error_1);
                throw error_1;
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.properOrder = properOrder;
