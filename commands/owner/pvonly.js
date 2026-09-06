const handler = async (m, {
    text,
    db,
    conn
}) => {
    if (!text) return m.reply("Contoh: .pvonly on / .pvonly off");

    const value = text.toLowerCase();
    if (!["on", "off"].includes(value)) return m.reply("Gunakan on atau off!");

    const isPvonly = value === 'on';
    const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot';
    if (typeof db.data.settings[botJidKey] !== 'object') db.data.settings[botJidKey] = {};
    db.data.settings[botJidKey].pvonly = isPvonly;
    await db.save();

    m.reply(`✅ Mode Private Only telah *${isPvonly ? "AKTIF" : "NONAKTIF"}*!`);
};

handler.command = ["pvonly"];
handler.tags = "owner";
handler.description = "Mengaktifkan/menonaktifkan mode private only (hanya bisa digunakan di private chat).";
handler.owner = true;
handler.register = true;

export default handler;
