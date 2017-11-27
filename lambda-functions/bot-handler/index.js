'use strict';

/*
 Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
 http://aws.amazon.com/apache2.0/
 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

const AWS = require('aws-sdk');

const userDdbTable = process.env.USER_DDB_TABLE;
const userDdbTablePhoneIndex = process.env.USER_DDB_TABLE_PHONE_INDEX;
const userplansDdbTable = process.env.USER_PLAN_DDB_TABLE;
const planCatalogueDdbTable = process.env.PLAN_CATALOGUE_DDB_TABLE;
//const botName = "InternationalPlan";
const stubUserId = "stubUser";
const stubPin = "1234";

const applyPlanIntentName = "ApplyTravelPlan";
const checkPlanIntentName = "CheckTravelPlan";
const verifyIdentityIntentName = "VerifyIdentity";
const listPlanIntentName = "ListInternationalPlans";
const helloIntentName = "Hello";

const finishIntentName = "Finish";

const followupQuestion = "Can I help you with anything else?";

const docClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
});


// --------------- Helpers that build all of the responses -----------------------

// continue dialog with the customer, expressing that the user will select another intent after she hears this response
function nextIntent(sessionAttributes, message) {

    console.log(`nextIntent:  ${JSON.stringify(message)}`);
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitIntent',
            message: message
        }
    };
}

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

function confirmIntent(sessionAttributes, intentName, slots, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ConfirmIntent',
            intentName,
            slots,
            message,
        },
    };
}

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}


// --------------- Date helpers -----------------------
function parseLocalDate(date) {
    /**
     * Construct a date object in the local timezone by parsing the input date string, assuming a YYYY-MM-DD format.
     * Note that the Date(dateString) constructor is explicitly avoided as it may implicitly assume a UTC timezone.
     */
    const dateComponents = date.split(/\-/);
    return new Date(dateComponents[0], dateComponents[1] - 1, dateComponents[2]);
}

function addWeeks(date, numberOfWeeks) {
    const newDate = parseLocalDate(date);
    newDate.setTime(newDate.getTime() + (86400000 * numberOfWeeks * 7));
    const paddedMonth = (`0${newDate.getMonth() + 1}`).slice(-2);
    const paddedDay = (`0${newDate.getDate()}`).slice(-2);
    return `${newDate.getFullYear()}-${paddedMonth}-${paddedDay}`;
}

function isValidDate(date) {
    try {
        if (isNaN(parseLocalDate(date).getTime())) {
            return false;
        }
        // start date must not be in the past.
        let timestamp = parseLocalDate(date).getTime();
        let now = (new Date()).getTime();
        return now <= timestamp;
    } catch (err) {
        return false;
    }
}

function toUpper(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(function (word) {
            console.log("First capital letter: " + word[0]);
            console.log("remain letters: " + word.substr(1));
            return word[0].toUpperCase() + word.substr(1);
        })
        .join(' ');
}

// --------------- Intents that does not require identity verification -----------------------
function finishIntent(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    callback(close(sessionAttributes, 'Fulfilled', {
        contentType: 'PlainText',
        content: 'Thank you. Good bye.'
    }));
}

function helloIntent(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    var msg = "Thank you for contacting the marvelous telco company. How can I help you today? "
    if (intentRequest.outputDialogMode === "Voice" || (sessionAttributes.Source && sessionAttributes.Source === "AmazonConnect")) {
        msg += 'you can say things like "Tell me about international plans".'
    } else {
        msg += '("Tell me about international plans", "Check the travel plans in my account", etc. )'
    }
    callback(nextIntent(
        sessionAttributes,
        {
            'contentType': 'PlainText',
            'content': msg
        }));
}

function listPlanIntent(intentRequest, callback) {
    const slots = intentRequest.currentIntent.slots;
    const sessionAttributes = intentRequest.sessionAttributes || {};
    var country = standardizeCountryName(slots.Country);

    var params = {
        TableName: planCatalogueDdbTable,
        KeyConditionExpression: 'country = :c',
        ExpressionAttributeValues: {
            ":c": country
        }
    };
    docClient.query(params).promise().then(data => {
        console.log("list plan DDB result", JSON.stringify(data, null, 2));

        if (data.Count === 0) {
            // callback(nextIntent(
            //     sessionAttributes,
            //     {
            //         'contentType': 'PlainText',
            //         'content': `There's no international plans available for ${country}. What other countries are you looking for? `
            //     }));
            callback(elicitSlot(sessionAttributes, listPlanIntentName, {Country: null}, "Country", {
                'contentType': 'PlainText',
                'content': `There's no international plans available for ${country}. What other countries are you looking for? `
            }));
            return;
        }

        sessionAttributes.country = country;
        var msg = `We have ${data.Count} plans for ${country}. `
        for (var i = 0; i < data.Count; i++) {
            let item = data.Items[i];
            msg += `${item.planName} is $${item.planPrice} `
            if (item.planName === "Premium") {
                msg += "with unlimited data, call and text. "
            } else {
                if (item.isDataUnlimited) {
                    msg += `with unlimited data, `
                } else {
                    msg += `with ${item.dataIncluded} GB data, `
                }
                if (item.isCallUnlimited) {
                    msg += `unlimited call, `
                } else {
                    msg += `${item.callMinutesIncluded} call minutes, `
                }
                if (item.isTextUnlimited) {
                    msg += `unlimited text. `
                } else {
                    msg += `${item.callMinutesIncluded} texts. `
                }
            }
        }
        msg += "Which plan would you like to add?"
        callback(nextIntent(
            sessionAttributes,
            {
                'contentType': 'PlainText',
                'content': msg
            }));
    }).catch(err => {
        console.error(err);
        errorResponse(callback, sessionAttributes);
    })
}


// --------------- Intents that require identity verification -----------------------

function checkPlanIntent(intentRequest, callback) {
    const slots = intentRequest.currentIntent.slots;
    const sessionAttributes = intentRequest.sessionAttributes || {};

    if (intentRequest.invocationSource == "DialogCodeHook") {
        if (isUserVerified(sessionAttributes)) {
            callback(delegate(sessionAttributes, slots));
            return;
        } else {
            sessionAttributes.intentBeforeVerification = checkPlanIntentName;
            requestUserVerification(callback, sessionAttributes);
        }
    } else {
        checkPlanInAccount(sessionAttributes, callback);
    }
}

function errorResponse(callback, sessionAttributes) {
    callback(nextIntent(
        sessionAttributes,
        {
            'contentType': 'PlainText',
            'content': "We've encountered an error. " + followupQuestion
        }));
}
function checkPlanInAccount(sessionAttributes, callback, responsePrefix) {
    let user = getVerifiedUser(sessionAttributes);
    var params = {
        TableName: userplansDdbTable,
        KeyConditionExpression: 'userId = :u',
        ExpressionAttributeValues: {
            ':u': user
        }
    };
    // TODO: if none in account, elicit if customer want new
    docClient.query(params).promise().then(data => {
        var message = responsePrefix ? responsePrefix : "";
        message += "You have " + data.Count + " travel plan" + (data.Count > 1 ? "s" : "") + " in your account. ";
        for (var i = 0; i < data.Count; i++) {
            message += i + 1 + ": " + describePlan(data.Items[i]) + ". ";
        }
        message += followupQuestion;
        callback(nextIntent(
            sessionAttributes,
            {
                'contentType': 'PlainText',
                'content': message
            }));
    }).catch(err => {
        console.error(err);
        errorResponse(callback, sessionAttributes);
    })
}

function applyPlan(slots, sessionAttributes, callback) {
    let country = toUpper(slots.Country ? slots.Country : sessionAttributes.country);
    let plan = slots.planName;
    console.log("plan to apply: " + plan + " for country: " + country);

    let user = getVerifiedUser(sessionAttributes);
    let startDate = slots.startDate;
    let numOfWeeks = parseInt(slots.numOfWeeks);
    let endDate = addWeeks(startDate, numOfWeeks);
    console.log("requested plan start date:", startDate, " ;end date:", endDate, " ;# of weeks:", numOfWeeks);

    var params = {
        TableName: userplansDdbTable,
        KeyConditionExpression: 'userId = :u and country =:c',
        ExpressionAttributeValues: {
            ':u': user,
            ":c": country
        }
    };
    docClient.query(params).promise().then(data => {
        if (data.Count !== 0) {
            console.log(data);
            callback(nextIntent(
                sessionAttributes,
                {
                    'contentType': 'PlainText',
                    'content': "You already have a travel plan for " + country + " in your account. " +
                    "You currently have " + describePlan(data.Items[0]) +
                    ". " + followupQuestion
                }));

        } else {
            let params = {
                TableName: userplansDdbTable,
                Item: {
                    userId: user,
                    country: country,
                    planName: plan,
                    startDate: startDate,
                    endDate: endDate
                }
            };
            return docClient.put(params).promise();
        }
    }).then(data => {
        // rely on the "Follow-up message" setting of the intent to confirm and follow-up
        callback(close(sessionAttributes, 'Fulfilled'));
    }).catch(err => {
        console.error(err);
        callback(nextIntent(
            sessionAttributes,
            {
                'contentType': 'PlainText',
                'content': "We've encountered an error. " + followupQuestion
            }));
    })
}

function describePlan(item) {
    return item.planName + " plan " + " for " + item.country +
        " starting from " + item.startDate + " to " + item.endDate;
}


function applyPlanIntent(intentRequest, callback) {
    const slots = intentRequest.currentIntent.slots;
    const sessionAttributes = intentRequest.sessionAttributes || {};

    // first check if the user identity verified
    if (!isUserVerified(sessionAttributes)) {
        sessionAttributes.intentBeforeVerification = applyPlanIntentName;
        if (slots.planName) {
            sessionAttributes.planToApply = slots.planName;
        }
        requestUserVerification(callback, sessionAttributes);
        return;
    }

    if (intentRequest.invocationSource == "DialogCodeHook") {

        // is country supplied?
        if (!slots.Country && !sessionAttributes.country) {
            callback(elicitSlot(sessionAttributes, applyPlanIntentName, slots, "Country"));
        }

        // Validate any slots which have been specified.  If any are invalid, re-elicit for their value
        validateApplyPlanInputs(sessionAttributes, slots).then(validationResult => {
            if (!validationResult.isValid) {
                slots[`${validationResult.violatedSlot}`] = null;
                callback(elicitSlot(validationResult.sessionAttributes, intentRequest.currentIntent.name,
                    slots, validationResult.violatedSlot, validationResult.message));
                return;
            }
            callback(delegate(validationResult.sessionAttributes, slots));
        }).catch(err => {
            console.error(err);
            callback(nextIntent(
                sessionAttributes,
                {
                    'contentType': 'PlainText',
                    'content': "We've encountered an error. " + followupQuestion
                }));
        });
    } else {
        applyPlan(slots, sessionAttributes, callback);
    }
}

function buildValidationResult(isValid, violatedSlot, messageContent, sessionAttributes) {
    return {
        isValid,
        violatedSlot,
        message: {contentType: 'PlainText', content: messageContent},
        sessionAttributes
    };
}

function validateCountry(country) {
    var params = {
        TableName: planCatalogueDdbTable,
        KeyConditionExpression: 'country = :c',
        ExpressionAttributeValues: {
            ":c": country
        }
    };
    return new Promise((resolve, reject) => {
        docClient.query(params).promise().then(data => {
            if (data.Count !== 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        }).catch(err => {
            console.error(err);
            reject(err);
        })
    });
}

function isValidNumOfWeek(numOfWeeks) {
    try {
        let num = parseInt(numOfWeeks);
        if (num <= 0 || num > 52) {
            return false;
        }
        return true;
    } catch (err) {
        return false;
    }
}

function standardizeCountryName(country) {
    var cleanCountry = toUpper(country);
    if (cleanCountry == "Uk" || cleanCountry == "Britain") {
        return "United Kingdom";
    }
    if (cleanCountry == "Us" || cleanCountry == "Usa") {
        return "United States";
    }
    return cleanCountry;
}

function validateApplyPlanInputs(sessionAttributes, slots) {
    return new Promise((resolve, reject) => {
        moveCountryFromSessionToSlot(sessionAttributes, slots);
        slots.Country = standardizeCountryName(slots.Country);
        if (validateCountry(slots.Country).then(isValid => {
                if (!isValid) {
                    resolve(buildValidationResult(false, 'Country', `We currently do not support ${slots.Country}. Do you want try a different country?`), sessionAttributes);
                } else {
                    sessionAttributes.country = slots.Country;
                    if (slots.startDate != null && !isValidDate(slots.startDate)) {
                        resolve(buildValidationResult(false, 'startDate', `The date you specified, ${slots.startDate}, is not valid. Please specify an exact start date later than today.`), sessionAttributes);
                    }

                    if (slots.numOfWeeks != null && !isValidNumOfWeek(slots.numOfWeeks)) {
                        resolve(buildValidationResult(false, 'numOfWeeks', `The number of weeks you specified, ${slots.numOfWeeks}, is not valid. Please specify an integer greater than 0 less than 52.`), sessionAttributes);
                    }
                    resolve({isValid: true, sessionAttributes});
                }
            }).catch(err => reject(err)));
    });
}


// --------------- Identity verification -----------------------
function requestUserVerification(callback, sessionAttributes) {
    callback(nextIntent(
        sessionAttributes,
        {
            'contentType': 'PlainText',
            'content': "Please verify your identity first. What's your user PIN?"
        }));
}

function moveCountryFromSessionToSlot(sessionAttributes, slots) {
    if (sessionAttributes.country) {
        slots.Country = sessionAttributes.country;
        // delete sessionAttributes.country;
    }
}
function verifyIdentityIntent(intentRequest, callback) {
    var slots = intentRequest.currentIntent.slots;
    const sessionAttributes = intentRequest.sessionAttributes || {};

    verifyUser(sessionAttributes, slots, intentRequest).then(verifyUserResult => {
        if (verifyUserResult.result === true) {
            sessionAttributes.identityVerified = true;
            sessionAttributes.loggedInUser = verifyUserResult.userCognitoId;

            if (sessionAttributes.pinAttempt) {
                delete sessionAttributes.pinAttempt;
            }
            var message = "Thank you, we have verified your identity. ";
            if (sessionAttributes.intentBeforeVerification === applyPlanIntentName) {
                delete sessionAttributes.intentBeforeVerification;
                slots = {numOfWeeks: null, startDate: null, Country: null, planName: null};
                if (!sessionAttributes.country) {
                    message += "You have asked to apply travel plans to your account. Which country are you traveling to?"
                    callback(elicitSlot(sessionAttributes, applyPlanIntentName, slots, 'Country', {
                        'contentType': 'PlainText',
                        'content': message
                    }));
                    return;
                } else {
                    moveCountryFromSessionToSlot(sessionAttributes, slots);
                }

                if (sessionAttributes.planToApply) {
                    slots.planName = sessionAttributes.planToApply;
                    delete sessionAttributes.planToApply;
                    message += `You have asked to apply ${slots.planName} plan for ${slots.Country} to your account. When do you like ${slots.planName} plan to start?`
                    callback(elicitSlot(sessionAttributes, applyPlanIntentName, slots, 'startDate', {
                        'contentType': 'PlainText',
                        'content': message
                    }));
                    return;

                } else {
                    message += "You have asked to apply travel plans to your account. Which plan would you like to apply?"
                    callback(elicitSlot(sessionAttributes, applyPlanIntentName, slots, 'planName', {
                        'contentType': 'PlainText',
                        'content': message
                    }));
                    return;
                }
            } else if (sessionAttributes.intentBeforeVerification === checkPlanIntentName) {
                delete sessionAttributes.intentBeforeVerification;
                message += "You have asked to check travel plans in your account. "
                checkPlanInAccount(sessionAttributes, callback, message);
                return;
            }

            callback(nextIntent(
                sessionAttributes,
                {
                    'contentType': 'PlainText',
                    'content': message
                }));

        } else {
            sessionAttributes.identityVerified = false;
            if (sessionAttributes.loggedInUser) {
                delete sessionAttributes.loggedInUser;
            }
            if (sessionAttributes.pinAttempt) {
                sessionAttributes.pinAttempt = parseInt(sessionAttributes.pinAttempt) + 1;
            } else {
                sessionAttributes.pinAttempt = 1;
            }
            if (sessionAttributes.pinAttempt > 3) {
                delete sessionAttributes.pinAttempt;
                callback(close(sessionAttributes, 'Failed',
                    {contentType: 'PlainText', content: "Unable to verify your identity. "}));
            } else {
                callback(elicitSlot(sessionAttributes, verifyIdentityIntentName, slots, "pin", {
                    contentType: 'PlainText',
                    content: "The pin did not match our records, please try again."
                }));
            }

        }
    }).catch(err => {
        callback(close(sessionAttributes, 'Failed',
            {contentType: 'PlainText', content: err.message}));
    })
}

function isUserVerified(sessionAttributes) {
    if (sessionAttributes.identityVerified && (sessionAttributes.identityVerified === "true" || sessionAttributes.identityVerified === true )) {
        return true;
    } else {
        return false;
    }
}

function getVerifiedUser(sessionAttributes) {
    return sessionAttributes.loggedInUser;
}

function padPrecedingZeros(pinString) {
    if (pinString.length < 4) {
        var padded = "000" + pinString;
        return padded.slice(padded.length - 4);
    }
    else {
        return pinString;
    }
}

function verifyUser(sessionAttributes, slots, intentRequest) {
    return new Promise((resolve, reject) => {
        slots.pin = padPrecedingZeros(slots.pin);
        if (sessionAttributes.Source && sessionAttributes.Source === "AmazonConnect") {
            const phoneNumber = sessionAttributes.IncomingNumber;
            console.log("incoming phone number", phoneNumber)
            const expectedPin = phoneNumber.slice(phoneNumber.length - 4)
            if (slots.pin !== expectedPin) {
                console.log("pin mismatch", slots.pin, expectedPin);
                resolve({result: false});
            } else {
                resolve({result: true, userCognitoId: phoneNumber});
            }

            // var params = {
            //     TableName: userDdbTable,
            //     IndexName: userDdbTablePhoneIndex,
            //     KeyConditionExpression: 'phone = :p',
            //     ExpressionAttributeValues: {
            //         ':p': phoneNumber
            //     }
            // };
            // docClient.query(params).promise().then(data => {
            //     if (data.Count === 0) {
            //         resolve(false);
            //         return;
            //     }
            //     let item = data.Items[0];
            //     // comment out because voice recognition of people's name is hard to get right (different spelling of same pronunciation, accents, etc.)
            //     // let lastName = item['lastName']
            //     // let firstName = item['firstName']
            //     // let fullName = firstName.toLowerCase() + " " + lastName.toLowerCase()
            //     // if (slots.name.toLowerCase() !== fullName) {
            //     //     console.log("name does not match record. expected: [" + fullName + "] ; user input: [" + slots.name.toLowerCase() + "]");
            //     //     resolve(false);
            //     //     return;
            //
            //     //TODO : add KMS client side encryption of pin
            //     if (slots.pin !== item.pin) {
            //         console.log("pin mismatch");
            //         resolve({result: false});
            //         return;
            //     }
            //     resolve({result: true, userCognitoId: item.userId});
            // }).catch(err => {
            //     console.error(err);
            //     reject(err);
            // })
        }
        if (intentRequest.requestAttributes && intentRequest.requestAttributes["x-amz-lex:channel-type"] && intentRequest.requestAttributes["x-amz-lex:channel-type"] == "Twilio-SMS") {
            const phoneNumber = "+" + intentRequest.userId;
            console.log("incoming phone number", phoneNumber)
            const expectedPin = phoneNumber.slice(phoneNumber.length - 4)
            if (slots.pin !== expectedPin) {
                console.log("pin mismatch", slots.pin, expectedPin);
                resolve({result: false});
            } else {
                resolve({result: true, userCognitoId: phoneNumber});
            }
        } else {
            // from lex console, no phone number to identity the user.
            if (slots.pin !== stubPin) {
                console.log("No phone number from input, pin mismatch stub pin");
                resolve({result: false});
                return;
            } else {
                console.log("No phone number from input, pin match stub pin")
                if (intentRequest.requestAttributes && intentRequest.requestAttributes["x-amz-lex:channel-type"] && intentRequest.requestAttributes["x-amz-lex:channel-type"] == "Facebook") {
                    if (intentRequest.requestAttributes['x-amz-lex:user-id']) {
                        resolve({result: true, userCognitoId: intentRequest.requestAttributes['x-amz-lex:user-id']});
                        return;
                    }
                }
                resolve({result: true, userCognitoId: stubUserId});
            }
        }
    });
}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
exports.handler = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the US west coast time zone.
        process.env.TZ = 'America/Los_Angeles';
        console.log(`event.bot.name=${event.bot.name}`);

        /**
         * Uncomment this if statement and populate with your Lex bot name, alias and / or version as
         * a sanity check to prevent invoking this Lambda function from an undesired source.
         */
        // if (event.bot.name != botName) {
        //     callback('Invalid Bot Name');
        // }
        dispatch(event, (response) => loggingCallback(response, callback));
    } catch (err) {
        callback(err);
    }
};


/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {

    console.log(JSON.stringify(intentRequest, null, 2));
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === verifyIdentityIntentName) {
        return verifyIdentityIntent(intentRequest, callback);
    } else if (intentName === applyPlanIntentName) {
        return applyPlanIntent(intentRequest, callback);
    } else if (intentName === finishIntentName) {
        return finishIntent(intentRequest, callback);
    } else if (intentName === listPlanIntentName) {
        return listPlanIntent(intentRequest, callback);
    } else if (intentName === helloIntentName) {
        return helloIntent(intentRequest, callback);
    } else if (intentName === checkPlanIntentName) {
        return checkPlanIntent(intentRequest, callback);
    }
    throw new Error(`Intent with name ${intentName} not supported`);
}


function loggingCallback(response, originalCallback) {
    console.log("lambda response:\n", JSON.stringify(response, null, 2));
    originalCallback(null, response);
}