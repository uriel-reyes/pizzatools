import { Money } from "@commercetools/platform-sdk";
import apiRoot from "../src/BuildClient";

// Sample data for Pflugerville, TX (78660)
const firstNames = [
  "Michael", "Jennifer", "David", "Jessica", "Christopher", 
  "Ashley", "Matthew", "Amanda", "Joshua", "Sarah",
  "Robert", "Emma", "James", "Olivia", "John",
  "Sophia", "William", "Isabella", "Daniel", "Emily",
  "Thomas", "Madison", "Joseph", "Ava", "Charles",
  "Mia", "Andrew", "Abigail", "Kevin", "Charlotte"
];

const lastNames = [
  "Johnson", "Smith", "Williams", "Brown", "Jones",
  "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris",
  "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
];

const streetNames = [
  "1234 Pecan St", "2345 Windermere Dr", "3456 Hidden Lake Dr", 
  "4567 Dessau Rd", "5678 Grand Avenue Pkwy", "6789 Heatherwilde Blvd",
  "7890 Kelly Ln", "8901 Rowe Ln", "9012 Weiss Ln", "1023 Pflugerville Pkwy",
  "1122 Picadilly Dr", "2233 Meadow View Ln", "3344 Falcon Dr",
  "4455 Spring Hill Ln", "5566 Black Locust Dr", "6677 Settlers Valley Dr",
  "7788 Tumbleweed Dr", "8899 Scofield Ridge Pkwy", "9900 Swenson Farms Blvd",
  "1010 Yellow Sage Dr", "2020 Whispering Valley Dr", "3030 Glenhill Ln"
];

// Generate a random customer
const generateRandomCustomer = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const street = streetNames[Math.floor(Math.random() * streetNames.length)];
  
  // Generate a random apartment number for some addresses
  const hasApartment = Math.random() > 0.7;
  const apartmentNumber = hasApartment ? `, Apt ${Math.floor(Math.random() * 999) + 100}` : '';
  const fullStreet = street + apartmentNumber;
  
  // Generate a random phone number with Austin area code
  const phoneDigits = Math.floor(Math.random() * 10000000) + 1000000;
  const phone = `512-${Math.floor(phoneDigits / 10000)}-${phoneDigits % 10000}`;
  
  return {
    firstName,
    lastName,
    street: fullStreet,
    city: "Pflugerville",
    state: "Texas",
    zipCode: "78660",
    phone
  };
};

// Available ingredients from the provided type definition
const availableIngredients = [
  "cheese", "pepperoni", "ham", "bacon", 
  "mushroom", "pineapple", "jalapeno", "onion"
];

// Common pizza combinations
const commonPizzas = [
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
const getRandomItems = <T>(items: T[], count: number): T[] => {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Generate a random 6-digit order number
const generateOrderNumber = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to generate random pizza order
const generateRandomPizzaOrder = (): { quantity: number, ingredients: string[] }[] => {
  // Random number of pizzas (1-6)
  const pizzaCount = Math.floor(Math.random() * 6) + 1;
  
  // Generate order
  const order = [];
  
  // Track ingredients combinations to avoid duplicates
  const existingCombinations = new Set<string>();
  
  for (let i = 0; i < pizzaCount; i++) {
    // Either pick a common pizza or create a custom one
    const useCommonPizza = Math.random() > 0.3;
    
    let ingredients: string[] = [];
    let ingredientsKey: string = "";
    let isUnique = false;
    
    // Keep trying until we get a unique pizza combination
    while (!isUnique) {
      if (useCommonPizza) {
        const pizza = commonPizzas[Math.floor(Math.random() * commonPizzas.length)];
        ingredients = [...pizza.ingredients]; // Create a copy
      } else {
        // Generate a custom pizza with 2-4 random ingredients (always include cheese)
        const toppingCount = Math.floor(Math.random() * 3) + 1; // 1-3 additional toppings
        const toppings = getRandomItems(
          availableIngredients.filter(i => i !== "cheese"), 
          toppingCount
        );
        
        // Always add cheese
        ingredients = ["cheese", ...toppings];
      }
      
      // Sort ingredients to create a consistent key regardless of order
      ingredientsKey = [...ingredients].sort().join(',');
      
      // Check if this combination already exists
      if (!existingCombinations.has(ingredientsKey)) {
        isUnique = true;
        existingCombinations.add(ingredientsKey);
      }
    }
    
    // Always set quantity to 1 instead of random
    const quantity = 1;
    
    order.push({ quantity, ingredients });
  }
  
  // If we ended up with no pizzas (rare edge case), add a default one
  if (order.length === 0) {
    order.push({ quantity: 1, ingredients: ["cheese", "pepperoni"] });
  }
  
  return order;
};

// Function responsible for creating a cart with custom pizzas and customer info
const createCartWithCustomerData = (
  customer: ReturnType<typeof generateRandomCustomer>, 
  pizzas: { quantity: number, ingredients: string[] }[]
) => {
  return apiRoot.carts().post({
    body: {
      currency: "USD",
      store: {
        key: "pizza-palace-1",
        typeId: "store"
      },
      lineItems: pizzas.map(pizza => ({
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
      })),
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
      customerEmail: `${customer.firstName.toLowerCase()}.${customer.lastName.toLowerCase()}@example.com`
    }
  }).execute();
};

const createPayment = (cartAmount: Money) => {
  return apiRoot
    .payments()
    .post({
      body: {
        amountPlanned: cartAmount,
        paymentMethodInfo: {
          method: "Cash on Delivery"
        }
      }
    })
    .execute()
};

const addPaymentToCart = (cartId: string, paymentId: string, version: number) => {
  return apiRoot
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
const createOrder = (cartId: string, version: number, cartAmount: Money) => {
  const orderNumber = generateOrderNumber();
  
  return apiRoot.orders().post({
    body: {
      version,
      cart: {
        typeId: "cart",
        id: cartId
      },
      orderNumber,
      state: {
        typeId: "state",
        id: "1c25473a-05e1-46f4-82a7-acc66d0a5154"
      },
      orderState: "Open"
    }
  }).execute();
};

// Create an order for a random customer
const createRandomCustomerOrder = () => {
  // Generate a random customer
  const customer = generateRandomCustomer();
  
  // Generate random pizza order for this customer
  const pizzaOrder = generateRandomPizzaOrder();
  
  return createCartWithCustomerData(customer, pizzaOrder)
    .then(cartResponse => {
      const { id: cartId, version: cartVersion, totalPrice: cartAmount } = cartResponse.body;
      return createPayment(cartAmount)
        .then(paymentResponse => {
          const paymentId = paymentResponse.body.id;
          return addPaymentToCart(cartId, paymentId, cartVersion)
            .then(paymentAddedResponse => {
              const updatedVersion = paymentAddedResponse.body.version;
              return createOrder(cartId, updatedVersion, cartAmount).then(orderResponse => {
                console.log(`Created order ${orderResponse.body.orderNumber} for ${customer.firstName} ${customer.lastName}`);
                return orderResponse;
              });
            });
        });
    });
};

// Function to create orders for random Pflugerville customers
const properOrder = async () => {
  try {
    // Process orders sequentially to avoid overwhelming the API
    const results = [];
    
    // Number of orders to create
    const orderCount = 10;
    
    // Create random orders
    for (let i = 0; i < orderCount; i++) {
      console.log(`Creating order ${i+1} of ${orderCount}...`);
      
      const result = await createRandomCustomerOrder();
      results.push(result);
      
      // Add a small delay between orders
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Successfully created ${results.length} orders for random customers`);
    return results;
  } catch (error) {
    console.error("Error creating orders:", error);
    throw error;
  }
};

// Exporting the orchestration function
export { properOrder };