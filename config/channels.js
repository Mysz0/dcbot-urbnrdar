import { ChannelType, PermissionFlagsBits } from 'discord.js';

export const channelConfig = [
  {
    categoryName: 'information',
    channels: [
      { name: 'welcome', readonly: false },
      { name: 'rules', readonly: false },
      { name: 'roles', readonly: false },
      { name: 'resources', readonly: true },
      { name: 'verify', verifyOnly: true }
    ]
  },
  {
    categoryName: 'announcements',
    channels: [
      { name: 'announcements', readonly: true },
      { name: 'release-notes', readonly: true },
      { name: 'maintenance', readonly: false }
    ]
  },
  {
    categoryName: 'community',
    channels: [
      { name: 'general', readonly: false },
      { name: 'showcase', readonly: false },
      { name: 'help', readonly: false }
    ]
  },
  {
    categoryName: 'development',
    channels: [
      { name: 'feature-requests', readonly: false },
      { name: 'bug-reports', threadOnly: true }
    ]
  },
  {
    categoryName: 'releases-integrations',
    channels: [
      { name: 'ci-notifications', readonly: true },
      { name: 'deployments', readonly: false },
      { name: 'git-events', readonly: true }
    ]
  },
  {
    categoryName: 'ops-status',
    channels: [
      { name: 'node-ranking', readonly: true },
      { name: 'alerts', readonly: true },
      { name: 'incidents', readonly: false }
    ]
  }
];

export async function ensureCategory(guild, name) {
  let cat = guild.channels.cache.find(c => c.name === name && c.type === ChannelType.GuildCategory);
  if (!cat) {
    cat = await guild.channels.create({ name, type: ChannelType.GuildCategory, reason: 'Full setup by bot' });
  }
  return cat;
}

export async function ensureTextChannel(guild, name, parent, options = {}) {
  const everyoneRole = guild.roles.everyone;
  const verifiedRole = guild.roles.cache.find(r => r.name === 'Verified');
  let overwrites = [];

  if (options.verifyOnly) {
    // #verify: @everyone can read, but can only interact with verify button
    overwrites.push(
      { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
      { id: verifiedRole?.id || everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }
    );
  } else if (options.readonly) {
    // Read-only: @everyone can read but not send (unless verified)
    overwrites.push(
      { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
      { id: verifiedRole?.id || everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    );
  } else {
    // Regular channel: verified can send/react, non-verified cannot see/interact
    overwrites.push(
      { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] },
      { id: verifiedRole?.id || everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions, PermissionFlagsBits.ReadMessageHistory] }
    );
  }

  let ch = guild.channels.cache.find(
    c => c.name === name && c.parentId === parent.id && c.type === ChannelType.GuildText
  );

  if (!ch) {
    ch = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: parent.id,
      permissionOverwrites: overwrites,
      reason: 'Full setup by bot'
    });
  }

  return ch;
}
