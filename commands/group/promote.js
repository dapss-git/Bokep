const decodeJid = (jid) => jid ? jid.replace(/:.*$/, '') : jid;
const toNum = jid => (jid || '').replace(/[^0-9]/g, '');

const handler = async (m, {
    conn,
    text
}) => {
    let who = m.quoted ? m.quoted.sender :
        m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] :
        text ? (text.replace(/\D/g, '') + '@s.whatsapp.net') :
        '';

    if (!who || who === m.sender) return m.reply('❌ Reply / tag yang ingin di promote');

    const metadata = m.metadata;
    if (!metadata) return m.reply("⚠️ Metadata grup tidak ditemukan.");

    const botJid = decodeJid(conn.user?.id);

    const ownerNums = [
        metadata.owner,
        metadata.ownerPn,
        metadata.subjectOwner,
        metadata.subjectOwnerPn
    ].filter(Boolean).map(toNum);

    if (ownerNums.includes(toNum(who))) return m.reply("❌ Tidak bisa mempromote Owner Grup");
    if (toNum(who) === toNum(botJid)) return m.reply("❌ Tidak bisa mempromote Bot sendiri");

    try {
        await conn.groupParticipantsUpdate(m.chat, [who], 'promote');
        m.reply(`✔ Berhasil mempromote @${who.split("@")[0]}`, {
            mentions: [who]
        });
    } catch (e) {
        console.error("Promote Error:", e);
        m.reply("⚠️ Gagal mempromote pengguna. Pastikan bot admin dan target masih ada di grup.");
    }
};

handler.help = ['promote @tag'];
handler.tags = ['group'];
handler.command = ['promote', 'pm'];
handler.admin = true;
handler.group = true;
handler.botAdmin = true;
handler.register = true;

export default handler;