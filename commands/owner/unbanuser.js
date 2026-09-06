let handler = async (m, { conn, args, usedPrefix, command }) => {
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
        return m.reply(`⚠️ User tidak ditemukan di database!`);
    }

    const user = global.db.data.users[userJid];
    
    if (!user.banned) {
        return m.reply(`✅ User ini tidak sedang di-ban!`);
    }

    user.banned = false;
    user.bannedTime = null;
    user.banReason = null;

    global.db.save();

    const userName = await conn.getName(userJid);
    
    await m.reply(`✅ Berhasil unban user!\n\n👤 Name: ${userName}\n📌 ID: ${userJid.split("@")[0]}\n\nUser ini sekarang bisa menggunakan command bot.`);
};

handler.command = ["unbanuser", "unbanuser"];
handler.tags = ["owner"];
handler.description = "Unban user agar bisa menggunakan command bot kembali.";
handler.owner = true;
handler.register = true;

export default handler;
