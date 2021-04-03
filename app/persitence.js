const mysql = require("mysql2/promise");

const { DB_HOST, DB_USR, DB_PWD, DB_NAME } = process.env;

const DB_TABLE = "mytable";

let connection = null;
const DB_OPTS = {
  host: DB_HOST,
  user: DB_USR,
  password: DB_PWD,
  database: DB_NAME,
};

async function setupDatabase() {
  if(!DB_HOST || !DB_USR || !DB_NAME){
    console.log('Missing database configuration')
    return;
  }
  connection = await mysql.createConnection(DB_OPTS);
  console.log(`Database Host: ${DB_HOST}, Name: ${DB_NAME}, DB_TABLE: ${DB_TABLE} `, );

}
async function getOrderById(orderId) {
  const [response] = await connection.query(
    `SELECT * FROM ${DB_TABLE} WHERE orderid=${orderId};`
  );
  if (response.length === 0) return null;
  return { ...response[0] };
}

async function createOrderId(order) {
  const k = Object.keys(order);
  const v = Object.values(order).map((e) => `'${e}'`);

  try {
    const [response] = await connection.query(
      `INSERT INTO ${DB_TABLE} (${k}) VALUES (${v});`
    );
    return { ...response[0] };
  } catch (err) {
    return { error: err };
  }
}

async function deleteOrderById(orderId) {
  const [response] = await connection.query(
    `DELETE FROM ${DB_TABLE} WHERE orderid=${orderId};`
  );
  if (response.length === 0) return null;
  return { ...response[0] };
}

async function updateOrderState(orderId, newState) {
  const [response] = await connection.query(
    `UPDATE myDB_TABLE SET status = '${newState}' WHERE orderid = ${orderId}`
  );
  // response.changedRows
  console.log(`Fetch order ${orderId}, response: "${newState}" `, response);
  return response;
}

const samplePayload = () => {
  return {
    orderid: 2,
    status: "NEW NEW",
    returntracking: new Date().toISOString(),
    datablob: "some data goes here",
  };
};

/*
Persistence testing...
(async = async () => {
  let response;
  await setupDatabase();

  response = await deleteOrderById(2);
  console.log("Delete Result: ", response);

  response = await getOrderById(2);
  console.log("get Order: ", response);

  response= await createOrderId(samplePayload());
  console.log("Create Order: ", response);

  response = await getOrderById(2);
  console.log("GET Order: ", response);

  await updateOrderState(2, 'NEW')
})();
*/
