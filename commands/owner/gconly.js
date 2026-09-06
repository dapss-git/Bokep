const handler = async (m, {
    text,
    db,
    conn
}) => {
    if (!text) return m.reply("Contoh: .gconly on / .gconly off");

    const value = text.toLowerCase();
    if (!["on", "off"].includes(value)) return m.reply("Gunakan on atau off!");

    const isGconly = value === 'on';
    const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot';
    if (typeof db.data.settings[botJidKey] !== 'object') db.data.settings[botJidKey] = {};
    db.data.settings[botJidKey].gconly = isGconly;
    await db.save();

    m.reply(`✅ Mode Group Only telah *${isGconly ? "AKTIF" : "NONAKTIF"}*!`);
};

handler.command = ["gconly"];
handler.tags = "owner";
handler.description = "Mengaktifkan/menonaktifkan mode group only (hanya bisa digunakan di grup).";
handler.owner = true;
handler.register = true;

export default handler;
