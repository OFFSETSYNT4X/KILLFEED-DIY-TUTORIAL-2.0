/* DayZero KillFeed (DZK) DIY Project 2.0
Copyright (c) 2023 TheCodeGang LLC.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>. */

require('dotenv').config();
var fs = require('fs');
if (!fs.existsSync("./logs/log.ADM")) {fs.writeFileSync("./logs/log.ADM", "");}
if (!fs.existsSync("./logs/serverlog.ADM")) {fs.writeFileSync("./logs/serverlog.ADM", "");}
const { Client, Collection, Intents, MessageAttachment, MessageEmbed } = require('discord.js');
const { GUILDID, PLATFORM, TOKEN } = require('./config.json');
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });//, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, partials: ["MESSAGE", "CHANNEL", "REACTION"] });const nodeoutlook = require('nodejs-nodemailer-outlook');
const { isNull } = require('util');
const path = require('path');
var moment = require('moment-timezone');
var servCheck = GUILDID;


//SETUP SLASH COMMAND HANDLER
bot.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	bot.commands.set(command.data.name, command);
}

bot.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = bot.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

//MESSAGE COMMAND HANDLER
bot.on('messageCreate', async message => {
	if (!message.guild && !message.author && !message.member) return;
	if (message.author.bot) return; // This closes the rest of the script if the bot sends the message....don't allow Bot to give commands (yet)
	const guildId = message.guild.id
	if (servCheck != guildId) return;
	var adminRole = message.guild.roles.cache.find(r => r.name === 'Admin'), everyoneRole = message.guild.roles.everyone;
	var adminRoleId = adminRole.id, everyoneRoleId = everyoneRole.id;
});

//Login Discord Bot
bot.login(TOKEN)
.catch(function (error) {
    console.log(error);
})

bot.on('ready', () => {
	console.info(`Logged in as ${bot.user.tag}!`);
	console.log('KILLFEED IS ACTIVE!');
});

bot.on('error', function (err) {
    console.log(err)
});