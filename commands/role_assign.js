export default {
  data: {
    name: 'role_assign',
    description: 'Sends a message with reaction roles for common roles.'
  },
  async execute(interaction) {
    const content = `React to this message to get roles:\n\n🛠️ Developer\n🎮 Member`;
    await interaction.reply({ content: 'Posting role-assign message...', ephemeral: true });
    const msg = await interaction.channel.send(content);
    await msg.react('🛠️');
    await msg.react('🎮');
    await interaction.followUp({ content: 'Role-assign message posted. React to get roles.', ephemeral: true });
  }
};
