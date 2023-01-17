const { Client, GatewayIntentBits, EmbedBuilder, Embed, ActivityType } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const StringBuilder = require('string-builder');
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
		if (stickers.length == 1) {
			return stickers[0].name;
		} else {
			const sb = new StringBuilder();
			
			const stickerMap = {};
			
			stickers.forEach(sticker => {
				const val = stickerMap[sticker.name];
				stickerMap[sticker.name] = val ? val + 1 : 1;
			});
			
			const sortedStickerMap = Object.entries(stickerMap).sort((a, b) => b[1] - a[1]);
			
			sortedStickerMap.forEach(([key, value]) => {
				if (value > 1) {
					sb.append(value + 'x ');
				}
				
				sb.append(key);
				sb.append('\n');
			});
			
			return sb.toString();
		}
	}
	
	handleListings(listings) {
		listings.forEach(offer => {
			const price = offer.salePrice / 100.0;
			const sugPrice = offer.suggestedPrice / 100.0;
			
			if (sugPrice < 10) return;
			
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
					{name: 'Pattern',  value: offer.pattern.toString(), inline: true},
					{name: 'Finish',  value: offer.finish.toString(), inline: true}
				]);
			}
			
			if (offer.stickers.length != 0) {
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