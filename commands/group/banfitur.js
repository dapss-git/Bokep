const handler = async (m, { conn, text, usedPrefix, command, db }) => {
    if (!text) return m.reply(`Masukkan nama fitur yang ingin dinonaktifkan di grup ini!\nContoh: ${usedPrefix + command} mangasusuku`);
    
    let pluginName = text.trim();
    if (!pluginName.endsWith('.js')) pluginName += '.js';

    const chat = db.data.chats[m.chat] || {};
    chat.bannedPlugin = chat.bannedPlugin || [];

    if (chat.bannedPlugin.includes(pluginName)) {
        return m.reply(`Fitur *${pluginName.replace('.js', '')}* sudah dalam keadaan dinonaktifkan di grup ini.`);
    }

    chat.bannedPlugin.push(pluginName);
    if (db.save) await db.save();

    m.reply(`✅ Fitur *${pluginName.replace('.js', '')}* berhasil dinonaktifkan di grup ini!\nAnggota tidak akan bisa menggunakan fitur ini lagi di grup ini sebelum di-unban.`);
};

handler.help = ['banfitur <nama_fitur>'];
handler.tags = ['group'];
handler.command = ['banfitur', 'disablefitur', 'banplugin', 'disablecmd'];
handler.admin = true;
handler.group = true;

handler.register = true

export default handler;
