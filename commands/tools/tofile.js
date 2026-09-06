import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, text, args }) => {
  if (!args[0]) return m.reply('❌ Cara penggunaan:\n.tofile namafile.ext\n\nContoh: .tofile tes.html atau .tofile script.js');

  let q = m.quoted ? m.quoted : m;
  let fileName = args[0].trim();

  // Validasi ekstensi file
  const allowedExtensions = ['js', 'html', 'htm', 'css', 'json', 'txt', 'md', 'py', 'php', 'xml', 'yaml', 'yml', 'sh', 'bat', 'sql', 'rb', 'pl', 'c', 'cpp', 'java', 'go'];
  const ext = fileName.split('.').pop().toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return m.reply(`❌ Ekstensi .${ext} tidak didukung!\n\nEkstensi yang diizinkan:\n${allowedExtensions.map(e => '.' + e).join(', ')}`);
  }

  // Validasi nama file
  if (!/^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/.test(fileName)) {
    return m.reply('❌ Nama file tidak valid! Gunakan hanya huruf, angka, titik, strip, dan underscore.');
  }

  let messageText = '';

  // Jika ada quoted message, ambil text dari quoted
  if (m.quoted) {
    if (m.quoted.text) {
      messageText = m.quoted.text;
    } else {
      return m.reply('❌ Pesan yang di-reply tidak mengandung teks!');
    }
  } else {
    // Jika tidak ada quoted, gunakan text setelah command
    if (text) {
      messageText = text.replace(fileName, '').trim();
    }
  }

  if (!messageText) {
    return m.reply('❌ Tidak ada konten untuk disimpan!\n\nReply pesan yang berisi teks/kode, lalu ketik:\n.tofile namafile.ext');
  }

  // Simpan file ke direktori tmp
  const filePath = path.join(process.cwd(), 'tmp', fileName);

  try {
    fs.writeFileSync(filePath, messageText, 'utf-8');
    
    const fileSize = fs.statSync(filePath).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);

    await m.reply(`✅ File berhasil disimpan!\n\n📄 Nama: ${fileName}\n📦 Ukuran: ${fileSizeKB} KB\n📂 Lokasi: tmp/${fileName}`);

    // Kirim file sebagai dokumen
    await conn.sendMessage(m.chat, {
      document: { url: filePath },
      mimetype: getMimeType(ext),
      fileName: fileName,
      caption: `📄 *${fileName}*\n📦 Ukuran: ${fileSizeKB} KB`
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    return m.reply('❌ Gagal menyimpan file!');
  }
};

function getMimeType(ext) {
  const mimeTypes = {
    'js': 'application/javascript',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'json': 'application/json',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'py': 'text/x-python',
    'php': 'application/x-httpd-php',
    'xml': 'application/xml',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    'sh': 'application/x-sh',
    'bat': 'application/x-msdownload',
    'sql': 'application/sql',
    'rb': 'application/x-ruby',
    'pl': 'application/x-perl',
    'c': 'text/x-c',
    'cpp': 'text/x-c++',
    'java': 'text/x-java',
    'go': 'text/x-go'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

handler.help = ['tofile'];
handler.tags = ['tools'];
handler.command = /^(tofile|tf)$/i;
handler.description = 'Convert pesan/text ke file (reply pesan lalu ketik .tofile namafile.ext)';
handler.limit = true;
handler.register = true;

export default handler;
