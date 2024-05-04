import apiRoot from "../src/BuildClient";

// const getStoreOrders = () => {
//     return apiRoot
//     .inStoreKeyWithStoreKeyValue({storeKey: "pizza-palace-1"})
//     .orders()
//     .get({
//       queryArgs:{
//         where: 'orderState = "Confirmed"'
//       }})
//     .execute()
//     .then(response => {
//         const orders = response.body.results;
//         orders.forEach(order => {
//             // Map each lineItem to extract only the product name and fields object, safely checking for undefined properties
//             const lineItemsSummary = order.lineItems.map(lineItem => ({
//                 productName: lineItem.name.en,
//                 ingredients: lineItem.custom && lineItem.custom.fields ? lineItem.custom.fields.Ingredients : []
//             }));
//             console.log(`Order ID: ${order.id}, Items: ${JSON.stringify(lineItemsSummary, null, 2)}`);
//         });
//     });
// }

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
      return response.body.results.map(order => ({
          id: order.id,
          lineItems: order.lineItems.map(lineItem => ({
              productName: lineItem.name.en,
              ingredients: lineItem.custom && lineItem.custom.fields ? lineItem.custom.fields.Ingredients : []
          }))
      }));
  });
}


export default getStoreOrders;

