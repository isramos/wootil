const fetch = require('node-fetch')
const fs = require('fs')

const DEBUG = false;

if(process.env.WORDPRESS_API_BASE === undefined){
    console.log('Error: Could not log dotenv config file')
    process.exit(1)
}
console.log('Hello world! WORDPRESS_API_BASE: ', process.env.WORDPRESS_API_BASE)

const { WORDPRESS_API_BASE, CONSUMER_KEY, CONSUMER_SECRET } = process.env;
var BasicAuth = 'Basic ' + Buffer.from(CONSUMER_KEY + ':' + CONSUMER_SECRET).toString('base64');

const express = require('express')
const app = express()
const port = 3000


app.use(express.static('public'))
  
app.get('/api', (req, res) => {
  res.send('Wootils API is up and running!')
})

app.get('/api/order/:inputOrderNumber/:inputEmail/:inputPostalCode', async (req, res) => {
    const { inputOrderNumber, inputEmail, inputPostalCode} = req.params
    const getOrderResponse = await getOrder(inputEmail, inputOrderNumber, inputPostalCode)
    let responseString = null
    if(!getOrderResponse.id){
        responseString = `<br> <strong>Order not found.</strong><br>Order #: "${inputOrderNumber}", email: "${inputEmail}", Postal Code: "${inputPostalCode}" <br>${new Date()} `
    } else {
        const { status, meta_data } = getOrderResponse

        const labels = meta_data && meta_data.filter( e => e.key === 'wc_connect_labels')
        let trackingInfoStr = ''
        labels.forEach( el => {
            const {value = [] }= el
                value.forEach( oneValue => {
                    const { carrier_id, tracking, service_name, created } = oneValue
                    const trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${tracking}`
                    const trackingLink = `<a href="${trackingUrl}" target="_blank" rel="noopener noreferrer">${tracking}</a>`
                    const createdDateString = new Date(created).toDateString()
                    trackingInfoStr += `Carrier:${carrier_id}, Tracking ${trackingLink}, Service: ${service_name}, created: ${createdDateString}`
                })
        })
        responseString = `    
        Order status: <strong>${status}</strong><br>
        Results for email: "${inputEmail}" <br>
        Order #: "${inputOrderNumber}",
        Postal Code: "${inputPostalCode}". 
        <br><br>
          Number of shipping labels found: ${labels.length}<br>
         ${trackingInfoStr}
        `
        if(DEBUG){
            responseString += `
            <br>-------- DEBUG------ <br> 
            <pre>${JSON.stringify(getOrderResponse, null, 2)}</pre>
         `
        }
    }

    res.status(200).send(responseString)
})

app.listen(port, () => {
  console.log(`Wootils app listening at http://localhost:${port}`)
})

async function getOrder( inputEmail, inputOrderNumber, inputPostalCode){
    const cacheFileName = `_tmp_${inputOrderNumber}_${inputEmail}_${inputPostalCode}.json`
    let getOrderResponse = null
    try{
        try{
            getOrderResponse = JSON.parse( fs.readFileSync(`./${cacheFileName}`, 'utf-8') )
            console.log('File already in cache')
            return getOrderResponse;
        } catch(err){
            console.log('File NOT in cache')
        }

        const url = `https://${WORDPRESS_API_BASE}/wp-json/wc/v3/orders/${inputOrderNumber}`
        console.log('Starting to fetch data')
        const res = await fetch(url, { headers: { 'Authorization': BasicAuth}})
        console.log('Response: ', res.status)
        getOrderResponse = await res.json()
    
        const { first_name, last_name, email, postcode } = getOrderResponse.billing || {}
    
        if(email === inputEmail && inputPostalCode === postcode){
            console.log('Success, order FOUND. Saved to file.')
            fs.writeFileSync(`./${cacheFileName}`, JSON.stringify(getOrderResponse, null,2), 'utf-8')
        } else {
            console.log('Error, order NOT found')
            return { status: 404}
        }
    } catch(err){
        console.log('oops, error processing your request. This is a bug.', err )
        return getOrderResponse
    }
    return getOrderResponse

}

async function addNote( inputOrderNumber, noteText){

    const url = `https://${WORDPRESS_API_BASE}/wp-json/wc/v3/orders/${inputOrderNumber}/notes`
    console.log('Starting to fetch data')
    const res = await fetch(url, { 
        method: 'POST', 
        headers: { 'Authorization': BasicAuth},
        body: JSON.stringify({note: `[WOOTIL] ${noteText}`})
    })
    console.log('Response: ', res.status)
    const json = await res.json()
    console.log('Add note Result:', json)

    const cacheFileName = `_tmp_notes-${inputOrderNumber}.json`
    fs.writeFileSync(`./${cacheFileName}.json`, JSON.stringify(json, null,2), 'utf-8')

}

async function getNote( inputOrderNumber, noteText){

    const url = `https://${WORDPRESS_API_BASE}/wp-json/wc/v3/orders/${inputOrderNumber}/notes`
    console.log('Starting to fetch data')
    const res = await fetch(url, { headers: { 'Authorization': BasicAuth}})
    console.log('Response: ', res.status)
    const json = await res.json()
    console.log('Order Notes:', json)

    const cacheFileName = `_tmp_notes-${inputOrderNumber}.json`
    fs.writeFileSync(`./${cacheFileName}.json`, JSON.stringify(json, null,2), 'utf-8')

}

exports.getOrder = getOrder
exports.addNote = addNote