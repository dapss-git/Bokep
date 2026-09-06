const handler = async (m, { conn, db }) => {
    const chat = db.data.chats[m.chat] || {};
    const bannedPlugins = chat.bannedPlugin || [];

    if (bannedPlugins.length === 0) {
        return m.reply('✅ Saat ini tidak ada fitur yang dinonaktifkan di grup ini.');
    }

    let txt = `*📋 DAFTAR FITUR DINONAKTIFKAN DI GRUP INI*\n\n`;
    bannedPlugins.forEach((p, i) => {
        txt += `◦ ${i + 1}. ${p.replace('.js', '')}\n`;
    });
    txt += `\n_Gunakan .unbanfitur <nama_fitur> untuk mengaktifkannya kembali._`;

    m.reply(txt);
};

handler.help = ['listbanfitur'];
handler.tags = ['group'];
handler.command = ['listbanfitur', 'listdisable', 'bannedfitur'];
handler.admin = true;
handler.group = true;

handler.register = true

export default handler;
