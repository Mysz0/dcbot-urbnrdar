import verifyUser from '../utils/verifyUser.js';

export default {
  data: {
    name: 'verify',
    description: 'Verify yourself to access community channels.'
  },

  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'Run this in a server.', ephemeral: true });
    const guild = interaction.guild;
    const member = interaction.member;
    const verifiedRoleId = '1456090889024835685';
    const result = await verifyUser(member, guild, verifiedRoleId);
    return interaction.reply({ content: result.message, ephemeral: true });
  }
};
