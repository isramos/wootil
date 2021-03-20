const srv = require('../server')


// unpack test data
const {TEST_ORDER:testOrder, TEST_USER: testUser, TEST_ZIP:testPostalCode } = process.env;

;(async() => {

    srv.getOrder(testUser, testOrder, testPostalCode)

})()
