import { EmbedBuilder } from 'discord.js';
import rules from '../config/rules.js';

async function postRuleMessages(channel, { pinIntro = false } = {}) {
  const introEmbed = new EmbedBuilder()
    .setTitle('Server Rules & Safety')
    .setDescription('By participating you agree to follow the server rules below. Staff may update rules and enforce action on behavior that harms the community even if not verbatim listed.')
    .setFooter({ text: 'Read everything, stay respectful, keep the server safe.' });

  const introMessage = await channel.send({ embeds: [introEmbed] });
  if (pinIntro) {
    await introMessage.pin().catch(() => null);
  }

  for (const rule of rules) {
    const embed = new EmbedBuilder()
      .setTitle(`Rule ${rule.number}: ${rule.title}`)
      .setDescription(rule.description);
    await channel.send({ embeds: [embed] });
  }

  const reminderEmbed = new EmbedBuilder()
    .setTitle('Need help or spot a problem?')
    .setDescription('Use #help for support questions and ping or DM staff for urgent safety issues. Report scams, harassment, leaks, or ToS violations immediately.');
  await channel.send({ embeds: [reminderEmbed] });

  return { introMessage };
}

export { postRuleMessages, rules };
export default postRuleMessages;
