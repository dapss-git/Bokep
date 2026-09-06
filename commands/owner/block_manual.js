const handler = async (m, { conn, text, usedPrefix, command }) => {
    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;
    if (!who) return m.reply(`Tag atau balas orang yang ingin di ${command}!\n\nContoh: ${usedPrefix + command} @user`);

    const type = command === 'block' ? 'block' : 'unblock';
    
    try {
        await conn.updateBlockStatus(who, type);
        m.reply(`✅ Berhasil ${type === 'block' ? 'memblokir' : 'membuka blokir'} ${who.split('@')[0]}.`);
    } catch (e) {
        console.error(e);
        m.reply(`❌ Gagal melakukan ${type}.`);
    }
};

handler.help = ['block', 'unblock'];
handler.tags = ['owner'];
handler.command = /^(block|unblock)$/i;
handler.owner = true;

export default handler;
