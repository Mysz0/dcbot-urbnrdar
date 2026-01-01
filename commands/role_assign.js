import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { roleColors } from '../config/colors.js';

export default {
  data: {
    name: 'role_assign',
    description: 'Post a reaction-role message for color roles (one color at a time)'
  },
  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Run this in a server channel.', ephemeral: true });
    }

    await interaction.reply({ content: 'Posting color role selector...', ephemeral: true });

    const emojis = ['💚', '🔥', '💗', '❄️', '🌊', '🩵', '💜', '🌌', '✨', '⚫'];

    // Ensure color roles exist (create if missing)
    const ensuredRoles = [];
    for (const [roleName, color] of Object.entries(roleColors)) {
      let role = interaction.guild.roles.cache.find(r => r.name === roleName);
      if (!role) {
        try { role = await interaction.guild.roles.create({ name: roleName, color, reason: 'Color roles setup by bot' }); } catch (e) { role = null; }
      }
      if (role) ensuredRoles.push({ name: roleName, id: role.id });
    }

    const roleLines = ensuredRoles.map((r, i) => `${emojis[i] || '•'} ${r.name}`).join('\n');

    const msg = await interaction.channel.send(
      `React to pick ONE username color. Selecting a new color removes the previous one.\n\n${roleLines}`
    );

    for (let i = 0; i < ensuredRoles.length && i < emojis.length; i++) {
      try { await msg.react(emojis[i]); } catch (e) {}
    }

    // overwrite mappings for this guild with the new message
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dataPath = path.join(__dirname, '..', 'data', 'role-mappings.json');
    let mappings = {};
    try { mappings = JSON.parse(fs.readFileSync(dataPath, 'utf8') || '{}'); } catch (e) { mappings = {}; }
    mappings[interaction.guildId] = [];
    for (let i = 0; i < ensuredRoles.length && i < emojis.length; i++) {
      const role = ensuredRoles[i];
      const emoji = emojis[i];
      if (role?.id) mappings[interaction.guildId].push({ messageId: msg.id, emoji, roleId: role.id });
    }
    try { fs.writeFileSync(dataPath, JSON.stringify(mappings, null, 2)); } catch (e) {}

    await interaction.followUp({ content: 'Color role selector posted and mappings updated.', ephemeral: true });
  }
};
