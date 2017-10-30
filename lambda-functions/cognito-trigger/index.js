"use strict";
const AWS = require('aws-sdk');
const util = require('util');

const fakeDefaultPin = "1234";
const ddbTable = process.env.USER_DDB_TABLE;

const docClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
});

exports.handler = function (event, context, callback) {
    // TODO: for real applications, redact PII before logging
    console.log("Reading input from event:\n", util.inspect(event, {depth: 5}));

    console.log('ddbtable is: ' + ddbTable);

    let params = {};

    if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
        var item = {
            userId: event.userName,
            phone: event.request.userAttributes['phone_number'],
            firstName: event.request.userAttributes['given_name'],
            lastName: event.request.userAttributes['family_name']
        }
        if (event.request.userAttributes['email']) {
            item.email = event.request.userAttributes['email']
        }

        item.email = event.request.userAttributes['email']

        // fake a default PIN
        // TODO: use KMS to encrypt
        item.pin = fakeDefaultPin;

        params = {
            TableName: ddbTable,
            Item: item
        };

        docClient.put(params).promise()
            .then(data => callback(null, event))
            .catch(err => {
                console.error(err);
                callback(err, null)
            });

    } else if (event.triggerSource === "PreAuthentication_Authentication") {
        callback(null, event);
    } else {
        // not a valid trigger source
        return callback("Invalid trigger source.", null);
    }

};

