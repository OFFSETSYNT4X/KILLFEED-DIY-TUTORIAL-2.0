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
const { SlashCommandBuilder, hyperlink } = require('@discordjs/builders');
const fs = require('fs');
const ini = require('ini');
const { Client, Intents, MessageEmbed } = require('discord.js');
const nodeoutlook = require('nodejs-nodemailer-outlook');
const axios = require('axios');
const path = require('path');
const Tail = require('tail').Tail;
const readline = require('readline');
const colors = require('colors');
const moment = require('moment-timezone');

var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
var admRegex  = null, admPlat = null;
const { GUILDID, PLATFORM, ID1, ID2, NITRATOKEN, REGION } = require('../config.json');
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

const logFile = "./logs/log.ADM";
const options = {
    separator: /[\r]{0,1}\n/,
    fromBeginning: false,
    useWatchFile: true,
    flushAtEOF: true,
    fsWatchOptions: {},
    follow: true,
    nLines: false,
    logger: console
};
const tail = new Tail(logFile, options);

let logStats = 0,
    logBytes = 0,
    logSize = 0,
    logSizeRef = 0,
    lineCount = 0,
    lineRef = 0,
    dt0 = 0,
    valueRef = new Set();

let iso, linkLoc = " ", kfChannel = " ";
let logDt = " ", dt = new Date(), todayRef = " ", today = " ";
let feedStart = false;

const phrases = [
    ") killed by ",
    "AdminLog started on ",
    "from",
    ">) bled out",
    ") with (MeleeFist)",
    ">) committed suicide",
    "[HP: 0] hit by FallDamage",
    ") was teleported from:"
];

/* const phrases2 = [
    " ) repaired",
    ")Dismantled",
    ")Built",
    "] hit by Fence",
    ") placed", 
    " is connected (",
    ") has been disconnected",
    ">) folded","] hit by TripwireTrap",
    "] hit by Watchtower",
    ") has lowered",
    ") has raised",
    ") packed"
]; */

if (PLATFORM == "XBOX" || PLATFORM == "Xbox" || PLATFORM =="xbox") {
    admPlat = '/noftp/dayzxb/config';
}else if (PLATFORM == "PLAYSTATION" || PLATFORM == "PS4" || PLATFORM == "PS5" || PLATFORM == "playstation" || PLATFORM == "Playstation") {
    admPlat = '/noftp/dayzps/config';
}else {
    admPlat = '/ftproot/dayzstandalone/config';
}

if (parseInt(config.mapLoc) === 1) {
    linkLoc = "https://www.izurvive.com/livonia/#location=";
} else if (parseInt(config.mapLoc) === 2) {
    linkLoc = "https://www.izurvive.com/sakhal/#location=";
} else if (parseInt(config.mapLoc) === 0) {
    linkLoc = "https://www.izurvive.com/#location=";
}

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
                    .addStringOption(option =>
                        option.setName('new-map')
                        .setDescription('Select Map to be displayed in notifications')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Chernarus', value: 'cherno' },
                            { name: 'Livonia', value: 'livonia' },
                            { name: 'Sakhal', value: 'sakhal' },
                        )
                    )	
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('setup')
                        .setDescription('Set up Discord channels required by Killfeed')
                )
        ),

    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));

        switch (subCommand) {
            case "clear":
                await handleClearCommand(interaction);
                break;
            case 'map':
                await handleMapChange(interaction);
                break;
            case "setup":
                await handleSetupCommand(interaction);
                break;
            case "stop":
                await handleStopCommand(interaction);
                break;
            case "deathloc":
                await handleDeathlocCommand(interaction);
                break;
            case "start":
                await handleStartCommand(interaction);
                break;
            default:
                break;
        }
    },
};

async function handleClearCommand(interaction) {
    const guildId = interaction.guildId;
    if (guildId && guildId === GUILDID) {
        const integer = interaction.options.getInteger('value');
        if (integer > 100) {
            return interaction.reply('The max number of messages you can delete is 100')
                .catch(console.error);
        }
        await interaction.channel.bulkDelete(integer).catch(console.error);
        await interaction.reply('clearing messages...').catch(console.error);
        await interaction.deleteReply().catch(console.error);
    }
}

async function handleMapChange(interaction) {
    const guildId = interaction.guildId;
    if (guildId && guildId === GUILDID) {
        config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
        const choice = interaction.options.getString('new-map')
        if (choice === "cherno") {
            config.mapLoc = 0;
            fs.writeFileSync('./config.ini', ini.stringify(config, { mapLoc: `0`}))
            interaction.reply("Killfeed Map set to **Chernaus**").catch(function (error) {console.log(error);});
            return;
        }
        if (choice === "livonia") {
            config.mapLoc = 1;
            fs.writeFileSync('./config.ini', ini.stringify(config, { mapLoc: `1`}))
            interaction.reply("Killfeed Map set to **Livonia**").catch(function (error) {console.log(error);});
            return;
        }
        if (choice === "sakhal") {
            config.mapLoc = 2;
            fs.writeFileSync('./config.ini', ini.stringify(config, { mapLoc: `2`}))
            interaction.reply("Killfeed Map set to **Sakhal**").catch(function (error) {console.log(error);});
            return;
        }
    }
}

async function handleSetupCommand(interaction) {
    const guildId = interaction.guildId;
    if (guildId && guildId === GUILDID) {
        await interaction.channel.send("....").catch(console.error);
        kfChannel = interaction.guild.channels.cache.find(channel => channel.name.includes("➖》💀-killfeed"));
        locChannel = interaction.guild.channels.cache.find(channel => channel.name.includes("➖》👀-locations"));
        alarmChannel = interaction.guild.channels.cache.find(channel => channel.name.includes("➖》🚨-alarm"));
        
        if (kfChannel == null) {
            await interaction.guild.channels.create('➖》💀-killfeed', {
                type: 'text',
                permissionOverwrites: [{
                    id: interaction.guild.roles.everyone,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
                    deny: ['ADMINISTRATOR']
                }]
            }).catch(console.error);
            await setfeed('kfChan', kfChannel.id).catch(function (error) {console.log(error);});
            await interaction.channel.send("Killfeed Channel Created Successfully!").catch(console.error);
        } else {
            await interaction.channel.send("Skipped Creating Killfeed Channel!").catch(console.error);
            await setfeed('kfChan', kfChannel.id).catch(function (error) {console.log(error);});
            console.log(`${kfChannel}`);
        }
        if (locChannel == null) {
            await interaction.guild.channels.create('➖》👀-locations', { //Create a channel
                type: 'text', //This create a text channel, you can make a voice one too, by changing "text" to "voice"
                parent: parentCategory, //Sets a Parent Catergory for created channel
                permissionOverwrites: [{ //Set permission overwrites
                    id: everyoneRole, //To make it be seen by a certain role, use a ID instead
                    deny: ['VIEW_CHANNEL'] //Deny permissions
                }]
            })
            .catch(function (error) {
                console.log(error);
            });
            await setfeed('locChan', locChannel.id).catch(function (error) {console.log(error);});
            await interaction.channel.send("Locations Channel Created Successfully!").catch(function (error) {console.log(error);});
        }else{
            await interaction.channel.send("Skipped Creating Locations Channel!").catch(function (error) {console.log(error);});
            await setfeed('locChan', locChannel.id).catch(function (error) {console.log(error);});
            console.log(`${locChannel}`);
        }
        if (alarmChannel == null) {
            await interaction.guild.channels.create('➖》🚨-alarm', { //Create a channel
                type: 'text', //This create a text channel, you can make a voice one too, by changing "text" to "voice"
                parent: parentCategory, //Sets a Parent Catergory for created channel
                permissionOverwrites: [{ //Set permission overwrites
                    id: adminRoleId, //To make it be seen by a certain role, user an ID instead
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'], //Allow permissions
                    deny: ['ADMINISTRATOR'] //Deny permissions
                }]
            })
            .catch(function (error) {
                console.log(error);
            });
            await setfeed('alrmChan', alarmChannel.id).catch(function (error) {console.log(error);});
            await interaction.channel.send("Alarm Channel Created Successfully!").catch(function (error) {console.log(error);});
        }else{
            await interaction.channel.send("Skipped Creating Alarm Channel!").catch(function (error) {console.log(error);});
            await setfeed('alrmChan', alarmChannel.id).catch(function (error) {console.log(error);});
            console.log(`${alarmChannel}`);
        }
        setTimeout(async () => {
            await interaction.channel.bulkDelete(4).catch(console.error);
        }, 5000);
        await interaction.reply('...').catch(console.error);
        await interaction.deleteReply().catch(console.error);
    }
}

async function handleStopCommand(interaction) {
    const guildId = interaction.guildId;
    if (guildId && guildId === GUILDID && feedStart) {
        await interaction.reply('Terminating Project.....').catch(console.error);
        setTimeout(() => process.exit(22), 5000);
    } else {
        await interaction.reply('THE KILLFEED IS NOT CURRENTLY RUNNING!.....').catch(console.error);
    }
}

async function handleDeathlocCommand(interaction) {
    const guildId = interaction.guildId;
    if (guildId && guildId === GUILDID && feedStart) {
        const choice = interaction.options.getString('state');
        config.showLoc = choice === "on" ? 1 : 0;
        fs.writeFileSync('./config.ini', ini.stringify(config));
        const state = choice === "on" ? "Enabled" : "Disabled";
        await interaction.reply(`Death Locations **${state}!**`).catch(console.error);
    } else {
        await interaction.reply('THE KILLFEED IS NOT CURRENTLY RUNNING!.....').catch(console.error);
    }
}

async function handleStartCommand(interaction) {
    const guildId = interaction.guildId;
    if (guildId && guildId === GUILDID) {
        kfChannel = interaction.guild.channels.cache.find(channel => channel.name.includes("➖》💀-killfeed"));
        if (!kfChannel) return;

        if (feedStart) {
            await interaction.channel.send('THE KILLFEED IS ALREADY RUNNING!.....TRY RESETING IF YOU NEED TO RESTART').catch(console.error);
            return;
        }

        await interaction.reply("**Starting Killfeed....**").catch(console.error);
        feedStart = true;
        getDetails(interaction).catch(console.error);
    }
}

async function getDetails(interaction) {
    tail.on("line", async (line) => {
        lineCount++;
        lineRef = lineCount;

        if (line.includes(phrases[1])) {
            logDt = line.slice(20, 30);
            console.log(`This is the logDate: ${logDt}`);
            console.log(`This is the current date: ${todayRef}`);
        }

        if (phrases.some(phrase => line.includes(phrase) && phrase != phrases[1])) {
            let vRef = line;
            if (!valueRef.has(vRef)) {
                valueRef.add(vRef);
                iso = line.split(/[|"'<>]/);
                await handleKillfeedNotification(interaction);
            }
        }
    });

    tail.on('error', console.error);

    setInterval(async () => {
        if (feedStart) {
            today = moment().tz(getTimezone()).format();
            todayRef = today.slice(0, 10);

            try {
                const res = axios.get('https://api.nitrado.net/services/'+`${ID1}`+'/gameservers/file_server/list?dir=/games/'+`${ID2}`+`${admPlat}`,{ responseType: 'application/json',  headers: {'Authorization' : 'Bearer '+`${NITRATOKEN}`, 'Accept': 'application/json'}});
                if (res.status >= 200 && res.status < 300) {
                    await downloadLogFile(res);
                } else {
                    console.log(res);
                }
            } catch (error) {
                console.error(error);
            }

            const rl = readline.createInterface({
                input: fs.createReadStream('./logs/serverlog.ADM')
            });

            rl.on('line', async (line) => {
                const URLParse = line.split(/[|"'<>()]/);
                const newURL = URLParse[11];
                try {
                    const res = await axios.get(newURL);
                    fs.writeFile('./logs/log.ADM', res.data, 'utf-8', (err) => {
                        if (err) throw err;
                        console.log('Log Saved!');
                    });
                } catch (error) {
                    console.error(error);
                }
            });

            rl.on('close', function(line) {return line;})

            rl.on('error', console.error);

            lineCount = 0;
            logStats = fs.statSync('./logs/log.ADM');
            logBytes = logStats.size;
            logSize = logBytes / 1000000.0;
            console.log(`Current Log Size: ${logSize} / LogRef Size: ${logSizeRef}\nCurrent LineRef: ${lineRef}`);
            if (logSize < logSizeRef) {
                setTimeout(() => {
                    logSizeRef = 0;
                    valueRef.clear();
                }, 40000);
            } else {
                logSizeRef = logSize;
            }
        } else {
            interaction.guild.channels.cache.get(`${config.kfChan}`).send("**K1llfeed Paused....**");
        }
    }, 35000);
}

async function handleKillfeedNotification(interaction) {
    if (!iso) return;

    var methodVal = iso[iso.length - 1].slice(2);
    var f0,f1,f2,f3,f4,f5,f6,dt0,Vloc,vLoc,Kloc,kLoc,locationVal;
    dt0 = Date.now();

    if (iso[9] && iso[5].includes(phrases[0])) { //PvP Kill
        if (methodVal.includes(phrases[2])) {
            try {
                // console.log(iso);
                f4 = methodVal.split(" ");
                f5 = iso[4].toString().split(/[|" "<(),>]/);
                f6 = iso[8].toString().split(/[|" "<(),>]/);
                f3 = methodVal;
                Vloc = `${f5[0]};${f5[2]};${f5[4]}`;
                Kloc = `${f6[0]};${f6[2]};${f6[4]}`;
                f0 = iso[0].toString();
                f1 = iso[6].toString();
                f2 = iso[2].toString();
                if (config.showLoc === 1) {
                    const embed = pvpEmbed(f0, f1, f2, f3, Vloc);
                    interaction.guild.channels.cache.get(config.kfChan).send({ embeds: [embed], files: ['./images/crown.png'] }).catch(console.error);
                } else {
                    const embed = pvpEmbed(f0, f1, f2, f3);
                    interaction.guild.channels.cache.get(config.kfChan).send({ embeds: [embed], files: ['./images/crown.png'] }).catch(console.error);
                }
                return;
            } catch (error) {
                console.error(error);
            }
        }else {
            try {
                // console.log(iso);
                f4 = methodVal.split(" ");
                f5 = iso[4].toString().split(/[|" "<(),>]/);
                f6 = iso[8].toString().split(/[|" "<(),>]/);
                f3 = methodVal;
                Vloc = `${f5[0]};${f5[2]};${f5[4]}`;
                Kloc = `${f6[0]};${f6[2]};${f6[4]}`;
                f0 = iso[0].toString();
                f1 = iso[6].toString();
                f2 = iso[2].toString();
                if (config.showLoc === 1) {
                    const embed = pvpEmbed(f0, f1, f2, f3, Vloc);
                    interaction.guild.channels.cache.get(config.kfChan).send({ embeds: [embed], files: ['./images/crown.png'] }).catch(console.error);
                } else {
                    const embed = pvpEmbed(f0, f1, f2, f3);
                    interaction.guild.channels.cache.get(config.kfChan).send({ embeds: [embed], files: ['./images/crown.png'] }).catch(console.error);
                }
                return;
            } catch (error) {
                console.error(error);
            }
        }
    }else if (!iso[6] && iso[5].includes(phrases[0])) {
        try {
            f0 = iso[0].toString();
            f1 = iso[2].toString();
            f2 = methodVal;
            locationVal = iso[iso.length - 2];
            vLoc = locationVal.split(/[|" "<(),>]/), x1 = vLoc[0], y1 = vLoc[2], z1 = vLoc[4];
            Vloc = x1.concat(`;${y1};${z1}`);
            if (config.showLoc === 1) {
                const embed = pvpEmbed(f0, f1, f2, Vloc);
                interaction.guild.channels.cache.get(config.kfChan).send({ embeds: [embed], files: ['./images/crown.png'] }).catch(console.error);
            } else {
                const embed = pvpEmbed(f0, f1, f2);
                interaction.guild.channels.cache.get(config.kfChan).send({ embeds: [embed], files: ['./images/crown.png'] }).catch(console.error);
            }
        }catch (error) {
            console.error(error);
        }
        return; 
    }else if (methodVal.includes("Spawning")) {
        try {
            f0 = iso[0].toString();
            f1 = iso[2].toString();
            f2 = methodVal;
            teleportEmbed(interaction, f0, f1, methodVal); 
            return;
        } catch (error) {
            console.error(error);
        }
    }else if (methodVal.includes("bled out")) {
        try {
            f0 = iso[0].toString();
            f1 = iso[2].toString();
            f2 = methodVal;
            locationVal = iso[iso.length - 2];
            vLoc = locationVal.split(/[|" "<(),>]/), x1 = vLoc[0], y1 = vLoc[2], z1 = vLoc[4];
            Vloc = x1.concat(`;${y1};${z1}`);
            if (config.showLoc === 1) {
                const embed = pveEmbed(f0, f1, f2, Vloc);
                interaction.guild.channels.cache.get(config.kfChan).send({ embeds: [embed], files: ['./images/crown.png'] }).catch(console.error);
            } else {
                const embed = pveEmbed(f0, f1, f2);
                interaction.guild.channels.cache.get(config.kfChan).send({ embeds: [embed], files: ['./images/crown.png'] }).catch(console.error);
            }
        }catch (error) {
            console.error(error);
        }
    }else if (methodVal.includes("hit by FallDamage")) { //Fall to Death
        try {
            f0 = iso[0].toString();
            f1 = iso[2].toString();
            f2 = "fell to their death";
            locationVal = iso[iso.length - 3];
            vLoc = locationVal.split(/[|" "<(),>]/), x1 = vLoc[0], y1 = vLoc[2], z1 = vLoc[4];
            Vloc = x1.concat(`;${y1};${z1}`);

            if (config.showLoc === 1) {
                const embed = pveEmbed(f0, f1, f2, Vloc);
                interaction.guild.channels.cache.get(config.kfChan).send({ embeds: [embed], files: ['./images/crown.png'] }).catch(console.error);
            } else {
                const embed = pveEmbed(f0, f1, f2);
                interaction.guild.channels.cache.get(config.kfChan).send({ embeds: [embed], files: ['./images/crown.png'] }).catch(console.error);
            }
        }catch (error) {
            console.error(error);
        }

    }else if (methodVal.includes("committed suicide")) { //Commited Suicide
        try {
            f0 = iso[0].toString();
            f1 = iso[2].toString();
            f2 = methodVal;
            locationVal = iso[iso.length - 2];
            vLoc = locationVal.split(/[|" "<(),>]/), x1 = vLoc[0], y1 = vLoc[2], z1 = vLoc[4];
            Vloc = x1.concat(`;${y1};${z1}`);

            if (config.showLoc === 1) {
                const embed = pveEmbed(f0, f1, f2, Vloc);
                interaction.guild.channels.cache.get(config.kfChan).send({ embeds: [embed], files: ['./images/crown.png'] }).catch(console.error);
            } else {
                const embed = pveEmbed(f0, f1, f2);
                interaction.guild.channels.cache.get(config.kfChan).send({ embeds: [embed], files: ['./images/crown.png'] }).catch(console.error);
            }
        }catch (error) {
            console.error(error);
        }
    } 
}

function pveEmbed(f0, f1, f2, Vloc) {
    const url = "https://thecodegang.com";
    const link = hyperlink("Sign-up for DayZero", url);
    const embed = new MessageEmbed()
        .setColor('0xDD0000')
        .setTitle(`Killfeed Notification`)
        .setThumbnail('attachment://crown.png')
        .setDescription(`${f0} **${f1}** ${f2}`)
        .addFields(
            {name: `Get Your Free Killfeed!`, value: `${link}`, inline: false},
        )

    if (Vloc) {
        embed.addFields(
            {name: `🌐`, value: `${linkLoc}${Vloc}`, inline: false},
        )

    }

    return embed;
}

function pvpEmbed(f0, f1, f2, f3, Vloc) {
    const url = "https://thecodegang.com";
    const link = hyperlink("Sign-up for DayZero", url);
    const embed = new MessageEmbed()
        .setColor('0xDD0000')
        .setTitle(`Killfeed Notification`)
        .setThumbnail('attachment://crown.png')
        .setDescription(`${f0} **${f1}** Killed **${f2}** ${f3}`)
        .addFields(
            {name: `Get Your Free Killfeed!`, value: `${link}`, inline: false},
        )

    if (Vloc) {
        embed.addFields(
            {name: `🌐`, value: `${linkLoc}${Vloc}`, inline: false},
        )
    }

    return embed;
}

function teleportEmbed(interaction, f0, f1, methodVal) {//Restricted Area Teleport Event
    const url = "https://thecodegang.com"
    //const link = hyperlink("Sign-up for DayZero", url)
    const attachment = ('./images/crown.png');
    const embed = new MessageEmbed()
    .setColor('0xDD0000')
    .setTitle(`Teleport Notification`)
    .setThumbnail('attachment://crown.png')
    .setDescription(`${f0} **${f1}** ${methodVal}`)
    //.addField('Get Your Free Killfeed!', `${link}`)
    interaction.guild.channels.cache.get(config.teleFeed).send({embeds: [embed], files: [`${attachment}`]})
    .catch(function (error) {
        console.log(error);
    });		
}

function getLocation(isoValue) {
    if (!isoValue) return null;
    const locArray = isoValue.split(/[|" "<(),>]/);
    return locArray.join(';');
}

function getTimezone() {
    switch (REGION.toUpperCase()) {
        case "FRANKFURT":
            return 'Europe/Berlin';
        case "LOS ANGELES":
            return 'America/Los_Angeles';
        case "LONDON":
            return 'Europe/London';
        case "MIAMI":
            return 'America/New_York';
        case "NEW YORK":
            return 'America/New_York';
        case "SINGAPORE":
            return 'Asia/Singapore';
        case "SYDNEY":
            return 'Australia/Sydney';
        case "MOSCOW":
            return 'Europe/Moscow';
        default:
            return 'UTC';
    }
}

async function downloadLogFile(res) {
    let url1, url2, url3;
    if (PLATFORM.match(/XBOX|xbox|Xbox/i)) {
        admRegex = /^DayZServer_X1_x64_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})\.ADM$/;
        const latestADM = await getLatestADMEntry(res.data);
        if (latestADM) {
           url1 = 'https://api.nitrado.net/services/'
           url2 = '/gameservers/file_server/download?file=/games/'
           url3 = `/noftp/dayzxb/config/${latestADM.name}`
        } else {
        return console.log("Unable to determine logfile name!");
        }
    } else if (PLATFORM.match(/PLAYSTATION|PS4|PS5|playstation|Playstation/i)) {
        admRegex = /^DayZServer_X1_x64_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})\.ADM$/;
        const latestADM = await getLatestADMEntry(res.data);
        if (latestADM) {
           url1 = 'https://api.nitrado.net/services/'
           url2 = '/gameservers/file_server/download?file=/games/'
           url3 = `/noftp/dayzps/config/${latestADM.name}`
        } else {
        return console.log("Unable to determine logfile name!");
        }
    } else {
        admRegex = /^DayZServer_X1_x64_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})\.ADM$/;
        const latestADM = await getLatestADMEntry(res.data);
        if (latestADM) {
           url1 = 'https://api.nitrado.net/services/'
           url2 = '/gameservers/file_server/download?file=/games/'
           url3 = `/ftproot/dayzstandalone/config/${latestADM.name}`
        } else {
        return console.log("Unable to determine logfile name!");
        }
    }
    const filePath = path.resolve('./logs', 'serverlog.ADM');
    const writer = fs.createWriteStream(filePath);
    const response = await axios.get(`${url1}${ID1}${url2}${ID2}${url3}`, { responseType: 'stream', headers: { 'Authorization': `Bearer ${NITRATOKEN}`, 'Accept': 'application/octet-stream' } });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function setfeed(name, ChanId) {
    if (name == "kfChan") {
        config.kfChan = `${ChanId}`
    }if (name == "locChan") {
        config.locChan = `${ChanId}`
    }if (name == "alrmChan") {
        config.alrmChan = `${ChanId}`
    }
    fs.writeFileSync('./config.ini', ini.stringify(config, { name: `${ChanId}`}))
    console.log(`${name} Channel Set!`);
}

console.log(
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