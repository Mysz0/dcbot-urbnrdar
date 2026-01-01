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

    const channel = guild.channels.cache.find(c => c.name === 'bug-reports');
    if (!channel || !channel.isTextBased()) throw new Error('Channel not found or is not text-based');

    const embed = new EmbedBuilder()
      .setTitle('Bug Reports')
      .setDescription('Found a bug in UrbanRadar? Report it here to help us fix it!')
      .addFields(
        { name: 'How to Report', value: 'Create a thread with a clear title describing the bug. Include steps to reproduce, expected behavior, and what actually happened.' },
        { name: 'Include', value: '• Device and OS (iOS/Android/Web)\n• App version or browser\n• Screenshots or screen recordings\n• Error messages if any\n• Steps to reproduce consistently' },
        { name: 'Priority', value: 'Critical bugs (crashes, data loss) get highest priority. Visual glitches or minor issues will be addressed based on severity.' },
        { name: 'Before Posting', value: 'Check existing threads to see if your bug is already reported. Add details to existing threads instead of creating duplicates.' }
      )
      .setColor(0xED4245)
      .setFooter({ text: 'Thank you for helping us squash bugs!' });

    await channel.send({ embeds: [embed] });
    console.log('Bug report guide posted successfully.');
  } catch (error) {
    console.error('Failed to post bug report guide:', error);
  } finally {
    client.destroy();
  }
});

client.login(process.env.DISCORD_TOKEN);
