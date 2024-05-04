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
      return response.body.results.map(order => ({
          id: order.id,
          createdAt: order.createdAt,
          lineItems: order.lineItems.map(lineItem => ({
              productName: lineItem.name.en,
              ingredients: lineItem.custom && lineItem.custom.fields ? lineItem.custom.fields.Ingredients : []
          }))
      }));
  });
}


export default getStoreOrders;

