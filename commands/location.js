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
const { Client, Intents, MessageEmbed } = require('discord.js');
const { GUILDID, TOKEN } = require('../config.json');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const ini = require('ini');
var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
const axios = require('axios');
const moment = require('moment-timezone');
const Tail = require('tail').Tail;
const bot = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS
    ]
});

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
var linkLoc = " ";

// Define the channel IDs
const locationNotificationChannelId = config.alrmChan;
const allLocationsChannelId = config.locChan; // Replace with your channel ID

// Define the location and radius
const definedLocation = { x: 5400, y: 8500, z: 330 }; // Example location
const radius = 100; // Radius in which to notify

// Utility function to calculate distance between two points
function calculateDistance(loc1, loc2) {
    const dx = loc1.x - loc2.x;
    const dy = loc1.y - loc2.y;
    const dz = loc1.z - loc2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Function to parse player location from log entry
function parsePlayerLocation(logEntry) {
    const regex = /(\d{2}:\d{2}:\d{2}) \| Player "(.+?)" \(id=.*? pos=<(.+?), (.+?), (.+?)>\)/;
    const match = logEntry.match(regex);

    if (match) {
        return {
            timestamp: match[1],
            name: match[2],
            position: {
                x: parseFloat(match[3]),
                y: parseFloat(match[4]),
                z: parseFloat(match[5])
            }
        };
    }
    return null;
}

// Function to send notification to Discord
async function sendNotification(channelId, embed) {
    const channel = bot.channels.cache.get(channelId);
    if (!channel) {
        console.error(`Channel ${channelId} not found`);
        return;
    }
    await channel.send({ embeds: [embed] });
}

// Tail the log file and check for player locations
tail.on("line", async (line) => {
    // Set link location based on config
    if (parseInt(config.mapLoc) === 1) {
        linkLoc = "https://www.izurvive.com/livonia/#location=";
    } else if (parseInt(config.mapLoc) === 2) {
        linkLoc = "https://www.izurvive.com/sakhal/#location=";
    } else if (parseInt(config.mapLoc) === 0) {
        linkLoc = "https://www.izurvive.com/#location=";
    }

    const playerInfo = parsePlayerLocation(line);
    if (playerInfo) {
        var notifyLink = `${playerInfo.position.x};${playerInfo.position.y};${playerInfo.position.z}`;
        const url = `${linkLoc}${notifyLink}`;

        // Send all player locations to the allLocationsChannelId
        const link = hyperlink(notifyLink, url);
        const allLocationsEmbed = new MessageEmbed()
            .setColor('0x00FF00')
            .setTitle('Player Location Update')
            .setDescription(`🕛**${playerInfo.timestamp}**  :bust_in_silhouette:**${playerInfo.name}** was pinged at 📍${link}`)
            .setTimestamp();
        await sendNotification(allLocationsChannelId, allLocationsEmbed);

        // Check if the player is within the radius of the defined location
        const distance = calculateDistance(playerInfo.position, definedLocation);
        if (distance <= radius) {
            const locationNotificationEmbed = new MessageEmbed()
                .setColor('0xFF0000')
                .setTitle('Player Nearby')
                .setDescription(`🕛**${playerInfo.timestamp}**, :bust_in_silhouette:**${playerInfo.name}** is within **${distance.toFixed(2)+'m'}** of Zone.`)
                .setTimestamp();
            await sendNotification(locationNotificationChannelId, locationNotificationEmbed);
        }
    }
});

tail.on('error', (err) => {
    console.error("Error reading log file:", err);
});

// Login Discord Bot
bot.login(TOKEN).catch(error => {
    console.log(error);
});

bot.on('ready', () => {
    console.log('LOCATION MONITORING IS ACTIVE!');
});

bot.on('error', err => {
    console.log(err);
});