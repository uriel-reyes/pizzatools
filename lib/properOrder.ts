import { Money } from "@commercetools/platform-sdk";
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
                    quantity: 2,
                    distributionChannel: {
                        key: "pizza-palace-1",
                        typeId: "channel"
                    },
                    supplyChannel: {
                        key: "pizza-palace-1",
                        typeId: "channel"
                    },
                    inventoryMode: "ReserveOnOrder",
                    custom:{
                        type:{
                            typeId:"type",
                            key:"lineitemtype",
                        },
                        fields:{
                            "Ingredients":[
                                "cheese",
                                "jalapeno",
                                "pepperoni"
                            ]
                        }
                    }
                },
                {
                    sku: "pizza",
                    quantity: 1,
                    distributionChannel: {
                        key: "pizza-palace-1",
                        typeId: "channel"
                    },
                    supplyChannel: {
                        key: "pizza-palace-1",
                        typeId: "channel"
                    },
                    inventoryMode: "ReserveOnOrder",
                    custom:{
                        type:{
                            typeId:"type",
                            key:"lineitemtype",
                        },
                        fields:{
                            "Ingredients":[
                                "cheese","mushroom","pepperoni"
                            ]
                        }
                    } 
                }
            ],
            shippingAddress: {
                country: "US",
                state: "Texas"
            },
            billingAddress:{
                firstName: "Loyal",
                lastName: "Customer",
                country: "US"
            }
        }
    }).execute();
};

const createPayment = (cartAmount:Money) =>{
    return apiRoot
    .payments()
    .post({body:{
        amountPlanned: cartAmount,
        paymentMethodInfo:{
            method: "Cash on Delivery"
        }
    }
    })
    .execute()
}

const addPaymentToCart = (cartId:string, paymentId:string, version:number) => {
    return apiRoot
    .carts()
    .withId({ID:cartId})
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
const createOrder = (cartId:string, version:number, cartAmount:Money) => {
    return apiRoot.orders().post({
        body: {
            version,
            cart: {
                typeId: "cart",
                id: cartId
            },
            state:{
                typeId: "state",
                key:"prepping"
            }
        }
    }).execute();
};

const properOrder = () => {
    return createCart()
        .then(cartResponse => {
            const { id: cartId, version: cartVersion, totalPrice: cartAmount } = cartResponse.body;
            return createPayment(cartAmount)  // Assuming cartAmount is an object with centAmount
                .then(paymentResponse => {
                    const paymentId = paymentResponse.body.id;
                    return addPaymentToCart(cartId, paymentId, cartVersion)
                        .then(paymentAddedResponse => {
                            // After adding payment, you often need to update the version as the cart has changed
                            const updatedVersion = paymentAddedResponse.body.version;
                            return createOrder(cartId, updatedVersion, cartAmount);
                        });
                });
        });
};

// Exporting the orchestration function
export { properOrder };