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
const { SlashCommandBuilder } = require('@discordjs/builders');
const { hyperlink } = require('@discordjs/builders');
const fs = require('fs');
const ini = require('ini');
var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
const { Client, GatewayIntentBits, EmbedBuilder, ChatInputCommandInteraction, AttachmentBuilder, ChannelType, channelMention } = require('discord.js');
const {  GUILDID, PLATFORM, ID1, ID2, NITRATOKEN, REGION  } = require('../config.json');
const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers] });//, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, partials: ["MESSAGE", "CHANNEL", "REACTION"] });const nodeoutlook = require('nodejs-nodemailer-outlook');
const axios = require('axios');
const path = require('path');
const Tail = require('tail').Tail;
const logFile = "./logs/log.ADM";
const options= {separator: /[\r]{0,1}\n/, fromBeginning: false, useWatchFile: true, flushAtEOF: true, fsWatchOptions: {}, follow: true, nLines: false, logger: console}
const tail = new Tail(logFile, options);
var logStats = 0, logBytes = 0, logSize = 0, logSizeRef = 0, lineCount = 0, lineRef = 0, dt0 = 0, valueRef = new Set();
var colors = require('colors');
var moment = require('moment-timezone');
var iso;
var linkLoc = " ", kfChannel = " ";
var logDt = " ", dt = new Date(), todayRef = " ", today = " ";
var feedStart = Boolean;
var readline = require('readline');

var phrase1 = ">) killed by ", phrase2 = "AdminLog started on ", phrase3 = "from",  phrase4 = ">) bled out",  phrase5 = ">) committed suicide", phrase6 = "[HP: 0] hit by FallDamage", phrase7 = "committed suicide";
nextDay = false, feedStart = false;

if (parseInt(config.mapLoc) === 1) {
	linkLoc = "https://www.izurvive.com/livonia/#location="; //LIVONIA
}
if (parseInt(config.mapLoc) === 0) {
	linkLoc = "https://www.izurvive.com/#location="; //CHERNARUS
};

module.exports = {
	data: new SlashCommandBuilder()
	.setName('admin')
	.setDescription('Contains all Admin Killfeed commands')
	.setDefaultMemberPermissions("0")
	.addSubcommandGroup(subcommand =>
		subcommand
		.setName('killfeed')
		.setDescription('Admin Killfeed Commands')
		.addSubcommand(subcommand =>
			subcommand
			.setName('stop')
			.setDescription('Kill Project')
		)
		.addSubcommand(subcommand =>
			subcommand
			.setName('deathloc')
			.setDescription('Toggle on display of death locations in Killfeed notifications')
			.setDescription('Toggle death location On/Off')
			.addStringOption(option =>
				option.setName('state')
				.setDescription('Select desired Alarm state')
				.setRequired(true)
				.addChoices(
					{ name: 'OFF', value: 'off' },
					{ name: 'ON', value: 'on' },
				)
			)
		)
		.addSubcommand(subcommand =>
			subcommand
			.setName('start')
			.setDescription('Start Killfeed')
		)
		.addSubcommand(subcommand =>
			subcommand.setName('clear')
			.setDescription('Clear channel messages (limit 100)')
			.addIntegerOption(option => option.setName('value').setDescription('Enter new value').setRequired(true))
		)
		.addSubcommand(subcommand =>
			subcommand.setName('map')
			.setDescription('Toggle Killfeed Mission Map')
		)
		.addSubcommand(subcommand =>
			subcommand.setName('setup')
			.setDescription('Set up Discord channels required by Killfeed')
			.addBooleanOption(option => option.setName('category').setDescription('Would you like your killfeed channel be inside a category').setRequired(true))
			.addStringOption(option => option.setName('categoryname').setDescription('create a category name for your Killfeed Channel to be in').setRequired(false))
		)
	),
	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
	 * @returns 
	 */
	async execute(interaction) {
		const subCo = interaction.options.getSubcommand();
		const { guildId, options } = interaction;
		config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
		
		//Admin Commands
		if (subCo === "clear") {
			if(guildId) {
				if (guildId != GUILDID) return;
				const integer = interaction.options.getInteger('value');
				if (integer > 100) return interaction.reply({ content: 'The max number of messages you can delete is 100', ephemeral: true }).catch((error) => { console.log(error); });
				interaction.channel.bulkDelete(integer).catch((error) => { console.error(error); });

				interaction.reply({ content: 'clearing messages...', ephemeral: true }).catch((error) => { console.error(error); });
				interaction.deleteReply().catch((error) => { console.error(error); });
			}
		}
		if (subCo === "map") {
			if(guildId) {
				if (guildId != GUILDID) return;
				if (parseInt(config.mapLoc) === 1) {
					config.mapLoc = 0;
					fs.writeFileSync('./config.ini', ini.stringify(config, { mapLoc: `0`}))
					interaction.reply({ content: "Killfeed Map set to **Chernaus**" }).catch((error) => { console.error(error); });
					return;
				}
				if (parseInt(config.mapLoc) === 0) {
					config.mapLoc = 1;
					fs.writeFileSync('./config.ini', ini.stringify(config, { mapLoc: `1`}))
					interaction.reply({ content: "Killfeed Map set to **Livonia**", ephemeral: true }).catch((error) => { console.error(error); });
					return;
				}
			}
		}
		if (subCo === "setup") {
			if (guildId) {
				const category = options.getBoolean('category');
				const CategoryName = options.getString('categoryname');
				const ChannelName = options.getString('channelname');

				if (guildId != GUILDID) return;
				kfChannel = interaction.guild.channels.cache.find(channel => channel.name.includes("➖》💀-killfeed"));
				const botID = interaction.guild.roles.cache.get('959693430227894301');
				if (kfChannel == null) {
					let categoryid; // Variable declared here
					if (category !== false) {
						// create a category channel for the killfeed to be created in
						categoryid = await interaction.guild.channels.create({
							type: ChannelType.GuildCategory,
							name: CategoryName,
							reason: 'killfeed category for the dayz killfeed',
							permissionOverwrites: [
							{ // Set permission overwrites on category
								id: interaction.guild.roles.everyone,
								allow: ['ViewChannel', 'ReadMessageHistory'],
								deny: ['Administrator', 'SendMessages', 'CreatePublicThreads', 'CreatePrivateThreads']
							},
							{
								id: botID,
								allow: ['ManageChannels'],
							}
						]
						});
					}
					// Create a channel (text channel) with optional parent category
					const tbd = await interaction.guild.channels.create({
						parent: categoryid?.id ?? undefined, // categoryid is used here
						name: '➖》💀-killfeed',
						reason: 'killfeed channel for dayz'
					})
					.catch((error) => { console.error(error); });

					await interaction.reply({ content: `Killfeed Channel Created Successfully! ${channelMention(tbd.id)}}`, ephemeral: true })
					.catch((error) => { console.error(error); });
				} else {
					await interaction.reply({ content: "Skipped Creating Killfeed Channel!", ephemeral: true })
					.catch((error) => { console.error(error); });
					console.log(`${kfChannel}`);
				}
				return;
			}
		}
		if (subCo === "stop") {
			if(guildId) {
				if (guildId != GUILDID) return;
				if (feedStart != true) return interaction.reply({ content: 'THE KILLFEED IS NOT CURRENTLY RUNNING!.....', ephemeral: true })
				.catch((error) => { console.error(error); });
				interaction.reply({ content: "Terminating Project.....)", ephemeral: true })
				.catch((error) => { console.error(error); });
				setTimeout((() => { return process.exit(22); }), 5000);
			}
		}
		if (subCo === "deathloc") {
			if(guildId) {
				if (guildId != GUILDID) return;
				const choice = interaction.options.getString('state')
				if (feedStart != true) return interaction.reply({ content: 'THE KILLFEED IS NOT CURRENTLY RUNNING!.....', ephemeral: true })
				.catch((error) => { console.error(error); });
				if(choice === "on") {
					config.showLoc = 1;
					fs.writeFileSync('./config.ini', ini.stringify(config, { showLoc: `1`}))
					interaction.reply({ content: "Death Locations **Enabled!**", ephemeral: true })
					.catch((error) => { console.log(error); });
					return;
				}else{
					if(choice === "off"){
						config.showLoc = 0;
						fs.writeFileSync('./config.ini', ini.stringify(config, { showLoc: `0`}))
						interaction.reply({ content: "Death Locations **Disabled!**", ephemeral: true })
						.catch((error) => { console.error(error); });
						return;
					}
				}
			}
		}
		if (subCo === "start") {
			if(guildId) {
				if (guildId != GUILDID) return;
				kfChannel = interaction.guild.channels.cache.find(channel => channel.name.includes("➖》💀-killfeed"));
				const kfChannel1 = kfChannel.id;

				if (feedStart === true) return interaction.reply({ content: 'THE KILLFEED IS ALREADY RUNNING!.....TRY RESETING IF YOU NEED TO RESTART', ephemeral: true })
				.catch((error) => { console.error(error); });
				console.log("...working");
				interaction.reply({ content: "**Starting Killfeed....**", ephemeral: true })
				.catch((error) => { console.error(error); });
				feedStart = true;
				getDetails().catch((error) => { console.error(error); });
				async function getDetails() {
					tail.on("line", (line) => {
						lineCount += 1
						lineRef = lineCount

						if (line.includes(phrase2, 0)) {
							logDt = line.slice(20, 30);
							console.log(`This is the logDate: ${logDt}`);
							console.log(`This is the current date: ${todayRef}`);
						}
						
						if (line.includes(phrase1, 0) || line.includes(phrase4, 0) || line.includes(phrase5, 0) || line.includes(phrase6, 0) || line.includes(phrase7, 0)) {
							let vRef = line;
							if (valueRef.has(`${vRef}`)) {
								return;
							}else {
								valueRef.add(vRef);
								iso = line.split(/[|"'<>()]/);
								// console.log(iso);
								if(iso) {
									//Handle Killfeed Data
									let methodVal = iso[iso.length - 1];
									
									if (iso[15]){
										//Check for range of kill in message
										if (methodVal.includes(phrase3)) {
											var f4 = methodVal.split(" ");
											var f5 = iso[7].toString();
											var f6 = iso[13].toString();
											let vLoc = f5.split(/[|" "<(),>]/), x1 = vLoc[0], y1 = vLoc[2], z1 = vLoc[4];
											let kLoc = f6.split(/[|" "<(),>]/), x2 = kLoc[0], y2 = kLoc[2], z2 = kLoc[4];
											var Vloc = x1.concat(`;${y1};${z1}`);
											var Kloc = x2.concat(";",y2,";",z2);
											var f0 = iso[0].toString();
											var f1 = iso[10].toString();
											var f2 = iso[2].toString();
											var f3 = methodVal;
											dt0 = Date.now();
											//Send Killfeed Notifications
											if (config.showLoc === 1) {
												const url = "https://thecodegang.com"
												const link = hyperlink("Sign-up for DayZero", url)
												const attachment = new AttachmentBuilder('./images/crown.png');
												const embed = new EmbedBuilder()
												.setColor('Red')
												.setTitle(`Killfeed Notification`)
												.setThumbnail('attachment://crown.png')
												.setDescription(`${f0} **${f1}** Killed **${f2}** ${f3} `)
												.addFields([
													{ 
														name: '🌐', 
														value: `${linkLoc+Vloc}` 
													},
													{
														name: 'Get Your Free Killfeed!',
														value: `${link}`
													} 
												]);
												interaction.guild.channels.cache.get(kfChannel1).send({ embeds: [embed], files: [attachment] })
												.catch((error) => { console.error(error); });
											}else {
												const url = "https://thecodegang.com"
												const link = hyperlink("Sign-up for DayZero", url)
												const attachment = new AttachmentBuilder('./images/crown.png');
												const embed = new EmbedBuilder()
												.setColor('Red')
												.setTitle(`Killfeed Notification`)
												.setThumbnail('attachment://crown.png')
												.setDescription(`${f0} **${f1}** Killed **${f2}** ${f3} `)
												.addFields({ name: 'Get Your Free Killfeed!', value: `${link}`})
												interaction.guild.channels.cache.get(kfChannel1).send({embeds: [embed], files: [attachment]})
												.catch((error) => { console.error(error); });
											}
										}else {
											var f5 = iso[7].toString();
											var f6 = iso[13].toString();
											let vLoc = f5.split(/[|" "<(),>]/), x1 = vLoc[0], y1 = vLoc[2], z1 = vLoc[4];
											let kLoc = f6.split(/[|" "<(),>]/), x2 = kLoc[0], y2 = kLoc[2], z2 = kLoc[4];
											var Vloc = x1.concat(`;${y1};${z1}`);
											var Kloc = x2.concat(";",y2,";",z2);
											var f0 = iso[0].toString();
											var f1 = iso[10].toString();
											var f2 = iso[2].toString();
											var f3 = methodVal;
											dt0 = Date.now();
											//Send Killfeed Notifications To Discord
											if (config.showLoc === 1) {
												const url = "https://thecodegang.com"
												const link = hyperlink("Sign-up for DayZero", url)
												const attachment = new AttachmentBuilder('./images/crown.png');
												const embed = new EmbedBuilder()
												.setColor('Red')
												.setTitle(`Killfeed Notification`)
												.setThumbnail('attachment://crown.png')
												.setDescription(`${f0} **${f1}** Killed **${f2}** ${f3} `)
												.addFields([
													{ name: '🌐', value: `${linkLoc+Vloc}` },
													{ name: 'Get Your Free Killfeed!', value: `${link}` }
												]);
												interaction.guild.channels.cache.get(kfChannel1).send({embeds: [embed], files: [attachment]})
												.catch((error) => { console.error(error); });
											}else {
												const url = "https://thecodegang.com"
												const link = hyperlink("Sign-up for DayZero", url)
												const attachment = new AttachmentBuilder('./images/crown.png');
												const embed = new EmbedBuilder()
												.setColor('Red')
												.setTitle(`Killfeed Notification`)
												.setThumbnail('attachment://crown.png')
												.setDescription(`${f0} **${f1}** Killed **${f2}** ${f3} `)
												.addFields([{ name: 'Get Your Free Killfeed!', value: `${link}`}])
												interaction.guild.channels.cache.get(kfChannel1).send({ embeds: [embed], files: [attachment] })
												.catch((error) => { console.log(error); });
											}
										}
									}else if (iso[13] && !iso[15]) {
										var f0 = iso[0].toString();
										var f1 = iso[8].toString();
										var f2 = iso[2].toString();
										var f3 = methodVal;
										dt0 = Date.now();
										////Player Vs NPC Kill
										// const attachment = ('./images/crown.png');
										// const embed = new EmbedBuilder()
										// .setColor('Red')
										// .setTitle(`Killfeed Notification`)
										// .setThumbnail('attachment://crown.png')
										// .setDescription(`${f0} **${f1}** Killed **${f2}** ${f3} `)
										// interaction.guild.channels.cache.get(kfChannel1).send({embeds: [embed], files: [`${attachment}`]})
										// .catch(function (error) {
										// 	console.log(error);
										// });
										console.log(`Kill Time-Stamp: ${dt} NPC KILL`);
									}else if (iso[9] && iso[9].includes("bled out")) {
										var f0 = iso[0].toString();
										var f1 = iso[2].toString();
										var f2 = iso[9].toString();
										dt0 = Date.now();
										//Send Killfeed Notification to Discord
										const url = "https://thecodegang.com"
										const link = hyperlink("Sign-up for DayZero", url)
										const attachment = new AttachmentBuilder('./images/crown.png');
										const embed = new EmbedBuilder()
										.setColor('Red')
										.setTitle(`Killfeed Notification`)
										.setThumbnail('attachment://crown.png')
										.setDescription(`${f0} **${f1}** ${f2}`)
										.addFields([{ name: 'Get Your Free Killfeed!', value: `${link}`}]);
										interaction.guild.channels.cache.get(kfChannel1).send({ embeds: [embed], files: [attachment] })
										.catch((error) => { console.error(error); });
									}else if (iso[9] && iso[9].includes("hit by FallDamage")) {
										var f0 = iso[0].toString();
										var f1 = iso[2].toString();
										var f2 = "fell to their death";
										dt0 = Date.now();
										//Send Killfeed Notification to Discord
										const url = "https://thecodegang.com"
										const link = hyperlink("Sign-up for DayZero", url)
										const attachment = new AttachmentBuilder('./images/crown.png');
										const embed = new EmbedBuilder()
										.setColor('Red')
										.setTitle(`Killfeed Notification`)
										.setThumbnail('attachment://crown.png')
										.setDescription(`${f0} **${f1}** ${f2}`)
										.addFields({ name: 'Get Your Free Killfeed!', value: `${link}`})
										interaction.guild.channels.cache.get(kfChannel1).send({ embeds: [embed], files: [attachment] })
										.catch((error) => { console.error(error); });
									}else if (iso[7] && iso[7].includes("suicide")) {
										var f0 = iso[0].toString();
										var f1 = iso[2].toString();
										var f2 = iso[7].toString();
										dt0 = Date.now();
										//Send Killfeed Notification to Discord
										const url = "https://thecodegang.com"
										const link = hyperlink("Sign-up for DayZero", url)
										const attachment = new AttachmentBuilder('./images/crown.png');
										const embed = new EmbedBuilder()
										.setColor('Red')
										.setTitle(`Killfeed Notification`)
										.setThumbnail('attachment://crown.png')
										.setDescription(`${f0} **${f1}** ${f2}`)
										.addFields({ name: 'Get Your Free Killfeed!', value: `${link}` })
										interaction.guild.channels.cache.get(kfChannel1).send({embeds: [embed], files: [attachment] })
										.catch((error) => { console.error(error); });
									}
									else if (iso[7] && !iso[9]) {
										console.log("Stupid NPC's!");
									}else if (iso[5] && !iso[6]) {//committed suicide
										var f0 = iso[0].toString();
										var f1 = iso[2].toString();
										var f2 = methodVal;
										dt0 = Date.now();
										//Send Killfeed Notification to Discord
										const url = "https://thecodegang.com"
										const link = hyperlink("Sign-up for DayZero", url)
										const attachment = new AttachmentBuilder('./images/crown.png');
										const embed = new EmbedBuilder()
										.setColor('Red')
										.setTitle(`Killfeed Notification`)
										.setThumbnail('attachment://crown.png')
										.setDescription(`${f0} **${f1}** ${methodVal}`)
										.addFields({ name: 'Get Your Free Killfeed!', value: `${link}` })
										interaction.guild.channels.cache.get(kfChannel1).send({embeds: [embed], files: [`${attachment}`]})
										.catch((error) => { console.error(error); });
									}else {
										var f0 = iso[0].toString();
										var f1 = iso[2].toString();
										var f2 = iso[9].toString();
										dt0 = Date.now();
										//Send Killfeed Notification to Discord
										const url = "https://thecodegang.com"
										const link = hyperlink("Sign-up for DayZero", url)
										const attachment = new AttachmentBuilder('./images/crown.png');
										const embed = new EmbedBuilder()
										.setColor('Red')
										.setTitle(`Killfeed Notification`)
										.setThumbnail('attachment://crown.png')
										.setDescription(`${f0} **${f1}** was ${f2}`)
										.addFields({ name: 'Get Your Free Killfeed!', value: `${link}`})
										interaction.guild.channels.cache.get(kfChannel1).send({embeds: [embed], files: [attachment]})
										.catch((error) => { console.error(error); });
									}
								}
							}
						}
					});
					
					tail.on('error', (err) => { console.error(err); });
					
					setInterval(() => {
						if (parseInt(config.mapLoc) === 1) {
							linkLoc = "https://www.izurvive.com/livonia/#location="; //LIVONIA
						}
						if (parseInt(config.mapLoc) === 0) {
							linkLoc = "https://www.izurvive.com/#location="; //CHERNARUS
						};
						
						if (REGION == "Frankfurt" || REGION == "FRANKFURT") {
							today = new moment().tz('Europe/Berlin').format();
						}else if (REGION == "Los_Angeles" || REGION == "Los Angeles") {
							today = new moment().tz('America/Los_Angeles').format();
						}else if (REGION == "London" || REGION == "LONDON") {
							today = new moment().tz('Europe/London').format();
						}else if (REGION == "Miami" || REGION == "MIAMI ") {
							today = new moment().tz('America/New_York').format();
						}else if (REGION == "New_York" || REGION == "New York") {
							today = new moment().tz('America/New_York').format();
						}else if (REGION == "Singapore" || REGION == "SINGAPORE") {
							today = new moment().tz('Asia/Singapore').format();
						}else if (REGION == "Sydney" || REGION == "SYDNEY") {
							today = new moment().tz('Australia/Sydney').format();
						}else if (REGION == "Moscow" || REGION == "MOSCOW") {
							today = new moment().tz('Europe/Moscow').format();
						}
						todayRef = today.slice(0, 10);
						if (feedStart === true) {
							axios.get('https://api.nitrado.net/ping')
							.then((res) => {
								if(res.status >= 200 && res.status < 300) {// Ping Nitrado API For Response
									if (PLATFORM == "XBOX" || PLATFORM == "Xbox" || PLATFORM =="xbox") {
										downloadFile().catch((error) => {console.error(error); });
										async function downloadFile () {
											// This function will request file that will contain download link for log
											const url1 = 'https://api.nitrado.net/services/'
											const url2 = '/gameservers/file_server/download?file=/games/'
											const url3 = '/noftp/dayzxb/config/DayZServer_X1_x64.ADM'
											const filePath = path.resolve('./logs', 'serverlog.ADM')
											const writer = fs.createWriteStream(filePath)
											const response = await axios.get(url1+`${ID1}`+url2+`${ID2}`+url3,{ responseType: 'stream',  headers: {'Authorization' : 'Bearer '+`${NITRATOKEN}`, 'Accept': 'application/octet-stream'}})
											response.data.pipe(writer)
											return new Promise((resolve, reject) => {
												writer.on('finish', resolve)
												writer.on('error', reject)
											})					
										}
									}else if (PLATFORM == "PLAYSTATION" || PLATFORM == "PS4" || PLATFORM == "PS5" || PLATFORM == "playstation" || PLATFORM == "Playstation") {
										downloadFile().catch((error) => { console.error(error); });
										async function downloadFile () {
											// This function will request file that will contain download link for log
											const url1 = 'https://api.nitrado.net/services/'
											const url2 = '/gameservers/file_server/download?file=/games/'
											const url3 = '/noftp/dayzps/config/DayZServer_PS4_x64.ADM'
											const filePath = path.resolve('./logs', 'serverlog.ADM')
											const writer = fs.createWriteStream(filePath)
											const response = await axios.get(url1+`${ID1}`+url2+`${ID2}`+url3,{ responseType: 'stream',  headers: {'Authorization' : 'Bearer '+`${NITRATOKEN}`, 'Accept': 'application/octet-stream'}})
											response.data.pipe(writer)
											return new Promise((resolve, reject) => {
												writer.on('finish', resolve)
												writer.on('error', reject)
											})					
										}
									}else {
										downloadFile().catch((error) => {console.error(error);});
										async function downloadFile () {
											// This function will request file that will contain download link for log
											const url1 = 'https://api.nitrado.net/services/'
											const url2 = '/gameservers/file_server/download?file=/games/'
											const url3 = '/ftproot/dayzstandalone/config/DayZServer_x64.ADM'
											const filePath = path.resolve('./logs', 'serverlog.ADM')
											const writer = fs.createWriteStream(filePath)
											const response = await axios.get(url1+`${ID1}`+url2+`${ID2}`+url3,{ responseType: 'stream',  headers: {'Authorization' : 'Bearer '+`${NITRATOKEN}`, 'Accept': 'application/octet-stream'}})
											response.data.pipe(writer)
											return new Promise((resolve, reject) => {
												writer.on('finish', resolve)
												writer.on('error', reject)
											})					
										}
									}
								}else {
									console.log(res);
								}
							})
							.catch(function (error) {
								console.log(error);
							});
							// Create a readable stream in order to parse log download link form file
							var rl = readline.createInterface({
								input: fs.createReadStream('./logs/serverlog.ADM')
							});

							//Handle Stream events ---> data, end, and error// This will request download link and write result to new file
							rl.on('line', function (line) {
								let URLParse = line.split(/[|"'<>()]/)
								let newURL = URLParse[11]
								// console.log(newURL);
								axios.get(newURL)
								.then((res) => {
									const _log = res.data;
									fs.writeFile('./logs/log.ADM', _log, 'utf-8', (err) =>{
										if (err) throw err;
										console.log(`Log Saved!`)
									})				
								})
								.catch((error) => { console.log(error); });			
							});
							
							rl.on('close', (line) => { return line; })
					
							rl.on('error', (err) => { console.error(err.stack); });

							//reset lineCount
							lineCount = 0

							//Check Log File Size
							logStats = fs.statSync('./logs/log.ADM');
							logBytes = logStats.size;
							logSize = logBytes / 1000000.0;
							console.log(`Current Log Size: ${logSize} / LogRef Size: ${logSizeRef}\nCurrent LineRef: ${lineRef}`);
							if (logSize < logSizeRef) {
								setTimeout((function () {
									logSizeRef = 0;
									valueRef.clear();
								}), 40000);
							}else {
								logSizeRef = logSize;
							}
						}else {
							interaction.guild.channels.cache.get(`${kfChannel.id}`).send("**K1llfeed Paused....**");
							return;
						}
					}, 35000);
				}
			}
		}
	},
};


console.log
(
        `\n.&&@@@%#%/   `.white, `      .,**,******,,,*,`.red, `   .*#####(  (###(,`.yellow,               
	`\n,@@@@@@@@@@@@@.   `.white, ` ,*********. .**.`.red, `   .###### .####`.yellow,                  
	`\n,@@@@@@@@@@@@@@@   `.white, ` ******      *`.red, `         /##,######,`.yellow,                
	`\n,@@@@@%   &@@@@@&   `.white, `      .******.`.red, `    .############.`.yellow,                 
	`\n   @@@@@@@@@@@@@@/   `.white, `    .******`.red, `      .###########.`.yellow,                  
	`\n %@@@@@*   &@@@@@%   `.white, `   *******`.red, `       .############,`.yellow,                 
	`\n #@@@@@* ,@@@@@@@   `.white,  `  *******`.red, `         .######.######,`.yellow,                
	`\n #@@@@@@@&%.%@@#   `.white,   ` ******.   ,,.,`.red, `      *#####  ######*` .yellow,              
	`\n #@@@@.*    (   `.white,      `  .*****. ,*,**,,*`.red, `          ##   ######/`.yellow
);

console.log(`\nThis is dt: ${dt}`);
