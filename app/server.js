const fetch = require('node-fetch')
const fs = require('fs')
const dotenv = require('dotenv');

let DEBUG = false;
let CACHE_AGE = 5 * 60  // 5 min cache

const { WORDPRESS_API_BASE, CONSUMER_KEY, CONSUMER_SECRET, USPS_USERNAME, DEV_MODE, RETURN_WINDOW = 0, RETURN_LINK} = process.env;

if(WORDPRESS_API_BASE){
    console.log('Development mode. Loaded Env Var from  \'.env.dev\' file' )
} else {
    console.log('Production mode. Loading Env Var from  \'.env\' file' )
    dotenv.config(); // load .env file
}

if(WORDPRESS_API_BASE === undefined || CONSUMER_KEY === undefined || CONSUMER_SECRET  === undefined){
    console.log('Error: required environmental variables are not properly configured. Check \'.env\'.' )
    process.exit(1)
}

if(DEV_MODE==='true'){
    DEBUG = true;
    CACHE_AGE = 24 * 60 * 60  // 1 day  cache
}

const uspsTrackFieldUrl = (tracking) => 
`https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=<TrackFieldRequest USERID="${USPS_USERNAME}"><TrackID ID="${tracking}"/></TrackFieldRequest>`

const BasicAuth = 'Basic ' + Buffer.from(CONSUMER_KEY + ':' + CONSUMER_SECRET).toString('base64');

const express = require('express')
const app = express()
const port = 3000

// Serve static files
app.use(express.static('public'))
  
app.get('/api', (req, res) => {
  res.send('Wootils API is up and running!')
})

app.get('/api/order/:inputOrderNumber/:inputEmail/:inputPostalCode', async (req, res) => {
    const { inputOrderNumber, inputEmail, inputPostalCode} = req.params
    const getOrderResponse = await getOrder(inputEmail, inputOrderNumber, inputPostalCode)
    let orderResponse = {}
    if(!getOrderResponse.id){
        res.status(404).send( {params: req.params })
    } else {
        const { status, date_created, meta_data } = getOrderResponse
        orderResponse.status = status
        orderResponse.date_created = new Date(date_created).toDateString()

        if(DEBUG){
            orderResponse.debug = {...getOrderResponse}
        }

        const wc_connect_labels = meta_data && meta_data.find( e => e.key === 'wc_connect_labels')
        let labelsArray = []
        const labelCount = wc_connect_labels && wc_connect_labels.value.length
       
        for ( let i =0; i < labelCount; i++){
            const oneLabel = wc_connect_labels.value[i]
            const { carrier_id, tracking, service_name, created, refund } = oneLabel
            if(oneLabel.hasOwnProperty('refund')){
                // skip labels that are being refunded.
                continue;
            }
            const d = new Date(created).toDateString() 
            const uspsResponse = await fetch(uspsTrackFieldUrl(tracking))
            const uspsText = await uspsResponse.text();
            const uspsParsed = parseUspsTrackingResponse(uspsText)
            labelsArray.push({ carrier_id, tracking, service_name, created: d, uspsText, uspsParsed })
        }

        orderResponse.labels = labelsArray
    }
    res.status(200).json({...orderResponse, params:req.params })
})

app.listen(port, () => {
  console.log(`Wootils app listening at http://localhost:${port}`)
  console.log('WORDPRESS_API_BASE: ', WORDPRESS_API_BASE)
  console.log('\tProduct return window:', RETURN_WINDOW)
})

// Utilitiy functions
function parseUspsTrackingResponse(uspsTrackingResponseXml){
    const summary = uspsTrackingResponseXml.split('<TrackSummary>').pop().split('</TrackSummary>')[0];
    const eventDate = summary.split('<EventDate>').pop().split('</EventDate>')[0];
    const event = summary.split('<Event>').pop().split('</Event>')[0];
    const isDelivered = event && event.indexOf('Delivered') > -1

    let returnByDate = null
    let isReturnable = RETURN_WINDOW > 0
    let openRetunWindow = false
    let returnForm = null
    if(isReturnable){
        returnByDate = isDelivered && addDays(new Date(eventDate), parseInt(RETURN_WINDOW)).toDateString()
        openRetunWindow = isDelivered && new Date(returnByDate) - new Date() > 0
        if(openRetunWindow){
            returnForm = RETURN_LINK   
        }
    }

    return { event, eventDate, isDelivered, returnByDate, isReturnable, openRetunWindow, returnForm }
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

async function getOrder( inputEmail, inputOrderNumber, inputPostalCode){
    const cacheFileName = `_tmp_${inputOrderNumber}_${inputEmail}_${inputPostalCode}.json`
    let getOrderResponse = null
    try{
        try{
             //TODO: make fs operations async
            const json = JSON.parse( fs.readFileSync(`./${cacheFileName}`, 'utf-8') )
            getOrderResponse = json.data
            const timestamp = json.timestamp
            const cacheAge = (Date.now() - timestamp) /1000
            if(cacheAge > CACHE_AGE){
                console.log('Found in cache, but cache is stale:', cacheAge)
            }  else {
                console.log('File already in cache, age:', cacheAge)
                // TODO: add 5s of sleep time so user is not confused with fast query time compared to fresh query
                return getOrderResponse;
            }
            
        } catch(err){
            console.log('File NOT in cache')
        }

        const url = `https://${WORDPRESS_API_BASE}/wp-json/wc/v3/orders/${inputOrderNumber}`
        console.log('Starting to fetch data')
        const res = await fetch(url, { headers: { 'Authorization': BasicAuth}})
        console.log('Response: ', res.status)
        getOrderResponse = await res.json()
    
        const { email, postcode } = getOrderResponse.billing || {}
    
        if(email === inputEmail && inputPostalCode === postcode){
            //TODO: make fs operations async
            fs.writeFileSync(`./${cacheFileName}`, JSON.stringify({data:getOrderResponse, timestamp:Date.now()}, null,2), 'utf-8')
        } else {
            return { status: 404}
        }
    } catch(err){
        console.log(`Error processing request (file: ${cacheFileName}). Stack: `, err )
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