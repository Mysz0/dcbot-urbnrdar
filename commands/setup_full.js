import { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { roleColors } from '../config/colors.js';
import { channelConfig, ensureCategory, ensureTextChannel } from '../config/channels.js';
import postRuleMessages from '../utils/rules.js';

async function createRoles(guild) {
  const createdRoles = {};

  // Create Verified role
  let verifiedRole = guild.roles.cache.find(x => x.name === 'Verified');
  if (!verifiedRole) {
    try {
      verifiedRole = await guild.roles.create({ name: 'Verified', color: 0x60A5FA, reason: 'Full setup by bot' });
    } catch (e) {}
  }

  // Create color roles
  for (const [roleName, color] of Object.entries(roleColors)) {
    let role = guild.roles.cache.find(x => x.name === roleName);
    if (!role) {
      try {
        role = await guild.roles.create({ name: roleName, color, reason: 'Full setup by bot' });
      } catch (e) { role = null; }
    } else {
      try {
        await role.edit({ color, reason: 'Syncing theme colors' });
      } catch (e) {}
    }
    if (role) createdRoles[roleName] = role;
  }

  return createdRoles;
}

async function createChannels(guild) {
  for (const catCfg of channelConfig) {
    const cat = await ensureCategory(guild, catCfg.categoryName);
    for (const chCfg of catCfg.channels) {
      await ensureTextChannel(guild, chCfg.name, cat, chCfg);
    }
  }
}

async function postMessages(guild, createdRoles) {
  const infoCat = await ensureCategory(guild, 'information');
  const welcomeCh = guild.channels.cache.find(c => c.name === 'welcome' && c.parentId === infoCat.id && c.type === ChannelType.GuildText);
  const rulesCh = guild.channels.cache.find(c => c.name === 'rules' && c.parentId === infoCat.id && c.type === ChannelType.GuildText);
  const rolesCh = guild.channels.cache.find(c => c.name === 'roles' && c.parentId === infoCat.id && c.type === ChannelType.GuildText);
  const verifyCh = guild.channels.cache.find(c => c.name === 'verify' && c.parentId === infoCat.id && c.type === ChannelType.GuildText);

  if (welcomeCh) {
    try {
      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`Welcome to ${guild.name}!`)
        .setDescription('Start here:')
        .addFields(
          { name: 'Read', value: 'Please read the pinned message in #rules' },
          { name: 'Get Access', value: 'Verify yourself in #verify and pick your color in #roles' },
          { name: 'Need Help?', value: 'Ask in #help with context and screenshots' }
        )
        .setColor(0xA855F7)
        .setFooter({ text: 'Our repo and docs: <link-to-repo>' });
      const msg = await welcomeCh.send({ embeds: [welcomeEmbed] });
      await msg.pin().catch(() => {});
    } catch (e) {}
  }

  if (rulesCh) {
    try {
      await postRuleMessages(rulesCh, { pinIntro: true });
    } catch (e) {}
  }

  if (rolesCh) {
    try {
      const colorRoles = Object.keys(roleColors);
      const emojis = ['💚', '🔥', '💗', '❄️', '🌊', '🩵', '💜', '🌌', '✨', '⚫'];
      const roleLines = colorRoles
        .map((r, i) => `${emojis[i] || '•'} ${r}`)
        .join('\n');
      const roleAssignMsg = await rolesCh.send(
        `React to pick ONE username color. Adding a new color removes the previous one.\n\n${roleLines}`
      );

      for (let i = 0; i < colorRoles.length && i < emojis.length; i++) {
        try { await roleAssignMsg.react(emojis[i]); } catch (e) {}
      }

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const dataPath = path.join(__dirname, '..', 'data', 'role-mappings.json');
      let mappings = {};
      try { mappings = JSON.parse(fs.readFileSync(dataPath, 'utf8') || '{}'); } catch (e) { mappings = {}; }
      mappings[guild.id] = [];

      for (let i = 0; i < colorRoles.length && i < emojis.length; i++) {
        const roleName = colorRoles[i];
        const emoji = emojis[i];
        const roleId = createdRoles[roleName]?.id || '';
        mappings[guild.id].push({ messageId: roleAssignMsg.id, emoji, roleId });
      }

      try { fs.writeFileSync(dataPath, JSON.stringify(mappings, null, 2)); } catch (e) {}
    } catch (e) {}
  }

  if (verifyCh) {
    try {
      const verifyEmbed = new EmbedBuilder()
        .setTitle('Verify yourself')
        .setDescription('Press the button below to become Verified and access community channels.')
        .setColor(0x60A5FA);

      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('verify_button').setLabel('Verify').setStyle(ButtonStyle.Primary)
      );

      await verifyCh.send({ embeds: [verifyEmbed], components: [buttonRow] });
    } catch (e) {}
  }
}

export default {
  data: {
    name: 'setup_full',
    description: 'Create server structure, themed roles, post role & verify messages.'
  },

  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'Run this in a server.', ephemeral: true });
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: 'You need Manage Server permission.', ephemeral: true });

    const guild = interaction.guild;

    const createdRoles = await createRoles(guild);
    await createChannels(guild);
    await postMessages(guild, createdRoles);

    await interaction.reply({ content: 'Full setup completed: roles, channels, messages, and role mappings created!', ephemeral: true });
  }
};
