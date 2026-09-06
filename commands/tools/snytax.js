import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import syntaxerror from 'syntax-error';

const handler = async (m) => {
  function scanJS(dir) {
    const res = [];
    for (const file of readdirSync(dir)) {
      const full = join(dir, file);
      if (['node_modules', 'auth'].includes(file)) continue;
      if (statSync(full).isDirectory()) {
        res.push(...scanJS(full));
      } else if (full.endsWith('.js') || full.endsWith('.cjs') || full.endsWith('.ts')) {
        res.push(full);
      }
    }
    return res;
  }

  const files = scanJS('./');
  const hasil = [];

  for (const file of files) {
    let code;
    try {
      code = readFileSync(file, 'utf8');
    } catch (e) {
      hasil.push(`📄 *File: ${file.replace('./', '')}*\n🚫 *Tidak bisa dibaca: ${e.message}*`);
      continue;
    }

    const err = syntaxerror(code, file, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true
    });

    if (err) {
      hasil.push([
        `🍓 *File: ${file.replace('./', '')}*`,
        `🍩 *Error: ${err.name}*`,
        `🍬 *Baris: ${err.line ?? '-'}, Kolom: ${err.column ?? '-'}*`,
        `🍰 *Pesan: _${err.message}_*`,
        `🧁 *Cuplikan:*\n\n\`\`\`${err.annotated?.trim().slice(0, 300) ?? ''}\`\`\``
      ].join('\n'));
    }
  }

  if (!hasil.length) return m.reply('🍦 *Semua file JavaScript/TypeScript aman, tidak ditemukan syntax error.*');
  m.reply(`🍫 *Ditemukan error syntax:*\n\n${hasil.join('\n\n')}`);
};

handler.help = ['syntaxcheck'];
handler.tags = ['tools'];
handler.command = ['syntaxcheck', 'syntax'];
handler.owner = true;
handler.limit = true;
handler.register = true;

export default handler;
