const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const numberFormatter = new Intl.NumberFormat('en-US');
const MessageBundler = require('./MessageBundler');

class DiscordBot {
	constructor(token) {
		this.token = token;
		
		this.messageBundler = new MessageBundler(this, '1064482479194509332');
	}
	
	log(message) {
		console.log('[Discord-Bot] ' + message);
	}
	
	start() {
		client.once('ready', () => {
			this.log('Ready and running.');
  
			client.user.setPresence({
				status: 'online',
				activities: [{ name: 'Skinport Sale Feed', type: ActivityType.Watching }]
			});
		});

		client.on('error', error => {
			this.log('Error: ' + error.code);
		});

		client.on('disconnect', message => {
			this.log('Disconnected.');
  
			client.login(this.token);
		});

		this.log('Logging in...');
		client.login(this.token).then(() => {
			this.log('Logged in.');
		});
	}
	
	formatStickers(stickers) {
		if (stickers.length === 1) {
			return stickers[0].name;
		}

		let str = '';
		
		const stickerCount = {};
		
		stickers.forEach(sticker => {
			const count = stickerCount[sticker.name];
			stickerCount[sticker.name] = count ? count + 1 : 1;
		});
		
		const sortedStickerCount = Object.entries(stickerCount).sort((a, b) => b[1] - a[1]);
		
		sortedStickerCount.forEach(([key, value]) => {
			if (value > 1) {
				str += value + 'x ';
			}
			
			str += key + '\n';
		});
		
		return str;
	}
	
	handleListings(listings) {
		listings.forEach(offer => {
			const price = offer.salePrice / 100.0;
			const sugPrice = offer.suggestedPrice / 100.0;
			
			if (price < 10) return;
			
			//console.log(offer);
			
			const discounted = price < sugPrice;
			
			const embedMsg = new EmbedBuilder()
				.setTitle(offer.marketName)
				.setDescription('Listed for ***$' + numberFormatter.format(price) + '***')
				.setURL('https://skinport.com/item/' + offer.url + '/' + offer.saleId)
				.setThumbnail('https://community.cloudflare.steamstatic.com/economy/image/' + offer.image)
				.setImage('https://s.skinport.com/' + offer.assetId + '.jpg')
				.setColor(offer.rarityColor)
				.addFields([
					{name: 'Suggested Price',  value: '$' + numberFormatter.format(sugPrice), inline: true},
					{name: discounted ? 'Discount' : 'Premium',  value: '*≈' + Math.round(discounted ? (1 - (price / sugPrice)) * 100 : ((price / sugPrice) - 1) * 100) + '%*', inline: true},
					{name: 'Tradeable',  value: offer.lock ? '<t:' + (Date.parse(offer.lock) / 1000) + ':R>' : '✓', inline: true}
				])
				.setTimestamp();
				
			if (offer.wear) { //Gun, Knife or Gloves
				embedMsg.addFields([
					{name: 'Float',  value: offer.wear.toFixed(8).toString(), inline: true},
					{name: 'Pattern',  value: offer.pattern ? offer.pattern.toString() : '-', inline: true},
					{name: 'Finish',  value: offer.finish ? offer.finish.toString() : '-', inline: true}
				]);
			}
			
			if (offer.stickers.length !== 0) {
				embedMsg.addFields([{name: 'Stickers', value: this.formatStickers(offer.stickers), inline: false}]);
			}
				
			this.messageBundler.collect(embedMsg);
		});
	}
	
	sendEmbeds(channelId, msgEmbeds) {
		const channel = client.channels.cache.get(channelId);
		
		if (channel) {
			channel.send({ embeds: msgEmbeds });
		}
	}
}

module.exports = DiscordBot;