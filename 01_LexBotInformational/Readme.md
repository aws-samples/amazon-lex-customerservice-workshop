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
 
	![alt text](images/slot-config.png)

</details>

### Configure sample utterances

By providing sample utterances for a given intent, you can teach Amazon Lex different ways a user might convey an intent. 

Add the following sample utterances to the intent:

* `I'm traveling to ​{Country}​`
* `List international plans`
* `List international for {Country}`
* `List travel plans`
* `List travel plans available`
* `Tell me about travel plans in ​{Country}​`
* `What international plans do you have?`



