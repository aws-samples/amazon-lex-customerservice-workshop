# Extra credit

There are many options to expand on what you've built in the previous modules. 

The challenges here are, pick your battle :)

## Challenge 1: integrate the bot with other messaging platforms

Why not add more channels your customer can use to reach your customer service? Here are some ideas:

* **Facebook Messenger**
	
	See guide [here](http://docs.aws.amazon.com/lex/latest/dg/fb-bot-association.html) on integrating your Lex bot with Facebook Messenger. 

* **Slack**
	
	See guide [here](http://docs.aws.amazon.com/lex/latest/dg/slack-bot-association.html) on integrating your Lex bot with Slack
	
* **Amazon Alexa Skill**

 	See guide [here](http://docs.aws.amazon.com/lex/latest/dg/export.html) on exporting your Lex bot to an Alexa skill. 
 	
* **Kik Messenger** 
 
 	See guide [here](http://docs.aws.amazon.com/lex/latest/dg/kik-bot-association.html) on integrating your Lex bot with Kik Messenger. 

* **Mobile app**
	
	Use [AWS Mobile Hub](http://docs.aws.amazon.com/aws-mobile/latest/developerguide/conversational-bots.html) to generate an Android/iOS mobile app that integrates with your Lex chatbot. 

* **Web app**
 
	Refer to these examples to embed a chatbot in your website powered by Amazon Lex:
	
	* [https://github.com/awslabs/aws-lex-web-ui](https://github.com/awslabs/aws-lex-web-ui)
	* [“Greetings, visitor!” — Engage Your Web Users with Amazon Lex](https://aws.amazon.com/blogs/ai/greetings-visitor-engage-your-web-users-with-amazon-lex/)
	* [Capturing Voice Input in a Browser and Sending it to Amazon Lex
](https://aws.amazon.com/blogs/ai/capturing-voice-input-in-a-browser/)

## Challenge 2: make the bot support additional intents

Some ideas: 

* Add a `Hello` intent to greet users and give them guidance on what the bot can help them with. (The bot handler lambda function already has support for this)

* Add a `ListInternationalPlans` intent to allow users to check what international travel plans they already have on their account.  (The bot handler lambda function already has support for this)

* Add a `Finish` intent to allow users to signal they are done with the conversation (The bot handler lambda function already has support for this)

* Add an intent to describe in more detail how a particular plan works. (you need to update the lambda function to add support for this)


## Challenge 3: build a bot for your own customer service use case

What do your customers need help with? 
