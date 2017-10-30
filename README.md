# Build a customer service chatbot with Amazon Lex

TODO: update 

This directory should be used as a basic template for building new workshops.

The primary README.md file in the main workshop directory should contain a brief overview of the topics being covered and set expectations for the student about what they should expect to learn. It should also instruct students to complete the Pre Lab before starting the workshop to ensure they have the appropriate background knowledge and to verify that their environment and AWS account is configured correctly in order for them to successfully complete the modules.

Keep the workshop summary relatively short. One or two paragraphs is fine. Detailed discussion of architectural topics should be done in each module or potentially in a standalone page linked to from the primary landing page.

The main README.md file of your workshop should serve as an appropriate landing page for complete newcomers to the Wild Rydes repo. Expect that there will be links directly to this page and that a self-serve student should be able to easily complete your workshop based on the information and links provided.

## Prerequisites

### AWS Account

In order to complete this workshop you'll need an AWS Account with sufficient permission to create AWS IAM, Amazon Lex, Amazon Connect, Lambda, DynamoDB and CloudFormation resources. The code and instructions in this workshop assume only one student is using a given AWS account at a time. If you try sharing an account with another student, you'll run into naming conflicts for certain resources. You can work around these by appending a unique suffix to the resources that fail to create due to conflicts, but the instructions do not provide details on the changes required to make this work.

## Modules

This workshop is broken up into multiple modules. For building out your Lex chatbot, you must complete the following module in order before proceeding to the next:

1. [Build a Lex chatbot and handle informational queries](01_LexBotInformational)
1. [Handle customer requests to authenticate and subscribe to services](02_LexBotSubscribeService)

Once you have a working Lex chatbot, you can choose to complete one or more of the following modules to integrate your Lex chatbot to different channels to interface with your customer:

* [Integrate Lex chatbot with Amazon Connect (voice over the phone)](03_AmazonConnectIntegration)
* [Integrate Lex chatbot with Twilio SMS (text over SMS)](04_TwilioSMSIntegration)
