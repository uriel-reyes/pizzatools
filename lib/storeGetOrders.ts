// import apiRoot from "../src/BuildClient";

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

import apiRoot from "../src/BuildClient";

const getStoreOrders = () => {
    return apiRoot
    .inStoreKeyWithStoreKeyValue({storeKey: "pizza-palace-1"})
    .orders()
    .get({
      queryArgs:{
        where: 'orderState = "Confirmed"'
      }})
    .execute()
    .then(response => {
        const orders = response.body.results;
        orders.forEach(order => {
            // Map each lineItem to extract only the product name and fields object, safely checking for undefined properties
            const lineItemsSummary = order.lineItems.map(lineItem => ({
                productName: lineItem.name.en,
                ingredients: lineItem.custom && lineItem.custom.fields ? lineItem.custom.fields.Ingredients : []
            }));
            console.log(`Order ID: ${order.id}, Items: ${JSON.stringify(lineItemsSummary, null, 2)}`);
        });
    });
}

export default getStoreOrders;

