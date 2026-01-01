// Centralized verification logic for both command and button
export default async function verifyUser(member, guild) {
  // Always find Verified role by name (IDs change after purge)
  const vrole = guild.roles.cache.find(r => r.name === 'Verified');
  if (!vrole) {
    return { success: false, message: 'Verified role not available. Ask an admin.' };
  }
  if (member.roles.cache.has(vrole.id)) {
    return { success: false, message: 'You are already verified!' };
  }
  try {
    await member.roles.add(vrole.id);
    return { success: true, message: 'You are now verified!' };
  } catch (e) {
    return { success: false, message: 'Failed to verify you. Please try again later or contact an admin.' };
  }
}
