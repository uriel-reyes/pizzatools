<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a>
</p>

# Pizza Starter

This tool is meant to be a starting point for customers utilizing commercetools to power pizza operations and screens. A pizza screen can have multiple uses such as:

- Used by a pizza making team to read incoming orders and build pizzas.
- Used to keep a customer informed about the status of their order.
- Used by a dispatcher to know which orders are ready to go out for delivery.

## Configuration

Will need a custom type similar to what's modeled below:

{
  "key" : "lineitemtype",
  "name" : {
    "en" : "Pizza Information"
  },
  "description" : {
    "en" : "Used to store temperature, ingredients and other information related to a pizza."
  },
  "resourceTypeIds" : [ "line-item" ],
  "fieldDefinitions": [
    {
        "type": {
            "name": "Set",
            "elementType":{
                "name": "Enum",
                "values":[{
                    "key": "cheese",
                    "label": "Cheese"
                },
                {
                    "key":"pepperoni",
                    "label":"pepperoni"
                },
                {
                    "key": "ham",
                    "label": "Ham"
                },
                {
                     "key": "bacon",
                     "label": "Bacon"
                },
                {
                     "key": "mushroom",
                     "label": "Mushroom"
                },
                {
                    "key": "pineapple",
                    "label": "Pineapple"
                },
                {
                    "key": "jalapeno",
                    "label": "Jalapeño"
                },
                {
                     "key": "onion",
                     "label": "Onion"
                }
                ]
            }
        },
        "name": "Ingredients",
        "label": {
            "en":"Ingredients"
        },
        "required": false
    }
  ]
} 

## Dependencies

- [Node.js](https://nodejs.org/): Required to run JavaScript on the server.
- [npm](https://www.npmjs.com/): Node package manager, used to install:
  - `dotenv`: Loads environment variables from a `.env` file into `process.env`.
  - `typescript`: Adds types to JavaScript, making the code more robust and understandable.
  - `@types/node`: Type definitions for Node.js, required for TypeScript to understand Node.js types.

## Usage

Update `client.ts` with your function and logic.

To compile TypeScript to JavaScript, use the following command:
`tsc`

To run the application:
`npm start`

## License

[MIT License](LICENSE)
