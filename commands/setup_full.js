import { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { roleColors } from '../config/colors.js';
import { channelConfig, ensureCategory, ensureTextChannel } from '../config/channels.js';

export default {
  data: {
    name: 'setup_full',
    description: 'Create server structure, themed roles, post role & verify messages.'
  },

  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'Run this in a server.', ephemeral: true });
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: 'You need Manage Server permission.', ephemeral: true });

    const guild = interaction.guild;

    // detect previously created items (colors + verify)
    const knownCats = channelConfig.map(c => c.categoryName);
    const knownRoles = [...Object.keys(roleColors), 'Verified'];
    const found = { categories: [], roles: [] };

    for (const name of knownCats) {
      const c = guild.channels.cache.find(x => x.name === name && x.type === ChannelType.GuildCategory);
      if (c) found.categories.push(c.name);
    }
    for (const name of knownRoles) {
      const r = guild.roles.cache.find(x => x.name === name);
      if (r) found.roles.push(r.name);
    }

    if (found.categories.length || found.roles.length) {
      // ask for confirmation before purging
      const summary = `I found existing items that look like a previous setup.\nCategories: ${found.categories.length} — ${found.categories.join(', ') || 'none'}\nRoles: ${found.roles.length} — ${found.roles.join(', ') || 'none'}`;
      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`setup_full_confirm:${interaction.guildId}:${interaction.user.id}`).setLabel('Purge & Run Setup').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`setup_full_cancel:${interaction.guildId}:${interaction.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
      );
      const embed = new EmbedBuilder().setTitle('Confirm Purge and Setup').setDescription(summary).setColor(0xFF7A7A);
      await interaction.reply({ embeds: [embed], components: [confirmRow], ephemeral: true });
      return;
    }

    // no existing items found — run immediately
    await this.runSetup(interaction, { purge: false });
    return;
  },

  // runSetup performs the actual creation; set purge=true to remove existing items first
  async runSetup(interaction, options = { purge: false }) {
    const { purge } = options;
    if (!interaction.inGuild()) return interaction.reply({ content: 'Run this in a server.', ephemeral: true });
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: 'You need Manage Server permission.', ephemeral: true });

    if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;

    const createdRoles = {};

    // Purge existing known items if requested
    if (purge) {
      // delete known channels and their children
      for (const cfg of channelConfig) {
        const cat = guild.channels.cache.find(c => c.name === cfg.categoryName && c.type === ChannelType.GuildCategory);
        if (cat) {
          const children = guild.channels.cache.filter(ch => ch.parentId === cat.id);
          for (const ch of children.values()) {
            try { await ch.delete('Purge before setup'); } catch (e) {}
          }
          try { await cat.delete('Purge before setup'); } catch (e) {}
        }
      }

      // delete known roles (color roles + verified)
      const allRoles = [...Object.keys(roleColors), 'Verified'];
      for (const rname of allRoles) {
        const role = guild.roles.cache.find(r => r.name === rname);
        if (role) {
          try { await role.delete('Purge before setup'); } catch (e) {}
        }
      }

      // clear role mappings for this guild
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const dataPath = path.join(__dirname, '..', 'data', 'role-mappings.json');
      try {
        let mappings = JSON.parse(fs.readFileSync(dataPath, 'utf8') || '{}');
        if (mappings[interaction.guildId]) delete mappings[interaction.guildId];
        fs.writeFileSync(dataPath, JSON.stringify(mappings, null, 2));
      } catch (e) {}
    }

    // Create Verified role first (needed for permissions)
    let verifiedRole = guild.roles.cache.find(x => x.name === 'Verified');
    if (!verifiedRole) {
      try { verifiedRole = await guild.roles.create({ name: 'Verified', color: 0x60A5FA, reason: 'Full setup by bot' }); } catch (e) {}
    }

    // Create all color roles (cosmetic only - no permissions)
    for (const [roleName, color] of Object.entries(roleColors)) {
      let role = guild.roles.cache.find(x => x.name === roleName);
      if (!role) {
        try { role = await guild.roles.create({ name: roleName, color, reason: 'Full setup by bot' }); } catch (e) { role = null; }
      } else {
        try { await role.edit({ color, reason: 'Syncing theme colors' }); } catch (e) {}
      }
      if (role) createdRoles[roleName] = role;
    }

    // Create all categories and channels
    for (const catCfg of channelConfig) {
      const cat = await ensureCategory(guild, catCfg.categoryName);
      for (const chCfg of catCfg.channels) {
        await ensureTextChannel(guild, chCfg.name, cat, chCfg);
      }
    }

    // Get channels for posting
    const infoCat = await ensureCategory(guild, 'information');
    const welcomeCh = guild.channels.cache.find(c => c.name === 'welcome' && c.parentId === infoCat.id && c.type === ChannelType.GuildText);
    const rulesCh = guild.channels.cache.find(c => c.name === 'rules' && c.parentId === infoCat.id && c.type === ChannelType.GuildText);
    const rolesCh = guild.channels.cache.find(c => c.name === 'roles' && c.parentId === infoCat.id && c.type === ChannelType.GuildText);
    const verifyCh = guild.channels.cache.find(c => c.name === 'verify' && c.parentId === infoCat.id && c.type === ChannelType.GuildText);

    // Post welcome message
    if (welcomeCh) {
      try {
        const welcomeEmbed = new EmbedBuilder()
          .setTitle(`Welcome to ${guild.name}!`)
          .setDescription('Start here:')
          .addFields(
            { name: 'Read', value: 'Please read the pinned message in #rules' },
            { name: 'Get Access', value: 'Assign roles in #roles (use the role-assign message)' },
            { name: 'Need Help?', value: 'Ask in #help' }
          )
          .setColor(0xA855F7);
        const msg = await welcomeCh.send({ embeds: [welcomeEmbed] });
        await msg.pin().catch(() => {});
      } catch (e) {}
    }

    // Post rules message
    if (rulesCh) {
      try {
        const rulesEmbed = new EmbedBuilder()
          .setTitle('Server rules')
          .setDescription('By joining this server you agree to the following:')
          .addFields(
            { name: '1', value: 'Be respectful. No harassment.' },
            { name: '2', value: 'Keep channels on-topic.' },
            { name: '3', value: 'No advertising without permission.' },
            { name: '4', value: 'Use #bug-reports and #feature-requests for issues and ideas.' },
            { name: '5', value: "Follow Discord's Terms of Service." }
          )
          .setColor(0xEA4426);
        const msg = await rulesCh.send({ embeds: [rulesEmbed] });
        await msg.pin().catch(() => {});
      } catch (e) {}
    }

    // Post role-assign message in roles channel with color theme roles only
    if (rolesCh) {
      try {
        const colorRoles = Object.keys(roleColors);
        const roleLines = colorRoles.map(r => `• ${r}`).join('\n');
        const roleAssignMsg = await rolesCh.send(`React to this message to pick your username color:\n\n${roleLines}`);

        // Add reactions for each color role (use simple emojis)
        const emojis = ['💚', '🔥', '💗', '❄️', '🌊', '🩵', '💜', '🌌', '✨', '⚫'];
        for (let i = 0; i < colorRoles.length && i < emojis.length; i++) {
          try { await roleAssignMsg.react(emojis[i]); } catch (e) {}
        }

        // Register mappings: reactions -> color roles
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const dataPath = path.join(__dirname, '..', 'data', 'role-mappings.json');
        let mappings = {};
        try { mappings = JSON.parse(fs.readFileSync(dataPath, 'utf8') || '{}'); } catch (e) { mappings = {}; }
        mappings[interaction.guildId] = [];

        for (let i = 0; i < colorRoles.length && i < emojis.length; i++) {
          const roleName = colorRoles[i];
          const emoji = emojis[i];
          const roleId = createdRoles[roleName]?.id || '';
          mappings[interaction.guildId].push({ messageId: roleAssignMsg.id, emoji, roleId });
        }

        try { fs.writeFileSync(dataPath, JSON.stringify(mappings, null, 2)); } catch (e) {}
      } catch (e) {}
    }

    // Create verify embed with a button
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

    await interaction.followUp({ content: 'Full setup completed: roles, channels, messages, and role mappings created!', ephemeral: true });
  }
};
