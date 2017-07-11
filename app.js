const restify = require('restify');
const builder = require('botbuilder');
const apiai = require('apiai');
const backend = require('./venues_backend.js');
const apiaiUtils = require('./apiai_utils.js');
const format = require('util').format;

const nlu = apiai(process.env.APIAI_ACCESS);
// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 5000, function () {
    console.log('%s listening to %s', server.name, server.url);
});
// Create chat connector for communicating with the Bot Framework Service
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
// Listen for messages from users
server.post('/api/messages', connector.listen());
// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
const bot = new builder.UniversalBot(connector, function (session) {
    session.sendTyping();
    nlu.textRequest(session.message.text, {
        sessionId: 432142,
    })
    .on('response', function(response) {
        const intentName = apiaiUtils.getIntentName(response);
        if (intentName === 'FindFillingStation') {
            session.beginDialog('filling_station', response);
        } else if (intentName === 'FindCarRepair') {
            session.beginDialog('car_repair', response);
        } else {
            session.send('Sorry I couldn\'t get that, I can help you with finding filling stations or car repair service');
        }
    })
    .on('error', function(error) {
        console.log(error);
        session.send('Sorry I\'m some sort of trouble, could you please repeat?');
    })
    .end();
});

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });

bot.dialog('car_repair', [
    function (session, args) {
        session.dialogData.car_brand = apiaiUtils.getCarBrand(args)
        session.beginDialog('get_location_dialog', {
            prompt: `OK, i\'ll look for ${session.dialogData.car_brand} car service, just tell me your location`
        });
    },
    function (session, results, next) {
        console.log(results.response);
        if (results.response) {
            session.dialogData.location = results.response;
            replyWithVenues(session, backend.VENUE_CATEGORY_REPAIR_SHOP);
        }
    },
]);

bot.dialog('filling_station', [
    function (session, args) {
        session.dialogData.station_filter = apiaiUtils.getFillingStation(args);
        session.beginDialog('get_location_dialog', {
            prompt: `OK, i\'ll look for ${session.dialogData.station_filter} station, just tell me your location`
        });
    },
    function (session, results, next) {
        console.log(results.response);
        if (results.response) {
            session.dialogData.location = results.response;
            replyWithVenues(session, backend.VENUE_CATEGORY_FILLING_STATION);
        }
    },
]);

function promptLocation(session, text) {
    const promptMessage = new builder.Message(session).text(text);
    promptMessage.sourceEvent({
        facebook: {
            quick_replies: [{
                content_type: 'location'
            }]
        }
    });
    return session.send(promptMessage);
}

function createLocationDialog(options) {
    const locDialog = new builder.IntentDialog(options)
    .matches(/^reset$/i, function (session) {
        session.endDialogWithResult({ response: { reset: true } });
    });

    locDialog.onBegin(function (session, args) {
        session.dialogData.args = args;
        promptLocation(session, session.dialogData.args.prompt).sendBatch();
    }).onDefault(function (session) {
        var entities = session.message.entities;
        console.log(entities);
        if (entities.length > 0 && entities[0].type === "Place") {
            session.endDialogWithResult({
                response: [
                    entities[0].geo.latitude,
                    entities[0].geo.longitude
                ]
            });
        } else {
            session.endDialogWithResult({
                response: session.message.text
            });
        }
    });

    return locDialog;
}

bot.dialog('get_location_dialog', createLocationDialog());

function replyWithVenues(session, venueType) {
    session.sendTyping();
    backend.callVenuesBackend(
        venueType,
        session.dialogData.location,
        session.dialogData.station_filter
    )
    .then(response => response.json())
    .then((json) => {
        session.send(buildVenuesMessage(json));
        session.endDialog();
    })
    .catch((error) => {
        console.log(error);
        session.send('Something went wrong, please try again');
        session.endDialog();
    });
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
            el.VenueLatitude
        );
    });

    return new builder.Message()
        .attachments(venuesCarousel)
        .attachmentLayout('carousel');
}

function buildVenueCard(name, address, distance, imageUrl, infoPageUrl, lon, lat) {
    return new builder.HeroCard()
        .title(`${name} - ${parseFloat(distance).toFixed(1)}km away`)
        .text(address)
        .images([
            builder.CardImage.create(null, encodeURI(imageUrl))
        ])
        .buttons([
            builder.CardAction.openUrl(null, encodeURI(`http://maps.google.com/?q=${lat},${lon}`), "See on Map"),
            builder.CardAction.openUrl(null, encodeURI(infoPageUrl), "Info Page"),
        ]);
}
