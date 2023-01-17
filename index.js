const fs = require('fs');
const DiscordBot = require('./DiscordBot');
const { io } = require("socket.io-client");

//Read bot token from "discord_token" file
let discordToken;
try {
	discordToken = fs.readFileSync('discord_token', 'utf8');
} catch (error) {
	console.log('Failed to read bot-token from file \"discord_token\".');
	process.exit(-1);
}

const bot = new DiscordBot(discordToken);
bot.start();

const socket = io('https://skinport.com', {
  transports: ['websocket'],
});

// Add a connect listener
socket.on('connect', function (socket) {
    console.log('Connected to Skinport.');
	joinSaleFeed();
});

// Listen to the Sale Feed
socket.on('saleFeed', (res) => {
  try {
	switch (res.eventType) {
		case 'listed':
			bot.handleListings(res.sales);
			break;
		default:
			console.log('UNHANDLED: ' + res.eventType)
			break;
	}
  } catch (error) {
	  console.log(error);
  }
});

function joinSaleFeed() {
	console.log('Joining sale feed...')
	socket.emit('saleFeedJoin', {currency: 'USD', locale: 'en', appid: 730})
}