const cleanNumber = (text) => text.replace(/[^0-9]/g, "");

const handler = async (m, {
    text,
    conn,
    db
}) => {
    if (!text)
        return m.reply(
            `Gunakan format:\n*.ceksesi <nomor>*\n\nContoh:\n*.ceksesi 628xxxxxxxxxx*`
        );

    const nomor = cleanNumber(text);
    if (!nomor) return m.reply("❌ Nomor tidak valid.");

    const jid = nomor + "@s.whatsapp.net";

    // Cek apakah itu bot utama
    const botNomor = conn.user?.id?.split(":")[0] || conn.user?.id?.split("@")[0];
    const isMainBot = nomor === botNomor;

    // Cek jadibot
    const isJadibot = global.jadibotSessions?.has(nomor);
    const jadibotSession = isJadibot ? global.jadibotSessions.get(nomor) : null;

    // Cek di database (terdaftar sebagai user)
    const userDb = db.data.users[jid];
    const isRegistered = !!userDb?.register;
    const isPremium = !!userDb?.premium?.status;
    const isBanned = !!userDb?.banned?.status;

    // Cek owner
    const ownerList = [
        ...(global.owner || []).map((j) => String(j).replace(/[^0-9]/g, "")),
        ...(db.data.owner || []).map((j) => String(j).replace(/[^0-9]/g, "")),
    ];
    const isOwner = ownerList.includes(nomor);

    let status = [];
    if (isMainBot) status.push("🤖 Bot Utama");
    if (isJadibot) status.push("🔌 Jadibot Aktif");
    if (isOwner) status.push("👑 Owner");
    if (isPremium) status.push("⭐ Premium");
    if (isBanned) status.push("🚫 Banned");
    if (isRegistered && !isOwner && !isPremium) status.push("✅ User Terdaftar");
    if (!isMainBot && !isJadibot && !userDb) status.push("❓ Tidak ditemukan");

    let teks =
        `╭─「 *CEK SESI* 」\n` +
        `│ 📱 Nomor: *+${nomor}*\n` +
        `│\n` +
        `│ Status:\n` +
        status.map((s) => `│  ${s}`).join("\n") +
        `\n`;

    if (isJadibot && jadibotSession) {
        const user = jadibotSession.conn?.user;
        const nama = user?.name || user?.notify || "-";
        const grupCount = Object.keys(jadibotSession.store?.groupMetadata || {}).length;
        const uptime = jadibotSession.startedAt ?
            Math.floor((Date.now() - jadibotSession.startedAt) / 60000) + " menit" :
            "?";
        teks +=
            `│\n` +
            `│ 🔌 Info Jadibot:\n` +
            `│  👤 Nama: *${nama}*\n` +
            `│  👥 Grup: *${grupCount}*\n` +
            `│  ⏱️ Uptime: *${uptime}*\n`;
    }

    teks += `╰────────────────`;
    m.reply(teks);
};

handler.command = ["ceksesi"];
handler.tags = "owner";
handler.description = "Cek status sesi nomor tertentu (bot utama, jadibot, user, owner).";
handler.owner = true;
handler.register = true;

export default handler;