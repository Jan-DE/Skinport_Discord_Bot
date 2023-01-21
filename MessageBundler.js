const MAX_EMBEDS = 10;

class MessageBundler {
	constructor(discordBot, channelId) {
		this.discordBot = discordBot;
		this.channelId = channelId;
		
		this.embeds = [];
		this.interval = null;
		this.start();
	}
	
	sendCollection() {
		if (this.embeds.length === 0) return;
		
		const collection = this.embeds.splice(0, Math.min(MAX_EMBEDS, this.embeds.length));
		
		this.discordBot.sendEmbeds(this.channelId, collection);
	}
	
	start() {
		this.interval = setInterval(() => {
			this.sendCollection();
		}, 500);
	}
	
	reset() {
		clearInterval(this.interval);
		this.start();
	}
	
	collect(embed) {
		this.embeds.push(embed);
		
		if (this.embeds.length === MAX_EMBEDS) {
			this.reset();
			this.sendCollection();
		}
	}
}

module.exports = MessageBundler;