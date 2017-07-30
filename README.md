# Tutorial: How to build a bot in 30min

## Dev environment setup

1. Initialize the project
```
npm init
npm install --save botbuilder restify
```
Use snippet: *echo_bot*

2. Register A Bot: https://docs.microsoft.com/en-us/bot-framework/portal-register-bot

3. Export bot framework app creds
```
export MICROSOFT_APP_ID=<APP_ID>
export MICROSOFT_APP_PASSWORD=<PASSWORD>
```

4. Start the bot process
```
npm install -g nodemon
nodemon app.js
```

5. Download and run Ngrok: https://ngrok.com/download
```
ngrok http 5000
```

6. Download Bot Emulator and connect: https://github.com/Microsoft/BotFramework-Emulator/releases

7. Test that the bot replies


## Setting up Skype and Facebook

Connect to Messenger: https://docs.microsoft.com/en-us/bot-framework/channel-connect-facebook<br />
Facebook Page: https://www.facebook.com/pg/Car-Service-Bot-353467028405680<br />
Page ID: 353467028405680<br />
Create new Facebook Application: https://developers.facebook.com/apps


## Making use of NLU (Api.ai)

1. Log in https://console.api.ai/

2. Create a new Agent for your bot

3. Train the agent with the provided Entities and Intent Data - api.ai/entities & api.ai/intents

4. Test it in the console GUI and look at the payload format

5. Install the Api.ai SDK for node
```
npm install --save apiai
```

6. Export the Api.ai agent access key
```
export APIAI_ACCESS=<ACCESS_KEY>
```

Use snippets: *bot_apiai_utils* & *bot_nlu*


## Introduce simple dialogs

Use snippet: *bot_dialog*


## Call the backend and show some results

```
npm install --save isomorphic-fetch
```

Use snippet: *bot_reply_with_venues*, *bot_venues_cards* & *bot_backend*


## Facebook 'Send Location' quick reply

Use snippet: *bot_send_location*
