
if(process.env.WORDPRESS_API_BASE === undefined){
    console.log('Error: Could not log dotenv config file')
    process.exit(1)
}
console.log('Hello world! WORDPRESS_API_BASE: ', process.env.WORDPRESS_API_BASE)

