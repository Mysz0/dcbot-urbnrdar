import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guildId = process.env.GUILD_ID;

  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) throw new Error('Guild not found');

    const channel = guild.channels.cache.find(c => c.name === 'feature-requests');
    if (!channel || !channel.isTextBased()) throw new Error('Channel not found or is not text-based');

    const embed = new EmbedBuilder()
      .setTitle('Feature Requests')
      .setDescription('Have an idea to improve UrbanRadar? Share your feature requests here!')
      .addFields(
        { name: 'How to Submit', value: 'Post your feature idea with a clear title and description. Explain the problem it solves or the value it adds.' },
        { name: 'Community Voting', value: 'React with 👍 to support ideas you like. Popular requests get prioritized.' },
        { name: 'Tips', value: '• Search before posting to avoid duplicates\n• Be specific and detailed\n• Focus on one feature per post\n• Explain your use case' },
        { name: 'Keep in Mind', value: 'Not all requests can be implemented. Feasibility, scope, and community interest are all factors.' }
      )
      .setColor(0xFAA61A)
      .setFooter({ text: 'Thank you for helping improve UrbanRadar!' });

    await channel.send({ embeds: [embed] });
    console.log('Feature request guide posted successfully.');
  } catch (error) {
    console.error('Failed to post feature request guide:', error);
  } finally {
    client.destroy();
  }
});

client.login(process.env.DISCORD_TOKEN);
