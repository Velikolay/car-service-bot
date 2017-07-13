const restify = require('restify');
const builder = require('botbuilder');
const apiai = require('apiai')(process.env.APIAI_ACCESS);
const apiaiUtils = require('./apiaiUtils');
const backend = require('./backend');

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 5000, () => {
  console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
const connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD,
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
const bot = new builder.UniversalBot(connector, (session) => {
  session.sendTyping();
  apiai.textRequest(session.message.text, {
    sessionId: 42,
  })
  .on('response', (response) => {
    const intentName = apiaiUtils.getIntentName(response);
    if (intentName === 'FindFillingStation') {
      session.beginDialog('filling_station', response);
    } else if (intentName === 'FindCarRepair') {
      session.beginDialog('car_repair', response);
    } else {
      session.send('Hey, I can help you find filling stations or car repair service');
    }
  })
  .on('error', (error) => {
    console.log(error);
    session.send('Sorry I\'m some sort of trouble, could you please repeat?');
  })
  .end();
});


function buildVenueCard(name, address, distance, imageUrl, infoPageUrl, lon, lat) {
  return new builder.HeroCard()
    .title(`${name} - ${parseFloat(distance).toFixed(1)}km away`)
    .text(address)
    .images([
      builder.CardImage.create(null, encodeURI(imageUrl)),
    ])
    .buttons([
      builder.CardAction.openUrl(null, encodeURI(`https://maps.google.com/?q=${lat},${lon}`), 'See on Map'),
      builder.CardAction.openUrl(null, encodeURI(infoPageUrl), 'Info Page'),
    ]);
}

function buildVenuesMessage(venues) {
  const venuesCarousel = venues.slice(0, 7).map((el) => {
    return buildVenueCard(
      el.VenueBrandName || el.VenueName,
      el.VenueAddress,
      el.distance,
      el.photos[0],
      el.url,
      el.VenueLongitude,
      el.VenueLatitude);
  });

  return new builder.Message()
    .attachments(venuesCarousel)
    .attachmentLayout('carousel');
}

function replyWithVenues(session, venueType, filterKeyword) {
  session.sendTyping();
  backend.callVenuesBackend(
    venueType,
    session.dialogData.location,
    filterKeyword)
  .then(response => response.json())
  .then((json) => {
    session.send(buildVenuesMessage(json));
    session.send('I\'ll be around if you need me again');
    session.endDialog();
  })
  .catch((error) => {
    console.log(error);
    session.send('Something went wrong, please try again');
    session.endDialog();
  });
}

bot.dialog('car_repair', [
  (session, args) => {
    session.dialogData.car_brand = apiaiUtils.getCarBrand(args);
    session.beginDialog('send_location', {
      prompt: `OK, i'll look for ${session.dialogData.car_brand} car repair, just tell me your location`,
    });
  },
  (session, results) => {
    if (results.response) {
      session.dialogData.location = results.response;
      session.send(
        'Looking for %s car repair service near \'%s\'',
        session.dialogData.car_brand,
        session.dialogData.location);
      session.sendTyping();
      replyWithVenues(
        session,
        backend.VENUE_CATEGORY_REPAIR_SHOP,
        session.dialogData.car_brand);
    }
  },
]);

bot.dialog('filling_station', [
  (session, args) => {
    session.dialogData.filling_station = apiaiUtils.getFillingStation(args);
    session.beginDialog('send_location', {
      prompt: `OK, i'll look for ${session.dialogData.filling_station} filling station, just tell me your location`,
    });
  },
  (session, results) => {
    if (results.response) {
      session.dialogData.location = results.response;
      session.sendTyping();
      replyWithVenues(
        session,
        backend.VENUE_CATEGORY_FILLING_STATION,
        session.dialogData.filling_station);
    }
  },
]);

function promptLocation(session, text) {
  const promptMessage = new builder.Message(session).text(text);
  promptMessage.sourceEvent({
    facebook: {
      quick_replies: [{
        content_type: 'location',
      }],
    },
  });
  return session.send(promptMessage);
}

function createLocationDialog(options) {
  const locDialog = new builder.IntentDialog(options)
  .matches(/^reset$/i, (session) => {
    session.endDialogWithResult({ response: { reset: true } });
  });

  locDialog.onBegin((session, args) => {
    session.dialogData.args = args;
    promptLocation(session, session.dialogData.args.prompt).sendBatch();
  }).onDefault((session) => {
    const entities = session.message.entities;
    console.log(entities);
    if (entities.length > 0 && entities[0].type === 'Place') {
      session.endDialogWithResult({
        response: [
          entities[0].geo.latitude,
          entities[0].geo.longitude,
        ],
      });
    } else {
      session.endDialogWithResult({
        response: session.message.text,
      });
    }
  });

  return locDialog;
}

bot.dialog('send_location', createLocationDialog());
