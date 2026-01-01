import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import postVerifyMessage from '../utils/postVerify.js';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guildId = process.env.GUILD_ID;

  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) throw new Error('Guild not found');

    const channel = guild.channels.cache.find(c => c.name === 'verify');
    if (!channel || !channel.isTextBased()) throw new Error('Channel not found or is not text-based');

    await postVerifyMessage(channel);
    console.log('Verify message posted successfully.');
  } catch (error) {
    console.error('Failed to post verify message:', error);
  } finally {
    client.destroy();
  }
});

client.login(process.env.DISCORD_TOKEN);
