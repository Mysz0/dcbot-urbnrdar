import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder } from 'discord.js';
import { roleColors } from '../config/colors.js';

export default async function postRolesMessage(channel, guild, createdRoles) {
  const colorRoles = Object.keys(roleColors);
  const emojis = ['💚', '🔥', '💗', '❄️', '🌊', '🧡', '💜', '🌌', '✨', '⚫'];
  const roleLines = colorRoles
    .map((r, i) => `${emojis[i] || '•'} **${r}**`)
    .join('\n');
  
  const rolesEmbed = new EmbedBuilder()
    .setTitle('Choose Your Color')
    .setDescription('React with an emoji to pick ONE username color. Adding a new color removes the previous one.')
    .addFields({ name: 'Available Colors', value: roleLines })
    .setColor(0xA855F7)
    .setFooter({ text: 'Your color will be visible across the server' });

  const roleAssignMsg = await channel.send({ embeds: [rolesEmbed] });

  for (let i = 0; i < colorRoles.length && i < emojis.length; i++) {
    try { await roleAssignMsg.react(emojis[i]); } catch (e) {}
  }

  // Update role mappings
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
  
  return roleAssignMsg;
}
