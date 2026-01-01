import { EmbedBuilder } from 'discord.js';

export default async function postWelcomeMessage(channel, guild) {
  const welcomeEmbed = new EmbedBuilder()
    .setTitle(`Welcome to ${guild.name}!`)
    .setDescription('Start here:')
    .addFields(
      { name: 'Read', value: 'Please read the pinned message in #rules' },
      { name: 'Get Access', value: 'Verify yourself in #verify and pick your color in #roles' },
      { name: 'Need Help?', value: 'Ask in #help with context and screenshots' }
    )
    .setColor(0xA855F7)
    .setFooter({ text: 'Our repo and docs: <link-to-repo>' });

  const msg = await channel.send({ embeds: [welcomeEmbed] });
  await msg.pin().catch(() => {});
  return msg;
}
