# Module 1: Build a chatbot in Amazon Lex and handle informational queries

In this module you will build a chatbot in Lex and enable it to answer customer's questions on the offerings of your company. 

At completion of this module you will be able to test out your chatbot in the Lex console by asking questions such as "*Tell me about international plans in Germany.*"

##  Informational queries and chatbots
The first intent you will configure your bot to understand and fulfill will allow your customers to query phone plan options when they travel abroad. This serves an example for a common use case for chatbots: asking information. 

There are two ways you can implement an informational intent: you can make it general or personalize it based on the customer. The latter one requires your bot to be able to identity the customer the bot is interacting with. 

For example, if you build a chatbot that can handle checking the flight status, the general implementation can handle questions like "*what's the status for flight 123?*"; whereas if you can identify the customer asking the question, the bot can give answers to questions to "*what's the status for* ***my*** *flight today?*"

In later modules, you will try out ways for identifying the customer in a Lex bot conversation. For this module, we will stick with a general information query: what are the available phone plan options for a given country the customer is traveling to? The bot will give the same answer for anybody that asks the same question. 



## Implementation Instructions

Each of the following sections provide an implementation overview and detailed, step-by-step instructions. The overview should provide enough context for you to complete the implementation if you're already familiar with the AWS Management Console or you want to explore the services yourself without following a walkthrough.

### Prepare resources 

In this step, we will use a CloudfFormation template to provision the AWS Lambda functions, DynamoDB tables, resources we will need in later steps of the workshop.

Region| Region Code | Launch
------|------|-------
US East (N. Virginia) |   <span style="font-family:'Courier';">us-east-1</span> | [![Launch Module 1 in us-east-1](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/images/cloudformation-launch-stack-button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=lex-workshop&templateURL=https://s3.amazonaws.com/lex-customerservice-workshop/setup.yaml)


<details>
<summary><strong>CloudFormation Launch Instructions (expand for details)</strong></summary><p>

1. Click the **Launch Stack** link above.

1. Click **Next** on the Select Template page.

1. Click **Next** on the Specify Details page.

1. On the Options page, leave all the defaults and click **Next**.

1. On the Review page, check the boxes to acknowledge that CloudFormation will create IAM resources.

1. Click **Create Change Set**.

1. Wait for the change set to finish computing changes and click **Execute**

1. Let the CloudFormation launch resources in the background, you don't need to wait for it to finish before proceeding to the next step. 

	TODO: add screenshot


</p></details>


### Create a Lex bot

Use the Lex Console to create a bot named `InternationalPlan`. 

<details>
<summary><strong>Step-by-step instructions (expand for details)</strong></summary><p>

1. Go to the Lex [Console](https://console.aws.amazon.com/lex/home?region=us-east-1). 

1.  If it's your first time creating Lex chatbots, click **Get Started**.
	
	If you have created Lex bots before, click **Create** under the **Bots** tab. 
	
1. Pick **Custom bot (create your own).**

1. Fill in the form:

	For **Bot name**, use `InternationalPlan`
	
	For **Output voice**, pick `Joanna`
	
	For **Session timeout**, use 10 minutes 
	
	> This is how long your session context will be maintained so your user don't have to verify their identity again if they are interacting with the same bot and device in that time period. 

	For **COPPA**, pick `No`.
	
1. Click **Create**
</details>

### Create the first intent

Create a new intent `ListInternationalPlans` in the Lex bot

<details>
<summary><strong>Step-by-step instructions (expand for details)</strong></summary><p>

1. In the `InternationalPlan` Lex bot you just created, click **+Create Intent**

1. Pick **Create new intent**

1. Give the intent a name, `ListInternationalPlans`

</details>

### Configure Slots

Slots are parameters you can define to capture inputs from your customer. In this example, the input parameter the bot need in order to fulfill the informational query is which country the customer is traveling to. 

Each slot has a type. You can create your **custom slot types** or use **built-in slot types**. Check the [list](http://docs.aws.amazon.com/lex/latest/dg/howitworks-builtins-slots.html) of **Built-in Slot Types**
 
Because there is a built-in slot for country names, we will leverage it for this intent. 

Configure a slot `Country` with built-in type `AMAZON.Country` in the intent. 
 
<details>
<summary><strong>Step-by-step instructions (expand for details)</strong></summary><p>

1. In the **Slots** section of the `ListInternationalPlans` intent, fill in `Country` for the slot **Name**

1. Select `AMAZON.Country` for **Slot type**

1. For **Prompt**, put in `Which country are you traveling to?`

1. Click the (+) sign to add the slot 
 
	![screenshot for after configuring slot](images/slot-config.png)

</details>

### Configure sample utterances

By providing sample utterances for a given intent, you can teach Amazon Lex different ways a user might convey an intent. 

Add the following sample utterances to the intent:

* `I'm traveling to ​{Country}​`
* `List international plans`
* `List international plans for {Country}`
* `List travel plans`
* `List travel plans available`
* `Tell me about travel plans in ​{Country}​`
* `I want to know about travel plans in ​{Country}​`
* `What international plans do you have`

> Note that you don't need to list exhaustively every possible way of saying the same intent, just a few examples so the Amazon Lex deep learning algorithms can "learn".

At this stage, we haven't configured the backend logic to look up actual plan options the user asks for. But we can test how our Lex bot can understand customer requests before we integrate the backend. 

Save the intent, build and test the bot in the Lex Console.  


<details>
<summary><strong>Step-by-step instructions (expand for details)</strong></summary><p>

1. Click **Save Intent** to save the intent configuration

1. Click **Build** at the top right of the page to build the bot 
 
1. Once the build complete, use the **Test Bot** window to test different ways customer may ask about international plans for the countries they are traveling to. Verify that the bot is able to detect the intent. 

	In the below example, the user utterance contains the slot value, which Lex was able to detect: 

	<img src="images/test-utterance-including-slot.png" alt="" width="50%">

	In this below example, the user didn't tell the country he/she is inquiring about, Lex will use the **prompt** we configured for this slot to get this info from the user: 
	
	<img src="images/test-utterance-with-slot-solicitation.png" alt="" width="50%">
	
</details>


### Fulfill the query with AWS Lambda

Now we have defined the conversational interface, we need to configure the backend logic to fulfill the customer query using **AWS Lambda**. 

The Lambda function that can respond to the international plan customer request is already deployed by CloudFormation in the setup step. (It does so by querying a DynamoDB table pre-populated with fake data, also launched as part of the preparation CloudFormation)

We can configure Lex to send the detected intent and slot values from the user utterance to the `lex-workshop-LexBotHandler` Lambda function.

<details>
<summary><strong>Step-by-step instructions (expand for details)</strong></summary><p>

1. In the **Fulfillment** section of the intent, choose **AWS Lambda function** and use the selector to pick the `lex-workshop-LexBotHandler` function
	
	<img src="images/pick-lambda.png" alt="" width="60%">

1. Click **OK** to give Lex permission to invoke the Lambda function.
	![alt text](images/confirm-lambda-permission.png)

1. Save the intent by clicking **Save intent**

1. Build the bot again by clicking **Build**

1. Test the bot 

	<img src="images/after-lambda-integration.png" width="50%">

	> The plan data are randomly generated and loaded into a dynamoDB table by the CloudFormation. It might not always make economic sense. 

1. Feel free to test the voice interaction in the Console as well. 

</details>


### Check execution logs for Lambda


It's also valuable to understand what data is being passed to your Lambda function. Take a look at the `lex-workshop-LexBotHandler` function's **CloudWatch Logs** 

<details>
<summary><strong>Step-by-step instructions (expand for details)</strong></summary><p>

1. Go to the Lambda [console](https://console.aws.amazon.com/lambda/home)

1. Find the `lex-workshop-LexBotHandler` function and click on it

1. Go to the **Monitoring** tab

1. Click **View logs in CloudWatch**

1. Click on the latest log stream 

1. Find the log line that logs the input into the lambda function:

	![lambda screenshot](images/lambda-cwl.png)
	
1. Observe the fields being passed from Lex to Lambda: `userId`, `bot`, `inputTranscript`, name of the intent, and slots identified. See documentation [here](http://docs.aws.amazon.com/lex/latest/dg/lambda-input-response-format.html) on detailed explanation of all available fields.

</details>

### Next module


After you have verified your bot is answering questions correctly and checked out the lambda execution logs, move onto the next module: [Handle customer requests to subscribe to services](../02_LexBotSubscribeService)

