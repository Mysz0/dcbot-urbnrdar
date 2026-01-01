import { ChannelType, PermissionFlagsBits } from 'discord.js';

export default {
  data: {
    name: 'teardown_server',
    description: 'Remove channels/categories created by setup. Must be confirmed.' ,
    options: [
      { name: 'confirm', type: 5, description: 'Check to confirm deletion', required: true }
    ]
  },
  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'Run this command in a server.', ephemeral: true });
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: 'You need Manage Server permission.', ephemeral: true });

    const confirm = interaction.options.getBoolean('confirm', true);
    if (!confirm) return interaction.reply({ content: 'Teardown cancelled (confirm required).', ephemeral: true });

    await interaction.reply({ content: 'Starting teardown. Deleting known channels and categories...', ephemeral: true });
    const guild = interaction.guild;

    const categories = ['information','announcements','community','development','releases-integrations','ops-status'];
    const channels = [
      'welcome','rules','roles','resources','announcements','release-notes','maintenance','general','showcase','help',
      'dev-chat','design','code-snippets','feature-requests','bug-reports','ci-notifications','deployments','git-events','node-ranking','alerts','incidents'
    ];

    // delete channels
    for (const chName of channels) {
      const ch = guild.channels.cache.find(c => c.name === chName && c.type === ChannelType.GuildText);
      if (ch) {
        try { await ch.delete('Teardown requested'); } catch(e) { /* ignore */ }
      }
    }

    // delete categories
    for (const catName of categories) {
      const cat = guild.channels.cache.find(c => c.name === catName && c.type === ChannelType.GuildCategory);
      if (cat) {
        try { await cat.delete('Teardown requested'); } catch(e) { /* ignore */ }
      }
    }

    await interaction.followUp({ content: 'Teardown finished. Some channels or categories may remain if they did not match expected names.', ephemeral: true });
  }
};
