const handler = async (m, { conn, text, usedPrefix, command, db }) => {
    if (!text) return m.reply(`Masukkan nama fitur yang ingin diaktifkan kembali di grup ini!\nContoh: ${usedPrefix + command} mangasusuku`);
    
    let pluginName = text.trim();
    if (!pluginName.endsWith('.js')) pluginName += '.js';

    const chat = db.data.chats[m.chat] || {};
    chat.bannedPlugin = chat.bannedPlugin || [];

    if (!chat.bannedPlugin.includes(pluginName)) {
        return m.reply(`Fitur *${pluginName.replace('.js', '')}* tidak sedang dalam keadaan dinonaktifkan di grup ini.`);
    }

    chat.bannedPlugin = chat.bannedPlugin.filter(p => p !== pluginName);
    if (db.save) await db.save();

    m.reply(`✅ Fitur *${pluginName.replace('.js', '')}* berhasil diaktifkan kembali!\nFitur sudah bisa digunakan seperti biasa di grup ini.`);
};

handler.help = ['unbanfitur <nama_fitur>'];
handler.tags = ['group'];
handler.command = ['unbanfitur', 'enablefitur', 'unbanplugin', 'enablecmd'];
handler.admin = true;
handler.group = true;

handler.register = true

export default handler;
