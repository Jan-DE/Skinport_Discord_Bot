const fs = require('fs');
const DiscordBot = require('./DiscordBot');
const { io } = require("socket.io-client"); //https://socket.io/docs/v4/client-api/

//Read bot token from "discord_token" file
let discordToken;
try {
	discordToken = fs.readFileSync('discord_token', 'utf8');
} catch (error) {
	console.log('Failed to read bot-token from file \"discord_token\".');
	process.exit(-1);
}

//Start Discordbot
const bot = new DiscordBot(discordToken);
bot.start();

//Initialize ws client
const socket = io('https://skinport.com', {
  transports: ['websocket'],
});

//Add a connect listener
socket.on('connect', () => {
    console.log('Connected to Skinport.');
	
	joinSaleFeed();
});

//Add a disconnect listener
socket.on("disconnect", (reason) => {
	console.log(`Disconnected from Skinport (Reason: ${reason}).`);

	if (reason === "io server disconnect") { //disconnect was initiated by the server
	  socket.connect(); //reconnect manually
	} //otherwise the socket will automatically reconnect
  });

//Add a reconnect listener
socket.on("reconnect", (attempt) => {
	console.log(`Reconnected to Skinport after ${attempt} attempt(s).`);
	joinSaleFeed();
});

//Add a reconnect_attempt listener
socket.on("reconnect_attempt", (attempt) => {
	console.log(`Attempting to reconnect to Skinport (Attempt: ${attempt}).`);
});

//Join Sale Feed
function joinSaleFeed() {
	console.log('Joining sale feed...');
	socket.emit('saleFeedJoin', {currency: 'USD', locale: 'en', appid: 730}); //730 = CSGO's App ID on Steam
}

// Listen to the Sale Feed
socket.on('saleFeed', (res) => {
  try {
	if (res.eventType === 'listed') {
		bot.handleListings(res.sales);
	} else { //this should never happen
		console.log(`Unhandled eventType: ${res.eventType}`);
	}
  } catch (error) {
	  console.log(error);
  }
});