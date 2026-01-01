import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import postRolesMessage from '../utils/postRoles.js';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guildId = process.env.GUILD_ID;

  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) throw new Error('Guild not found');

    const channel = guild.channels.cache.find(c => c.name === 'roles');
    if (!channel || !channel.isTextBased()) throw new Error('Channel not found or is not text-based');

    // Get all color roles
    const createdRoles = {};
    for (const roleName of ['emerald', 'koi', 'sakura', 'winter', 'abyss', 'salmon', 'supernova', 'blackhole', 'aurora', 'marble']) {
      const role = guild.roles.cache.find(r => r.name === roleName);
      if (role) createdRoles[roleName] = role;
    }

    await postRolesMessage(channel, guild, createdRoles);
    console.log('Roles message posted successfully.');
  } catch (error) {
    console.error('Failed to post roles message:', error);
  } finally {
    client.destroy();
  }
});

client.login(process.env.DISCORD_TOKEN);
