const srv = require('../server')

/*
    This file is to help testing some functions

*/
// unpack test data
const {TEST_ORDER:testOrder, TEST_USER: testUser, TEST_ZIP:testPostalCode } = process.env;

;(async() => {
    srv.getOrder(testUser, testOrder, testPostalCode)
    srv.addNote(testOrder, "This is a test Note")
})()
