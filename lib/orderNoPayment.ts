import apiRoot from "../src/BuildClient";

// Function responsible for creating a cart
const createCart = () => {
    return apiRoot.carts().post({
        body: {
            currency: "USD",
            store: {
                key: "pizza-palace-1",
                typeId: "store"
            },
            lineItems: [
                {
                    sku: "pizza",
                    quantity: 6,
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

// Function responsible for creating an order from a cart
const createOrder = (cartId, version) => {
    return apiRoot.orders().post({
        body: {
            version,
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

// Function that orchestrates the creation of a cart and then creates an order from that cart
const orderNoPayment = () => {
    return createCart()
        .then(cartResponse => {
            const { id: cartId, version: cartVersion } = cartResponse.body;
            return createOrder(cartId, cartVersion);
        });
};

// Exporting the orchestration function
export { orderNoPayment };
