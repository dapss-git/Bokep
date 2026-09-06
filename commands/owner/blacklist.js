if (!global.blacklist) global.blacklist = new Set();

const cleanNumber = (text) => text.replace(/[^0-9]/g, "");

const handler = async (m, {
    text,
    args,
    usedPrefix,
    command,
    db
}) => {
    const action = args[0]?.toLowerCase();

    if (!action || !["add", "del", "list"].includes(action))
        return m.reply(
            `╭─「 *BLACKLIST* 」\n` +
            `│ Perintah:\n` +
            `│  ${usedPrefix + command} add <nomor>\n` +
            `│  ${usedPrefix + command} del <nomor>\n` +
            `│  ${usedPrefix + command} list\n` +
            `╰─ Bot akan ignore semua pesan dari nomor blacklist.`
        );

    if (action === "list") {
        const dbList = db.data.settings?.blacklist || [];
        const allList = [...new Set([...global.blacklist, ...dbList])];
        if (allList.length === 0)
            return m.reply("📭 Belum ada nomor yang di-blacklist.");

        const teks =
            `╭─「 *BLACKLIST* 」\n` +
            `│ Total: *${allList.length}* nomor\n│\n` +
            allList.map((n, i) => `│ ${i + 1}. +${n}`).join("\n") +
            `\n╰────────────────`;
        return m.reply(teks);
    }

    const nomor = cleanNumber(args[1] || "");
    if (!nomor || nomor.length < 8)
        return m.reply("❌ Masukkan nomor yang valid. Contoh: 628xxxxxxxxxx");

    const ownerList = [
        ...(global.owner || []).map((j) => String(j).replace(/[^0-9]/g, "")),
        ...(db.data.owner || []).map((j) => String(j).replace(/[^0-9]/g, "")),
    ];
    if (ownerList.includes(nomor))
        return m.reply("❌ Tidak bisa blacklist nomor owner.");

    const settings = db.data.settings;
    if (!settings.blacklist) settings.blacklist = [];

    if (action === "add") {
        if (global.blacklist.has(nomor))
            return m.reply(`⚠️ Nomor *+${nomor}* sudah ada di blacklist.`);

        global.blacklist.add(nomor);
        if (!settings.blacklist.includes(nomor)) settings.blacklist.push(nomor);
        await db.save();

        m.reply(`✅ *+${nomor}* berhasil ditambahkan ke blacklist.\nBot akan mengabaikan semua pesan dari nomor ini.`);

    } else if (action === "del") {
        if (!global.blacklist.has(nomor))
            return m.reply(`⚠️ Nomor *+${nomor}* tidak ada di blacklist.`);

        global.blacklist.delete(nomor);
        settings.blacklist = settings.blacklist.filter((n) => n !== nomor);
        await db.save();

        m.reply(`✅ *+${nomor}* berhasil dihapus dari blacklist.`);
    }
};

handler.before = (m, {
    db
}) => {
    // Init dari database saat pertama kali
    if (!global.blacklist) global.blacklist = new Set();
    
    // Ensure database structure exists
    if (!db.data) db.data = {};
    if (!db.data.settings) db.data.settings = {};
    if (!db.data.settings.blacklist) db.data.settings.blacklist = [];
    
    let savedList = db.data.settings.blacklist;
    
    // Safe validation: ensure savedList is iterable
    if (!Array.isArray(savedList)) {
        try {
            savedList = Object.values(savedList || {});
        } catch {
            savedList = [];
        }
    }
    
    for (const n of savedList) {
        if (n) global.blacklist.add(String(n));
    }

    const senderNomor = m.sender?.split("@")[0];
    if (senderNomor && global.blacklist.has(senderNomor)) return false;
    return true;
};

handler.command = ["blacklist", "bl"];
handler.tags = "owner";
handler.description = "Blacklist nomor agar bot mengabaikan semua pesannya.";
handler.owner = true;
handler.register = true;

export default handler;