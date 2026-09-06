let handler = async (m, { conn, args, text, usedPrefix, command }) => {
    let who;
    
    if (m.isGroup) {
        who = m.mentionedJid?.[0] || m.quoted?.sender || args[0]?.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    } else {
        who = m.chat;
    }

    if (!who) {
        return m.reply(`❌ Tag/reply user atau masukkan nomor!\n\nContoh:\n${usedPrefix}${command} @tag\n${usedPrefix}${command} 628xxxxxxxx`);
    }

    const userJid = who.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    
    if (!global.db.data.users[userJid]) {
        global.db.data.users[userJid] = {};
    }

    const user = global.db.data.users[userJid];
    
    if (user.banned) {
        return m.reply(`⚠️ User ini sudah di-ban sebelumnya!`);
    }

    user.banned = true;
    user.bannedTime = Date.now();
    user.banReason = text || "Tidak ada alasan";

    global.db.save();

    const userName = await conn.getName(userJid);

    await m.reply(`✅ Berhasil ban user!\n\n👤 Name: ${userName}\n📌 ID: ${userJid.split("@")[0]}\n⚠️ Reason: ${user.banReason}\n\nUser ini tidak bisa menggunakan command bot lagi.`, null, { withPrefix: false });
};

handler.command = ["banuser", "banuser"];
handler.tags = ["owner"];
handler.description = "Ban user agar tidak bisa menggunakan command bot.";
handler.owner = true;
handler.register = true;

export default handler;
