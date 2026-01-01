import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guildId = process.env.GUILD_ID;
  const verifyChannelId = '1456090910143152332';

  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) throw new Error('Guild not found');

    const verifyChannel = guild.channels.cache.get(verifyChannelId);
    if (!verifyChannel || !verifyChannel.isTextBased()) throw new Error('Verify channel not found or is not text-based');

    const updatedEmbed = new EmbedBuilder()
      .setTitle('Verify Yourself')
      .setDescription('Press the button below to verify yourself and access community channels. If you are already verified, you will see a confirmation message.')
      .setColor(0x60A5FA);

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verify_button').setLabel('Verify').setStyle(ButtonStyle.Primary)
    );

    const sentMsg = await verifyChannel.send({ embeds: [updatedEmbed], components: [buttonRow] });
    console.log('New verify message sent! Message ID:', sentMsg.id);
  } catch (error) {
    console.error('Failed to send the verify message:', error);
  } finally {
    client.destroy();
  }
});

client.login(process.env.DISCORD_TOKEN);