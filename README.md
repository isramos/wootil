# wootil
Webapp running a few utilities for my Wordpress Woocommerce  store

## Feature 1: What's my tracking number
Customers can retrieve their USPS tracking number using their Order #, email (billing) and Postal code (billing).


## Roadmap
1. Implement request for product returns, where the return policy is enforced. e.g. User can return product within 30 days of receiving product. Use USPS delivery status as the start time counter.
2. Email the tracking number to the customer OR add to the order notes (require API with Write access).
## How to use this app

### Local development:
1. Enable the Woocommerce REST API [here](https://docs.woocommerce.com/document/woocommerce-rest-api/). [API docs](https://woocommerce.github.io/woocommerce-rest-api-docs)
2. Copy .env.sample to .env.dev and .env.prod, and add your info. Base url, and API key.
3. Build the app: $ `npm install`
   1. Install nodemon globally: `npm -g nodemon`
4. Run the app: $ `npm run dev`
### Production Release:
Similar to dev above, but
1. Run the app with $`npm run prod`
