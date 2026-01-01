import { ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
  data: {
    name: 'setup_server',
    description: 'Create roles, categories, channels, and pinned templates for the server'
  },
  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'You need the Manage Server permission to run this command.', ephemeral: true });
    }

    await interaction.reply({ content: 'Creating server structure (this may take a moment)...', ephemeral: true });
    const guild = interaction.guild;

    // Roles to create (name and permission bits)
    const rolesToCreate = [
      { name: 'Owner', permissions: [PermissionFlagsBits.Administrator] },
      { name: 'Admin', permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ViewAuditLog] },
      { name: 'Maintainer', permissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] },
      { name: 'Developer', permissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
      { name: 'Contributor', permissions: [PermissionFlagsBits.SendMessages] },
      { name: 'Node-Operator', permissions: [PermissionFlagsBits.SendMessages] },
      { name: 'Member', permissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel] }
    ];

    const createdRoles = {};
    for (const r of rolesToCreate) {
      let role = guild.roles.cache.find(x => x.name === r.name);
      if (!role) {
        role = await guild.roles.create({ name: r.name, permissions: r.permissions, reason: 'Server setup by bot' }).catch(e => null);
      }
      if (role) createdRoles[r.name] = role;
    }

    // Helper to create or fetch category
    async function ensureCategory(name) {
      let cat = guild.channels.cache.find(c => c.name === name && c.type === ChannelType.GuildCategory);
      if (!cat) cat = await guild.channels.create({ name, type: ChannelType.GuildCategory, reason: 'Server setup by bot' });
      return cat;
    }

    // Create categories and channels with overwrites
    // We'll reference roles by name from createdRoles
    const infoCat = await ensureCategory('information');
    const announcementsCat = await ensureCategory('announcements');
    const communityCat = await ensureCategory('community');
    const developmentCat = await ensureCategory('development');
    const releasesCat = await ensureCategory('releases-integrations');
    const opsCat = await ensureCategory('ops-status');

    // channel creation helper
    async function ensureTextChannel(name, parent, overwrites = []) {
      let ch = guild.channels.cache.find(c => c.name === name && c.parentId === parent.id && c.type === ChannelType.GuildText);
      if (!ch) ch = await guild.channels.create({ name, type: ChannelType.GuildText, parent: parent.id, permissionOverwrites: overwrites, reason: 'Server setup by bot' });
      return ch;
    }

    // Build some common overwrites: @everyone deny send on announcements
    const everyoneRole = guild.roles.everyone;

    const welcome = await ensureTextChannel('welcome', infoCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] },
      { id: createdRoles.Admin?.id || everyoneRole.id, allow: [PermissionFlagsBits.SendMessages] }
    ]);

    const rules = await ensureTextChannel('rules', infoCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages] },
      { id: createdRoles.Admin?.id || everyoneRole.id, allow: [PermissionFlagsBits.ManageMessages] }
    ]);

    const rolesCh = await ensureTextChannel('roles', infoCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages] },
      { id: createdRoles.Admin?.id || everyoneRole.id, allow: [PermissionFlagsBits.ManageMessages] }
    ]);

    const resources = await ensureTextChannel('resources', infoCat, [
      { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel] }
    ]);

    const announcements = await ensureTextChannel('announcements', announcementsCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages] },
      { id: createdRoles.Admin?.id || everyoneRole.id, allow: [PermissionFlagsBits.SendMessages] }
    ]);

    const releaseNotes = await ensureTextChannel('release-notes', announcementsCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages] }
    ]);

    const maintenance = await ensureTextChannel('maintenance', announcementsCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages] },
      { id: createdRoles.Maintainer?.id || everyoneRole.id, allow: [PermissionFlagsBits.SendMessages] }
    ]);

    const general = await ensureTextChannel('general', communityCat, [
      { id: everyoneRole.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }
    ]);

    const showcase = await ensureTextChannel('showcase', communityCat, [
      { id: everyoneRole.id, allow: [PermissionFlagsBits.SendMessages] }
    ]);

    const help = await ensureTextChannel('help', communityCat, [
      { id: everyoneRole.id, allow: [PermissionFlagsBits.SendMessages] }
    ]);

    const devChat = await ensureTextChannel('dev-chat', developmentCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: createdRoles.Developer?.id || everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: createdRoles.Admin?.id || everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel] }
    ]);

    const design = await ensureTextChannel('design', developmentCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: createdRoles.Developer?.id || everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ]);

    const codeSnippets = await ensureTextChannel('code-snippets', developmentCat, [
      { id: createdRoles.Developer?.id || everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ]);

    const featureRequests = await ensureTextChannel('feature-requests', developmentCat, [
      { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ]);

    const bugReports = await ensureTextChannel('bug-reports', developmentCat, [
      { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ]);

    const ciNotifications = await ensureTextChannel('ci-notifications', releasesCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages] }
    ]);

    const deployments = await ensureTextChannel('deployments', releasesCat, [
      { id: createdRoles.Maintainer?.id || everyoneRole.id, allow: [PermissionFlagsBits.SendMessages] }
    ]);

    const gitEvents = await ensureTextChannel('git-events', releasesCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages] }
    ]);

    const nodeRanking = await ensureTextChannel('node-ranking', opsCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages] }
    ]);

    const alerts = await ensureTextChannel('alerts', opsCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages] }
    ]);

    const incidents = await ensureTextChannel('incidents', opsCat, [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages] },
      { id: createdRoles.Maintainer?.id || everyoneRole.id, allow: [PermissionFlagsBits.SendMessages] }
    ]);

    // Post styled pinned templates (welcome and rules) to welcome and rules channels
    try {
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('Welcome to ' + guild.name + '!')
        .setDescription('Start here:')
        .addFields(
          { name: 'Read', value: 'Please read the pinned message in #rules' },
          { name: 'Get Access', value: 'Assign roles in #roles (use the role-assign message)' },
          { name: 'Need Help?', value: 'Ask in #help' }
        )
        .setFooter({ text: 'Our repo and docs: <link-to-repo>' });

      const rulesEmbed = new EmbedBuilder()
        .setTitle('Server rules')
        .setDescription('By joining this server you agree to the following:')
        .addFields(
          { name: '1', value: 'Be respectful. No harassment.' },
          { name: '2', value: 'Keep channels on-topic.' },
          { name: '3', value: 'No advertising without permission.' },
          { name: '4', value: 'Use #bug-reports and #feature-requests for issues and ideas.' },
          { name: '5', value: "Follow Discord's Terms of Service." }
        );

      const wmsg = await welcome.send({ embeds: [welcomeEmbed] });
      await wmsg.pin();
      const rmsg = await rules.send({ embeds: [rulesEmbed] });
      await rmsg.pin();
    } catch (err) {
      // ignore if can't post/pin because of permissions
    }

    await interaction.followUp({ content: 'Server setup complete. Review roles and channel order, and move the bot role appropriately.', ephemeral: true });
  }
};
