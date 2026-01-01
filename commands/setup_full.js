import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { roleColors } from '../config/colors.js';
import { channelConfig, ensureCategory, ensureTextChannel } from '../config/channels.js';
import postRuleMessages from '../utils/rules.js';
import postWelcomeMessage from '../utils/postWelcome.js';
import postVerifyMessage from '../utils/postVerify.js';
import postRolesMessage from '../utils/postRoles.js';

const PRESERVE_ROLES = ['@everyone', 'owner', 'player', 'admin', 'mod', 'staff', 'contributor', 'team', 'lead', 'dev', 'designer', 'manager', 'founder', 'creator', 'maintainer', 'support', 'Verified'];
const CUSTOM_ROLES = [
  { name: 'owner', color: 0xFFD700 },
  { name: 'player', color: 0xB0B0B0 },
  { name: 'admin', color: 0xED4245 },
  { name: 'mod', color: 0x57F287 },
  { name: 'staff', color: 0x5865F2 },
  { name: 'contributor', color: 0xFAA61A },
  { name: 'team', color: 0xEB459E },
  { name: 'lead', color: 0x00B0F4 },
  { name: 'dev', color: 0x1ABC9C },
  { name: 'designer', color: 0x9B59B6 },
  { name: 'manager', color: 0x34495E },
  { name: 'founder', color: 0xE67E22 },
  { name: 'creator', color: 0xE91E63 },
  { name: 'maintainer', color: 0x2ECC71 },
  { name: 'support', color: 0x7289DA },
  { name: 'Verified', color: 0x60A5FA }
];

async function purgeServer(guild) {
  // Delete all channels and categories
  for (const channel of guild.channels.cache.values()) {
    try { await channel.delete('Full purge before setup'); } catch (e) {}
  }
  // Delete only bot-managed roles (not preserved ones)
  for (const role of guild.roles.cache.values()) {
    if (!PRESERVE_ROLES.includes(role.name)) {
      try { await role.delete('Full purge before setup'); } catch (e) {}
    }
  }
}

async function createRoles(guild) {
  const createdRoles = {};
  // Always create custom roles if missing
  for (const custom of CUSTOM_ROLES) {
    let role = guild.roles.cache.find(r => r.name === custom.name);
    if (!role) {
      try {
        role = await guild.roles.create({ name: custom.name, color: custom.color, reason: 'Custom role by setup' });
      } catch (e) { role = null; }
    }
    if (role) createdRoles[custom.name] = role;
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
  const verifiedRole = guild.roles.cache.find(r => r.name === 'Verified');
  for (const catCfg of channelConfig) {
    const cat = await ensureCategory(guild, catCfg.categoryName);
    for (const chCfg of catCfg.channels) {
      const ch = await ensureTextChannel(guild, chCfg.name, cat, chCfg);
      // If in information category, prevent Verified from sending
      if (catCfg.categoryName === 'information' && verifiedRole) {
        await ch.permissionOverwrites.edit(verifiedRole.id, { SendMessages: false }).catch(() => {});
      }
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
    try { await postWelcomeMessage(welcomeCh, guild); } catch (e) {}
  }

  if (rulesCh) {
    try { await postRuleMessages(rulesCh, { pinIntro: true }); } catch (e) {}
  }

  if (rolesCh) {
    try { await postRolesMessage(rolesCh, guild, createdRoles); } catch (e) {}
  }

  if (verifyCh) {
    try { await postVerifyMessage(verifyCh); } catch (e) {}
  }
}

export default {
  data: {
    name: 'setup_full',
    description: 'Purge and recreate all roles, channels, and messages.'
  },

  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'Run this in a server.', ephemeral: true });
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: 'You need Manage Server permission.', ephemeral: true });
    const guild = interaction.guild;
    await interaction.reply({ content: 'Purging all channels and roles. Please wait...', ephemeral: true });
    await purgeServer(guild);
    const createdRoles = await createRoles(guild);
    await createChannels(guild);
    await postMessages(guild, createdRoles);
    // Do not send a follow-up, as the original channel may be deleted.
    // await interaction.followUp({ content: 'Full setup completed: roles, channels, messages, and role mappings created!', ephemeral: true });
  }
};