/* DayZero KillFeed (DZK) DIY Project 2.1
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

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, Intents, MessageEmbed } = require('discord.js');
const { GUILDID, ID1, NITRATOKEN } = require('../config.json');
const ini = require('ini');
const axios = require('axios');
const FormData = require('form-data');
const concat = require('concat-stream'); // Install Module "npm i concat-stream"

// Initialize local files if they don't exist
const logFiles = ["./logs/ban.txt", "./logs/priority.txt", "./logs/whitelist.txt"];
logFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "");
  }
});

const bot = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ac')
    .setDescription('Contains all Access Control commands')
    .addSubcommandGroup(subcommand =>
      subcommand
        .setName('serverlist')
        .setDescription('Edit Nitrado Server Access Lists')
        .addSubcommand(subcommand =>
          subcommand
            .setName('whitelist')
            .setDescription('Add or Remove GamerTag to Whitelist')
            .addStringOption(option =>
              option.setName('gamertag')
                .setDescription('Enter a GamerTag')
                .setRequired(true)
            )
            .addStringOption(option =>
              option.setName('action')
                .setDescription('Select desired whitelisting action: Add or Remove')
                .setRequired(true)
                .addChoices(
                  { name: 'ADD', value: 'add' },
                  { name: 'REMOVE', value: 'remove' },
                )
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('banlist')
            .setDescription('Add or Remove GamerTag to Banlist')
            .addStringOption(option =>
              option.setName('gamertag')
                .setDescription('Enter a GamerTag')
                .setRequired(true)
            )
            .addStringOption(option =>
              option.setName('action')
                .setDescription('Select desired action')
                .setRequired(true)
                .addChoices(
                  { name: 'ADD', value: 'add' },
                  { name: 'REMOVE', value: 'remove' },
                )
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('priority')
            .setDescription('Add or Remove GamerTag to Priority List')
            .addStringOption(option =>
              option.setName('gamertag')
                .setDescription('Enter a GamerTag')
                .setRequired(true)
            )
            .addStringOption(option =>
              option.setName('action')
                .setDescription('Select desired action')
                .setRequired(true)
                .addChoices(
                  { name: 'ADD', value: 'add' },
                  { name: 'REMOVE', value: 'remove' },
                )
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('getlist')
            .setDescription('Download Current Specified Nitrado Server Access List')
            .addStringOption(option =>
              option.setName('action')
                .setDescription('Select desired list')
                .setRequired(true)
                .addChoices(
                  { name: 'Whitelist', value: 'wl' },
                  { name: 'Banlist', value: 'ban' },
                  { name: 'Priority', value: 'pl' },
                )
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('resetlist')
            .setDescription('Reset Specified Nitrado Server Access List')
            .addStringOption(option =>
              option.setName('action')
                .setDescription('Select which list will be reset')
                .setRequired(true)
                .addChoices(
                  { name: 'Whitelist', value: 'wl' },
                  { name: 'Banlist', value: 'ban' },
                  { name: 'Priority', value: 'pl' },
                )
            )
        )
    ),

  async execute(interaction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case 'whitelist':
        await handleWhitelistCommand(interaction);
        break;
      case 'banlist':
        await handleBanlistCommand(interaction);
        break;
      case 'priority':
        await handlePriorityCommand(interaction);
        break;
      case 'getlist':
        await handleGetlistCommand(interaction);
        break;
      case 'resetlist':
        await handleResetlistCommand(interaction);
        break;
      default:
        break;
    }
  }
};

async function handleWhitelistCommand(interaction) {
  const guildId = interaction.guildId;
  if (guildId && guildId === GUILDID) {
    const target = interaction.options.getString('gamertag');
    const choice = interaction.options.getString('action');

    if (choice === 'add') {
      await addToList('./logs/whitelist.txt', target, 'whitelist', interaction);
    } else if (choice === 'remove') {
      await removeFromList('./logs/whitelist.txt', target, 'whitelist', interaction);
    }
  }
}

async function handleBanlistCommand(interaction) {
  const guildId = interaction.guildId;
  if (guildId && guildId === GUILDID) {
    const target = interaction.options.getString('gamertag');
    const choice = interaction.options.getString('action');

    if (choice === 'add') {
      await addToList('./logs/ban.txt', target, 'bans', interaction);
    } else if (choice === 'remove') {
      await removeFromList('./logs/ban.txt', target, 'bans', interaction);
    }
  }
}

async function handlePriorityCommand(interaction) {
  const guildId = interaction.guildId;
  if (guildId && guildId === GUILDID) {
    const target = interaction.options.getString('gamertag');
    const choice = interaction.options.getString('action');

    if (choice === 'add') {
      await addToList('./logs/priority.txt', target, 'priority', interaction);
    } else if (choice === 'remove') {
      await removeFromList('./logs/priority.txt', target, 'priority', interaction);
    }
  }
}

async function handleGetlistCommand(interaction) {
  const guildId = interaction.guildId;
  if (guildId && guildId === GUILDID) {
    const choice = interaction.options.getString('action');
    let filePath = '';

    switch (choice) {
      case 'wl':
        filePath = './logs/whitelist.txt';
        break;
      case 'ban':
        filePath = './logs/ban.txt';
        break;
      case 'pl':
        filePath = './logs/priority.txt';
        break;
      default:
        break;
    }

    if (filePath) {
      await getList(filePath, interaction);
    }
  }
}

async function handleResetlistCommand(interaction) {
  const guildId = interaction.guildId;
  if (guildId && guildId === GUILDID) {
    const choice = interaction.options.getString('action');
    let filePath = '';

    switch (choice) {
      case 'wl':
        filePath = './logs/whitelist.txt';
        break;
      case 'ban':
        filePath = './logs/ban.txt';
        break;
      case 'pl':
        filePath = './logs/priority.txt';
        break;
      default:
        break;
    }

    if (filePath) {
      fs.truncate(filePath, (err) => {
        if (err) {
          interaction.reply("Reset Failed!").catch(console.error);
        } else {
          interaction.reply(`${choice.charAt(0).toUpperCase() + choice.slice(1)} list reset successfully!`).catch(console.error);
        }
      });
    }
  }
}

async function addToList(filePath, target, key, interaction) {
  const formData = new FormData();
  const headers = {
    ...formData.getHeaders(),
    "Content-Length": formData.getLengthSync(),
    "Authorization": `Bearer ${NITRATOKEN}`,
  };
  const url = `https://api.nitrado.net/services/${ID1}/gameservers/settings`;

  fs.appendFileSync(filePath, `${target}\r\n`);

  const stream = fs.createReadStream(filePath, { flags: 'r' }, 'utf8');
  const data = await streamToString(stream);
  formData.append("category", "general");
  formData.append("key", key);
  formData.append("value", data);

  formData.pipe(concat(async (data) => {
    try {
      const response = await axios.post(url, data, { headers, withCredentials: true });
      if (response.status >= 200 && response.status < 300) {
        interaction.reply('Request success!').catch(console.error);
      }
    } catch (error) {
      console.error(error);
      interaction.reply('Something went wrong!').catch(console.error);
    }
  }));
}

async function removeFromList(filePath, target, key, interaction) {
  const formData = new FormData();
  const headers = {
    ...formData.getHeaders(),
    "Content-Length": formData.getLengthSync(),
    "Authorization": `Bearer ${NITRATOKEN}`,
  };
  const url = `https://api.nitrado.net/services/${ID1}/gameservers/settings`;

  let oldList = fs.readFileSync(filePath, 'utf-8');
  let newList = oldList.replace(`${target}\r\n`, '');
  fs.writeFileSync(filePath, newList, 'utf-8');

  const stream = fs.createReadStream(filePath, { flags: 'r' }, 'utf8');
  const data = await streamToString(stream);
  formData.append("category", "general");
  formData.append("key", key);
  formData.append("value", data);

  formData.pipe(concat(async (data) => {
    try {
      const response = await axios.post(url, data, { headers, withCredentials: true });
      if (response.status >= 200 && response.status < 300) {
        interaction.reply('Request success!').catch(console.error);
      }
    } catch (error) {
      console.error(error);
      interaction.reply('Something went wrong!').catch(console.error);
    }
  }));
}

async function getList(filePath, interaction) {
  const stream = fs.createReadStream(filePath, { flags: 'r' }, 'utf8');
  const data = await streamToString(stream);
  interaction.channel.send(`Retrieving List....`).catch(console.error);
  interaction.channel.send(data).catch(console.error);
  interaction.channel.send("**Done!**").catch(console.error);
  interaction.reply(`...`).catch(console.error);
  interaction.deleteReply().catch(console.error);
}

function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}
