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
const fs = require('fs');
const path = require('path');
const { Client, Collection, Intents } = require('discord.js');
const { GUILDID, TOKEN } = require('./config.json');
const moment = require('moment-timezone');
const nodeoutlook = require('nodejs-nodemailer-outlook');

if (!fs.existsSync("./logs/log.ADM")) {
    fs.writeFileSync("./logs/log.ADM", "");
}
if (!fs.existsSync("./logs/serverlog.ADM")) {
    fs.writeFileSync("./logs/serverlog.ADM", "");
}

const bot = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS
    ]
});

let servCheck = GUILDID;

// Setup Slash Command Handler
bot.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        if (command && command.data && command.data.name) {
            bot.commands.set(command.data.name, command);
        } else {
            console.warn(`No commands detected in file: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error loading command file ${filePath}:`, error);
    }
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

// Message Command Handler
bot.on('messageCreate', async message => {
    if (!message.guild || !message.author || !message.member) return;
    if (message.author.bot) return;

    const guildId = message.guild.id;
    if (servCheck != guildId) return;

    const adminRole = message.guild.roles.cache.find(r => r.name === 'Admin');
    const everyoneRole = message.guild.roles.everyone;

    if (!adminRole || !everyoneRole) return;

    const adminRoleId = adminRole.id;
    const everyoneRoleId = everyoneRole.id;
});

// Login Discord Bot
bot.login(TOKEN).catch(error => {
    console.log(error);
});

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
    console.log('KILLFEED IS ACTIVE!');
});

bot.on('error', err => {
    console.log(err);
});
