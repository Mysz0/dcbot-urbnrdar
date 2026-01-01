export default {
  data: {
    name: 'role_map',
    description: 'Manage emoji -> role mappings for reaction role messages',
    options: [
      {
        name: 'add',
        type: 1, // SUB_COMMAND
        description: 'Add a mapping for a message',
        options: [
          { name: 'message_id', type: 3, description: 'Message ID to attach the mapping to', required: true },
          { name: 'emoji', type: 3, description: 'Emoji (unicode or custom) to use', required: true },
          { name: 'role', type: 8, description: 'Role to assign', required: true }
        ]
      },
      {
        name: 'remove',
        type: 1,
        description: 'Remove a mapping',
        options: [
          { name: 'message_id', type: 3, description: 'Message ID where the mapping exists', required: true },
          { name: 'emoji', type: 3, description: 'Emoji for the mapping to remove', required: true }
        ]
      },
      {
        name: 'list',
        type: 1,
        description: 'List mappings for this guild'
      }
    ]
  },
  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'Use this command in a server.', ephemeral: true });
    if (!interaction.member.permissions.has(8)) return interaction.reply({ content: 'You need Manage Server permission.', ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const dataPath = new URL('../data/role-mappings.json', import.meta.url);
    const fs = await import('fs');
    const path = (await import('path')).default;
    const mappingsFile = path.join(path.dirname(dataPath.pathname.replace(/^\/+/, '')), 'role-mappings.json');
    let mappings = {};
    try { mappings = JSON.parse(fs.readFileSync(mappingsFile, 'utf8') || '{}'); } catch (e) { mappings = {}; }

    if (sub === 'add') {
      const messageId = interaction.options.getString('message_id', true);
      const emoji = interaction.options.getString('emoji', true);
      const role = interaction.options.getRole('role', true);
      mappings[guildId] = mappings[guildId] || [];
      mappings[guildId].push({ messageId, emoji, roleId: role.id });
      fs.writeFileSync(mappingsFile, JSON.stringify(mappings, null, 2));
      await interaction.reply({ content: `Mapping added: ${emoji} -> <@&${role.id}> on message ${messageId}`, ephemeral: true });
      return;
    }

    if (sub === 'remove') {
      const messageId = interaction.options.getString('message_id', true);
      const emoji = interaction.options.getString('emoji', true);
      mappings[guildId] = mappings[guildId] || [];
      const before = mappings[guildId].length;
      mappings[guildId] = mappings[guildId].filter(m => !(m.messageId === messageId && m.emoji === emoji));
      fs.writeFileSync(mappingsFile, JSON.stringify(mappings, null, 2));
      const removed = before - mappings[guildId].length;
      await interaction.reply({ content: `Removed ${removed} mappings.`, ephemeral: true });
      return;
    }

    if (sub === 'list') {
      mappings[guildId] = mappings[guildId] || [];
      if (mappings[guildId].length === 0) return interaction.reply({ content: 'No mappings for this guild.', ephemeral: true });
      const lines = mappings[guildId].map(m => `message: ${m.messageId} — ${m.emoji} -> <@&${m.roleId}>`);
      await interaction.reply({ content: lines.join('\n'), ephemeral: true });
      return;
    }

    await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
  }
};
