# wootil
Webapp running a few utilities for my Wordpress Woocommerce  store

## Demo screenshot
![image](https://user-images.githubusercontent.com/112402/113491014-57425380-9493-11eb-9564-f291b97f1e33.png)

## Feature 1: What's my tracking number
Customers can retrieve their USPS tracking number using their Order #, email (billing) and Postal code (billing).

## Feature 2: Can I return the item?
DONE: Implement request for product returns, where the return policy is enforced. e.g. User can return product within 30 days of receiving product. Use USPS delivery status as the start time counter.


## Roadmap
1. Guide customer through product return. Allow them to enter the tracking number for the returned product.
2. Email the tracking number to the customer OR add to the order notes (require API with Write access).

## How to use this app

``` TODO```

### Local development:
1. Enable the Woocommerce REST API [here](https://docs.woocommerce.com/document/woocommerce-rest-api/). [API docs](https://woocommerce.github.io/woocommerce-rest-api-docs)
2. Copy `.env.sample` to `.env` and `.env.dev`, and add your own info, such as base url for your Wordpress and Woocommerce API key.
3. Build the app: $ `npm install`
   1. Install nodemon globally: `npm -g nodemon`
4. Run the app: $ `npm run dev`
5. Point your browser to http://localhost:3000/
### Production Release:
Similar to dev above, but
1. Run the app with $`npm run start`
2. 
