export default {
  data: {
    name: 'post_templates',
    description: 'Posts pinned templates from the attachments file to the current channel'
  },
  async execute(interaction) {
    const content = `Welcome to <Server Name>!\n\nStart here:\n- Read the pinned message in #rules\n- Assign roles in #roles (react to get access)\n- If you need help, ask in #help\n\nOur repo and docs: <link-to-repo>`;
    await interaction.reply({ content: 'Posting templates and pinning them...', ephemeral: true });
    const msg = await interaction.channel.send(content);
    await msg.pin();

    const rules = `Server rules\n1) Be respectful. No harassment.\n2) Keep channels on-topic.\n3) No advertising without permission.\n4) Use #bug-reports and #feature-requests for issues and ideas.\n5) Follow Discord's Terms of Service.`;
    const rmsg = await interaction.channel.send(rules);
    await rmsg.pin();

    await interaction.followUp({ content: 'Templates posted and pinned.', ephemeral: true });
  }
};
