import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import rules from '../config/rules.js';

export default {
  data: {
    name: 'post_rules',
    description: 'Post the full ruleset to the current channel'
  },
  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'This command must be run in a server channel.', ephemeral: true });
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'You need the Manage Server permission to post rules.', ephemeral: true });
    }

    await interaction.reply({ content: 'Posting the ruleset here...', ephemeral: true });

    try {
      const introEmbed = new EmbedBuilder()
        .setTitle('Server Rules')
        .setDescription('Please read and follow the rules below to ensure a safe and constructive community.')
        .setColor(0x60A5FA);

      const ruleEmbeds = rules.map(rule => {
        return new EmbedBuilder()
          .setTitle(`Rule ${rule.number}: ${rule.title}`)
          .setDescription(rule.description)
          .setColor(0x60A5FA);
      });

      const introMessage = await interaction.channel.send({ embeds: [introEmbed] });
      await introMessage.pin().catch(() => {});

      for (const embed of ruleEmbeds) {
        await interaction.channel.send({ embeds: [embed] });
      }

      await interaction.followUp({ content: 'Rules posted.', ephemeral: true });
    } catch (error) {
      console.error('Failed to post rules:', error);
      await interaction.followUp({ content: 'Failed to post rules. Please try again later.', ephemeral: true });
    }
  }
};
