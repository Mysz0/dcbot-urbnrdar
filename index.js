import fs from 'fs';
import path from 'path';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('DISCORD_TOKEN not set in environment. See .env.example');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/+/, ''));
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import('file://' + filePath);
  if (command?.default?.data) client.commands.set(command.default.data.name, command.default);
}

// data folder and mappings file
const dataDir = path.join(__dirname, 'data');
const mappingsFile = path.join(dataDir, 'role-mappings.json');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(mappingsFile)) fs.writeFileSync(mappingsFile, JSON.stringify({}, null, 2));

function readRoleMappings() {
  try {
    return JSON.parse(fs.readFileSync(mappingsFile, 'utf8') || '{}');
  } catch (e) {
    return {};
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Reaction add/remove handlers for role assignment
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  try {
    if (reaction.partial) await reaction.fetch();
    const msg = reaction.message;
    const guildId = msg.guildId;
    if (!guildId) return;
    const mappings = (readRoleMappings())[guildId] || [];
    const match = mappings.find(m => String(m.messageId) === String(msg.id) && (m.emoji === reaction.emoji.name || m.emoji === reaction.emoji.id || m.emoji === reaction.emoji.toString()));
    if (!match) return;
    const guild = msg.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    await member.roles.add(match.roleId).catch(() => null);
  } catch (err) {
    console.error('reaction add handler error', err);
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  try {
    if (reaction.partial) await reaction.fetch();
    const msg = reaction.message;
    const guildId = msg.guildId;
    if (!guildId) return;
    const mappings = (readRoleMappings())[guildId] || [];
    const match = mappings.find(m => String(m.messageId) === String(msg.id) && (m.emoji === reaction.emoji.name || m.emoji === reaction.emoji.id || m.emoji === reaction.emoji.toString()));
    if (!match) return;
    const guild = msg.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    await member.roles.remove(match.roleId).catch(() => null);
  } catch (err) {
    console.error('reaction remove handler error', err);
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(err);
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'There was an error while executing this command.', ephemeral: true });
        } else {
          await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
        }
      } catch (replyErr) {
        console.error('failed to notify user about command error', replyErr);
      }
    }
    return;
  }

  // handle verify button
  if (interaction.isButton()) {
    try {
      // handle setup_full confirmation buttons
      if (interaction.customId && interaction.customId.startsWith('setup_full_confirm:')) {
        const parts = interaction.customId.split(':');
        const guildId = parts[1];
        const userId = parts[2];
        if (interaction.user.id !== userId) return interaction.reply({ content: 'Only the command invoker can confirm.', ephemeral: true });
        const command = client.commands.get('setup_full');
        if (!command || typeof command.runSetup !== 'function') return interaction.reply({ content: 'Setup command not available.', ephemeral: true });
        try {
          await command.runSetup(interaction, { purge: true });
        } catch (e) {
          console.error('setup_full run error', e);
          try { await interaction.followUp({ content: 'Failed to run setup.', ephemeral: true }); } catch (err) {}
        }
        return;
      }

      if (interaction.customId && interaction.customId.startsWith('setup_full_cancel:')) {
        const parts = interaction.customId.split(':');
        const userId = parts[2];
        if (interaction.user.id !== userId) return interaction.reply({ content: 'Only the command invoker can cancel.', ephemeral: true });
        try { await interaction.reply({ content: 'Cancelled setup.', ephemeral: true }); } catch (e) {}
        return;
      }

      if (interaction.customId === 'verify_button') {
        const guild = interaction.guild;
        const member = interaction.member;
        if (!guild || !member) return interaction.reply({ content: 'Cannot verify here.', ephemeral: true });
        // find Verified role
        const verified = guild.roles.cache.find(r => r.name.toLowerCase() === 'verified');
        if (!verified) {
          // try create
          try { await guild.roles.create({ name: 'Verified', reason: 'Created by verify button' }); } catch (e) { }
        }
        const vrole = guild.roles.cache.find(r => r.name.toLowerCase() === 'verified');
        if (!vrole) return interaction.reply({ content: 'Verified role not available. Ask an admin.', ephemeral: true });
        await member.roles.add(vrole.id).catch(() => null);
        return interaction.reply({ content: 'You are now verified!', ephemeral: true });
      }
    } catch (err) {
      console.error('button handler error', err);
    }
  }
});

client.login(token);
