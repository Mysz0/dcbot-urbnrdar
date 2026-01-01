import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default async function postVerifyMessage(channel) {
  const verifyEmbed = new EmbedBuilder()
    .setTitle('Verify yourself')
    .setDescription('Press the button below to verify yourself and access community channels. If you are already verified, you will see a confirmation message.')
    .setColor(0x60A5FA);

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('verify_button').setLabel('Verify').setStyle(ButtonStyle.Primary)
  );

  const msg = await channel.send({ embeds: [verifyEmbed], components: [buttonRow] });
  return msg;
}
