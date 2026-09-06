import crypto from 'crypto';

const handler = async (m, { conn, text, args, usedPrefix, command }) => {
  try {
    const length = parseInt(text) || 16;

    if (length < 4 || length > 128) {
      return m.reply(`❌ Password length must be between 4 and 128 characters.\n\nUsage: ${usedPrefix}password [length]\nExample: ${usedPrefix}password 20`);
    }

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    const randomBytes = crypto.randomBytes(length - 4);
    for (let i = 0; i < length - 4; i++) {
      password += allChars[randomBytes[i] % allChars.length];
    }

    password = password.split('').sort(() => Math.random() - 0.5).join('');

    const strength = getPasswordStrength(password);

    const message = `╭───「 *PASSWORD GENERATOR* 」───⬣
│
│ 🔑 *Generated Password:*
│ \`${password}\`
│
│ 📊 *Length:* ${length} characters
│ 💪 *Strength:* ${strength}
│
│ ⚠️ Save this password securely!
│
╰─────────────────────⬣`;

    await conn.sendMessage(m.chat, {
      text: message
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply('❌ Error generating password!');
  }
};

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'Weak';
  if (score <= 4) return 'Medium';
  if (score <= 5) return 'Strong';
  return 'Very Strong';
}

handler.command = ['password', 'passwordgen', 'genpassword', 'passgen'];
handler.help = ['password [length]'];
handler.tags = ['tools'];
handler.exp = 5;
handler.limit = true;

handler.register = true

export default handler;
