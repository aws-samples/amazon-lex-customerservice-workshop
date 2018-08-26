# Module 3: Integrate Amazon Lex with Amazon Connect
In this module you will integrate your Amazon Lex bot with Amazon Connect, a service that allows you to create software-defined call centers in minutes.

Upon completion, you will be able to interact with your bot using a telephone (yes, think PSTN).
To achieve this you will create a contact center, configure a simple call flow, and assign a phone number to the flow. 

## Implementation Instructions

Each of the following sections provide an implementation overview and detailed, step-by-step instructions. The overview should provide enough context for you to complete the implementation if you're already familiar with the AWS Management Console or if you want to explore the services yourself without following a walkthrough.

### Create a new Amazon Conect instance
Go to the [Amazon Connect Console](https://console.aws.amazon.com/connect/home?region=us-east-1) to create a new virtual contact center instance in the us-east-1 (Virgina) region.

<details>
<summary><strong>Step-by-step instructions (expand for details)</strong></summary><p>

1. From the AWS Management Console, choose **Services** then select **Amazon Connect** under Contact Center and then **Get started**

1. In **Step 1: Identity management**, select **Store users within Amazon Connect** and provide a domain name (e.g. `{FirstName}` to complete the **Access URL** and click **Next step**
	
	> The domain name used in your contact center URL needs to be globally unique and cannot be changed.
	Alternatively, Amazon Connect can use an existing [AWS Directory Services](https://aws.amazon.com/directoryservice) directory.   
		
1. In **Step 2: Administrator**, **Skip this** and continue with **Next step**

1. In **Step 3: Telephony options**, select **I want to handle incoming calls with Amazon Connect** and **I want to make outbound calls with Amazon Connect**

1. In **Step 4: Data storage**, accept the defaults

1. In **Step 5: Review and create**, review your settings and then select **Create Instance**
</p></details>

### Claim a phone number for your Amazon Connect instance
Once your Amazon Connect instance has been created, click **Get started** to select a phone number. 
<details>
<summary><strong>Step-by-step instructions (expand for details)</strong></summary><p>

1. Select **Get started** to open the Amazon Connect Contact Center Manager (CCM) welcome screen

1. Select **Let's go** to claim a phone number

1. Select **United States +1**, **Direct Dial**, and choose a phone number from the numbers provided

1. Dial the phone number you selected in step 3 from another phone (e.g. your mobile phone) and choose **1** from the voice menu to connect with an agent; you can then use the Amazon Connect Contact Control Panel to accept the call
	> It may take a few minutes before the claimed phone number is active.

1. Choose **Continue** to get to the Amazon Connect Contact Center Manager App (CCM); poke around a bit to see what's available
	> If you accepted a call, it should show up under the Contact search option.
</p></details>

### Configure contact flow
With a Connect instance and a phone number, you can now create the Contact Flow that allows callers to interact with our bot in [Module  1](../01_LexBotInformational).

<details>
<summary><strong>Step-by-step instructions (expand for details)</strong></summary><p>

1. In the Amazon Connect Console, select your instance, then choose Contact Flows to allow Amazon Connect to interact with the `InternationalPlan` bot

	<img src="images/allow_connect_integration.png" alt="Allow Connect to interact with the bot"/>

1. In the Amazon Connect Contact Center Manager, use the navigation pane on the left hand side to select **Routing** and then **Contact flows**

	![ContactFlowNavigation](images/contact_flows_navigation.png)
	
	> If you closed your browser window you can always re-open the Amazon Connect Contact Center Manager from the [Amazon Connect console](https://console.aws.amazon.com/connect/home?region=us-east-1). Just selct your Amazon connect instance and click on the **Login as administrator** button in the **Overview** section of the console. 

1. In the top right corner select **Create contact flow** to open the contact flow editor

1. Name your contact flow `CustomerServiceChatbot`

1. Expand the **Interact** group of blocks and drag and drop the **Get customer input** block onto the grid

1. Expand the **Terminate / Transfer** group of blocks and drag and drop the **Disconnect / Hang up** block onto the grid

1. Wire up the three building blocks as shown in the image below

	![ContactFlowWiring](images/contact_flow_wiring.png)

1. Double click on the **Get customer input** block to access its configuration
	
	1. Select the **Text to speech (Ad hoc)** input type and use this welcome message:  ` Welcome to the marvelous telco company. How can I help you today?`
	
	1. Select **Amazon Lex** input type
	
	1. Enter `InternationalPlan` bot name and `dev` alias

	1. Click **Save**

		<img src="images/get_customer_input.png" alt="Get customer input configuration" width="50%" />
	
1. Click on the **down arrow** (![DownArrow](images/down.png)) next to the Save button at the top right and select **Save & Publish**

1. Wait for the contact flow to be published successfully
</p>

</details>


### Associate Contact Flow with phone number
Now you need to associate your new contact flow with your phone number
<details>
<summary><strong>Step-by-step instructions (expand for details)</strong></summary><p>

1. Select **Routing** and **Phone Numbers** on the left hand Amazon Connect navigation pane

1. Click on the number to edit the contact flow

1. Search and select the `CustomerServiceChatbot` contact flow in the **Contact flow/IVR** field

1. Select **Save** to confirm the contact flow association
</p></details>

### Test your Amazon Lex enabled Amazon Connect contact flow
Dial your Amazon Connect contact center phone number to confirm functionality of contact flow and Amazon Lex integration. Tell the virtual service agent **"I'm going to China."**; use 1234 when asked for your pin code.

### Make phone number available to the bot
In this last step we are enhancing the customer input configuration of the contact flow to make the caller's phone number available to the bot.

 ![ContactFlowNavigation](images/set_session_attributes.png)

<details>
<summary><strong>Step-by-step instructions (expand for details)</strong></summary><p>

1. Re-open the CCM app; within the [Amazon Connect console](https://console.aws.amazon.com/connect/home?region=us-east-1) select **Overview** and **Login as administrator**

1. On the left hand navigation select **Routing** - **Contact flows**

	![ContactFlowNavigation](images/contact_flows_navigation.png)
	
1. Click the `CustomerServiceChatbot` flow to open the flow

1. Click the **Get customer input** block to access its configuration

1. Scroll to the bottom and under **Session attributes** click **Add an attribute**

1. Select **Use attribute**

1. In the **Type** drop-down, select **System**, enter `IncomingNumber` in the **Destination Key** field and select **Customer Number** from the **Attribute** drop down

1. Click **Add another attribute**

1. Enter `Source` as **Destination Key** and `AmazonConnect` as **Value**

1. Select **Save**

1. Click on the **down arrow** (![DownArrow](images/down.png)) next to the save button and select **Save & Publish**
	
1. Confirm publishing of the workflow in selecting the **Save & publish** button
 	![ContactFlowNavigation](images/publish_confirmation.png)
</details>	
	
### Test your bot with Amazon Connect
Call your Amazon Connect phone number to interact with your bot over the phone.  Ask the virtual service agent **"What international plans do you have?"**. When asked for your pin code enter the last four digits of the phone number you are calling from.	
	




