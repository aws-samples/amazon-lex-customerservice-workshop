var fs = require('fs');
const AWS = require('aws-sdk');
const util = require('util');

const planCatalogueDdbTable = process.env.PLAN_CATALOGUE_DDB_TABLE;
const docClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
});
const batchSize = 25;

exports.handler = (event, context, callback) => {
    var obj = JSON.parse(fs.readFileSync('MOCK_DATA.json', 'utf8'));

    var batchPutPromises = [];
    var itemArray = []
    for (var i = 0; i < obj.length; i++) {
        if (i % batchSize === 0 && i !== 0) {
            var param = {RequestItems: {}};
            param['RequestItems'][planCatalogueDdbTable] = itemArray;
            batchPutPromises.push(docClient.batchWrite(param).promise());
            itemArray = [];
        }
        itemArray.push({PutRequest: {Item: obj[i]}});
    }
    var param = {RequestItems: {}};
    param['RequestItems'][planCatalogueDdbTable] = itemArray;
    batchPutPromises.push(docClient.batchWrite(param).promise());

    Promise.all(batchPutPromises).then(data => {
        console.log("done loading " + obj.length + " rows.");
        callback(null, data)
    }).catch(err => {
        console.error(err);
        callback(err);
    })
}

