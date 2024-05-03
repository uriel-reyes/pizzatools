import apiRoot from "../src/BuildClient";

const getStoreOrders = () =>{
    return apiRoot
    .inStoreKeyWithStoreKeyValue({storeKey:"pizza-palace-1"})
    .orders()
    .get()
    .execute()
    .then(response => {
              const orders = response.body.results;
              orders.forEach(order => {
                // This will convert lineItems array into a readable JSON string.
                const makeLine = JSON.stringify(order.lineItems, null, 2);
                console.log(`Order ID: ${order.id}, Items: ${makeLine}`);
              });
            }
        )}

export default getStoreOrders;
