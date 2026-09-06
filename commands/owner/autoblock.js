const handler = async (m, {
    text,
    db,
    conn
}) => {
    if (!text) return m.reply("Contoh: .autoblock on / .autoblock off");

    const value = text.toLowerCase();
    if (!["on", "off"].includes(value)) return m.reply("Gunakan on atau off!");

    const isAutoblock = value === 'on';
    const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot';
    if (typeof db.data.settings[botJidKey] !== 'object') db.data.settings[botJidKey] = {};
    db.data.settings[botJidKey].autoblock = isAutoblock;
    await db.save();

    m.reply(`✅ Auto Block (Chat Pribadi) telah *${isAutoblock ? "AKTIF" : "NONAKTIF"}*!`);
};

handler.command = ["autoblock"];
handler.tags = "owner";
handler.description = "Mengaktifkan/menonaktifkan fitur auto block jika ada nomor yang chat ke bot (kecuali owner).";
handler.owner = true;
handler.register = true;

export default handler;
