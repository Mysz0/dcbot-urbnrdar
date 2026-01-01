export default {
  data: {
    name: 'verify',
    description: 'Assigns the Verified role to the caller (creates role if missing)'
  },
  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });

    const guild = interaction.guild;
    const member = interaction.member;

    // Look for a Verified role, create if not exists
    let verified = guild.roles.cache.find(r => r.name.toLowerCase() === 'verified');
    if (!verified) {
      // create a low-privilege Verified role
      try {
        verified = await guild.roles.create({ name: 'Verified', reason: 'Created by bot for verification flow' });
      } catch (err) {
        console.error('failed to create verified role', err);
        return interaction.reply({ content: 'Could not create Verified role. Ask an admin to create it and try again.', ephemeral: true });
      }
    }

    // Prevent giving privileged roles via verify flow
    const privileged = ['owner', 'admin', 'maintainer', 'developer'];
    const devRole = guild.roles.cache.find(r => privileged.includes(r.name.toLowerCase()));
    if (devRole && member.roles.cache.has(devRole.id)) {
      return interaction.reply({ content: 'You already have a privileged role; verification not needed.', ephemeral: true });
    }

    if (member.roles.cache.has(verified.id)) {
      return interaction.reply({ content: 'You are already verified.', ephemeral: true });
    }

    await member.roles.add(verified.id).catch(() => null);
    return interaction.reply({ content: 'You are now verified. Welcome!', ephemeral: true });
  }
};
