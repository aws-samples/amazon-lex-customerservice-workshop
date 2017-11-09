# Module 2: Handle customer requests to subscribe to services

In this module you will build on the Lex chatbot you started in module 1 and add abilities for it to subscribe users to additional services your company offers -- in this case, international plans you can add on to your existing phone plan for travel. 

You have already learned to define ***intents***, collect user inputs by leveraging ***slots*** in the last module. In this one we will go into more  advanced topics such as session management and input validation. 

<a name="session-context"></a>
## Maintaining conversation session context

Now the bot is capable of informing your customer the options they can add to the account, the next step is allow user to **choose a plan and add it to their account**. This serves an example for another common use case for chatbots: transactional requests such as updating account information, fulfill orders, etc. 

We can create a separate intent to apply the chosen plan into the user's account. This bring up the question of maintaining session context. During the same session, if the user asks to subscribe to a particular plan after hearing the list of options for a given country, the bot should maintain context and know which country is of interest when applying the plan. 

You can achieve this by using **Session Attributes**. Read [here](http://docs.aws.amazon.com/lex/latest/dg/context-mgmt.html) if you want more details of how session attributes work. You can set session attributes in the Lambda function that fulfills the bot logic. 


In the `ListInternationalPlans` intent we built in the last module, the lambda function is setting the `country` session attribute as part of the response, so subsequent conversation will have that context: 

<img src="images/list-intent-session.png" alt="session attributes in the list intent" width="60%">

You can also take a look at the Lambda [source code](../lambda-functions/bot-handler/index.js) to see how it's setting the session attributes (look for the `listPlanIntent` function).

<a name="user-auth"></a>
## Identifying and authenticating the user

This type of transactional requests also require your bot to be able to identify and authenticate the user before fulfilling their request. 

The way you identify users can vary depend on where and how your Lex bot is deployed. 

If your Amazon Lex bot is deployed as a **Facebook Messenger** or **Slack** bot, the users are already logged in into Facebook/Slack respectively, and these channels will pass the user ID on these platforms into your bot. This means you need to build a backend that can correlate the Facebook/Slack user to your company's user management system. 

If your Lex bot is bulit as part of your **mobile/web app**, then you can rely on the normal authentication methods of your app for users to log in.

This workshop shows an example if your Lex bot is deployed with either **Amazon Connect** or **Twilio SMS**. In these two scenario, because the user is interacting with your bot through a phone, you can use the phone number as one of the factors in a Multi-factor Authentication flow. In this example, we will ask for a four-digit PIN for the account associated with the phone number. 

## Implementation Instructions

### Add intent to apply international plans to user's account

Let's start by defining the conversational interface of adding an international travel plan to the user's account. 

#### Conversational interface

1. Start by creating a new intent in the `InternationalPlan` bot you already created. Name it the `ApplyTravelPlan` intent

1. Create a new custom slot for plan name with 2 supported values: `basic` and `premium` and add it to the intent as slot `planName`.

	<details>
	<summary><strong> Expand for detailed instruction </strong></summary><p>
	
	1. On the left side bar, locate the **Slot Types** tab and click (+)

	1. Use `TravelPlan` for slot name

	1. 	For description, use something like `name of international phone plans`. 
	1. For **Slot Resolution**, because in this example our international phone plans only have two possible names, we will pick **Restrict to Slot values and Synonyms** (The "Expand Values" option is when the values are more open ended, e.g. book titles, company names, etc. ) 
	
	1. For acceptable values, put an entry for `basic` and another `premium`
	
		<img src="images/custom-slot-type.png" alt="create new slot screenshot" width="60%">

	1. Name the slot `planName` and use `which plan would you like to apply to your account?` for slot prompt

		<img src="images/plan-name-slot.png" alt="create new slot screenshot" width="100%">

	</details>
	
1. Add additional slots to collect information on the plan start date, number of weeks, and country
TODO: screenshot 

1. Add sample utterances:

	```
	​{planName}​
	​Yes. ​{planName}​ plan
	​apply ​{planName}​ plan to my account
	​apply ​{planName}​ plan
	```

1. For a request that has impact on the customer's account, you can leverage the **Confirmation Prompt** feature to confirm choices users have made before fulfilling the intent. 

	<details>
	<summary><strong> Expand for detailed instruction </strong></summary><p>
	
	1. In the **Confirmation Prompt** section, fill in for **Confirm**
	
		```
		To confirm, you want to apply {planName} plan in {Country} for {numOfWeeks} weeks starting {startDate}, is that right?
		```
		
	1. For **Cancel (if the user says "no")**, fill in 
	
		```
		Ok. {planName} plan will not be added. How else can I help you?
		```
		
		<img src="images/confirmation-prompt.png" alt="configure validation lambda screenshot" width="100%">
	</details>


1.  Build and test the conversation flow  

	<details>
	<summary><strong> Expand for detailed instruction </strong></summary><p>
	
	1. Click **Save Intent** to save the intent configuration
	
	1. Click **Build** at the top right of the page to build the bot 
	 
	1. Once the build complete, use the **Test Bot** window to test the conversation flow for this intent
	
		<img src="images/test-bot-with-confirmation.png" alt="test bot screenshot" width="60%">
	</details>

#### Validate input with AWS Lambda

In the last module, we used AWS Lambda to fulfill user's intent. Another powerful integration is using Lambda functions to **validate user's inputs**. When you enable this feature, Lex invokes the specified Lambda function on each user input (utterance) after Amazon Lex understands the intent. 

Here are a few things this feature can help with our `ApplyTravelPlan` intent

* As soon as Lex recognize user's intent to subscribe to a plan, the Lambda function can check if the user has been authenticated (through [session attributes](#session-context)). If not, force the user to verify their identity before proceeding

* Validate the `startDate` user specified is later than today's date

* Validate the number of weeks user can apply their plan is between 0 and 52.  

* Validate there's a corresponding plan for user's specified country.    

Now, configure the `lex-workshop-LexBotHandler` function for input validation for this intent: 

<details>
	<summary><strong> Expand for detailed instruction </strong></summary><p>
</details>
TODO
<img src="images/validation-lambda.png" alt="configure validation lambda screenshot" width="70%">

Build and test the bot again. Note that the lambda validation is kicking in to force the user to verify their identity before proceeding:

<img src="images/force-authentication-demo.png" alt="test bot that enforces authentication" width="60%">


### Add intent to verify user identity  

As discussed in the [Identifying and authenticating the user](#user-auth) section, if your user is interacting with your bot through a phone, the bot can look up their phone number and verify their identity by challenging them with one or more security questions. In this workshop we will use a four-digit PIN. 

To handle the identity verification flow, we need to create a new intent: 

1. Create a new intent `VerifyIdentity`

1. Create a `pin` slot with a built-in slot type `AMAZON.FOUR_DIGIT_NUMBER`

	<details>
	<summary><strong> Expand for detailed instruction </strong></summary><p>
	</details>

	<img src="images/pin-slot.png" alt="configure the pin slot" width="100%">

1. Add sample utterances:

	```
	{pin}
	my pin is {pin}
	verify my identity
	```

1. Configure Lambda fulfillment

1. Test 


### Test full flow



### Cognito 

