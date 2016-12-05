'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')
const Twitter = require('twitter');

// use `PORT` env var on Beep Boop - default to 3000 locally
var port = process.env.PORT || 3000

var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
})


//*********************************************
// Setup different handlers for messages
//*********************************************


slapp.event('message', (msg) => {
  if( msg.body.event.subtype === 'channel_join' && msg.body.event.user === msg.body.authed_users[0]) {
    msg.say('hoi zäme, ich bin der Velokontrolle-Bot und werde nun auf Twitter nach Hinweisen für Velokontrollen Ausschau halten.')
    client.stream('statuses/filter', {track: 'velokontrolle'},  function(stream) {
      stream.on('data', function(tweet) {
        msg.say({
          text: '<!here> Ich habe gerade diesen Tweet entdeckt: ' + ' https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str
        });
        alarm(msg)
      });
      stream.on('error', function(error) {
        console.log(error);
      });
    });
  } else if(msg.body.event.text === 'Alarm') {
    msg.say({
      text: 'hani Alarm ghört?'
    });
    alarm(msg);
  }
})

slapp.action('alarm_callback', 'alarm', (msg, value) => {
  console.log('value', value)
  if(value === 'alarm') {
    msg.respond(msg.body.response_url, {
      text: `Alarm wurde ausgelöst von <@${msg.body.user.id}>`,
      delete_original: true
    })
    msg.say(`<!channel> ALARM!`)
  } else if(value === 'noalarm') {
    msg.respond(msg.body.response_url, {
      text: `von <@${msg.body.user.id}> als Fehlalarm eingestuft`,
      delete_original: true
    })
  }
})


function alarm(msg) {
  msg.say({
    text: 'Soll ein Velokontrolle-Alarm ausgelöst werden?',
    attachments: [
      {
        text: '',
        fallback: 'Ja oder Nein?',
        callback_id: 'alarm_callback',
        actions: [
          {
            name: 'alarm',
            text: 'Ja, Alarm!',
            type: 'button',
            style: 'danger',
            confirm: {
              title: 'Bist du sicher?',
              text: 'Bei einem Alarm werden alle Channel Benutzer benachrichtigt',
              ok_text: 'Ja, Alarm!',
              dismiss_text: 'Nein'
            },
            value: 'alarm'
          },
          {
            name: 'alarm',
            text: 'Nein, Fehlalarm',
            type: 'button',
            value: 'noalarm'
          }
        ]
      }]
  })
}

// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err)
  }
})


var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});


/**
 * Stream statuses filtered by keyword
 * number of tweets per second depends on topic popularity
 **/
client.stream('statuses/filter', {track: 'velokontrolle'},  function(stream) {
  stream.on('data', function(tweet) {
    console.log(tweet.text);
    console.log(tweet);
    //bot.say(
      //{
        //text: 'Tweet: ' + tweet.text + ' http://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str,
        //channel: 'velokontrolle-bot' // a valid slack channel, group, mpim, or im ID
      //}
    //);
  });
  stream.on('error', function(error) {
    console.log(error);
  });
});
