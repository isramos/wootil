const fetch = require('node-fetch')
const fs = require('fs')

if(process.env.WORDPRESS_API_BASE === undefined){
    console.log('Error: Could not log dotenv config file')
    process.exit(1)
}
console.log('Hello world! WORDPRESS_API_BASE: ', process.env.WORDPRESS_API_BASE)

const { WORDPRESS_API_BASE, CONSUMER_KEY, CONSUMER_SECRET } = process.env;
var BasicAuth = 'Basic ' + Buffer.from(CONSUMER_KEY + ':' + CONSUMER_SECRET).toString('base64');

async function getOrder( inputEmail, inputOrderNumber, inputPostalCode){
    const cacheFileName = `_tmp_${inputOrderNumber}_${inputEmail}_${inputPostalCode}.json`

    try{
        try{
            const f = fs.readFileSync(`./${cacheFileName}.json`, 'utf-8')
            console.log('File already in cache')
            return;
        } catch(err){
            console.log('File NOT in cache')
        }

        const url = `https://${WORDPRESS_API_BASE}/wp-json/wc/v3/orders/${inputOrderNumber}`
        console.log('Starting to fetch data')
        const res = await fetch(url, { headers: { 'Authorization': BasicAuth}})
        console.log('Response: ', res.status)
        const json = await res.json()
    
        const { first_name, last_name, email, postcode } = json.billing || {}
    
        if(email === inputEmail && inputPostalCode === postcode){
            console.log('Success, order FOUND. Saved to file.')
            // console.log(JSON.stringify(json, null,2))
            fs.writeFileSync(`./${cacheFileName}.json`, JSON.stringify(json, null,2), 'utf-8')
        } else {
            console.log('Error, order NOT found')
        }
    } catch(err){
        console.log('oops, error processing your request. This is a bug.', err )
    }


}

exports.getOrder = getOrder