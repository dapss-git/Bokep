import moment from 'moment-timezone';
import chalk from 'chalk';

const handler = async (m, { text, usedPrefix, command, db, conn }) => {
    if (!text && !m.isGroup) {
        return m.reply(
            `Gunakan format:\n` +
            `${usedPrefix + command} <durasi> (di grup)\n` +
            `${usedPrefix + command} <group_id> <durasi>\n` +
            `${usedPrefix + command} <linkgrup> <durasi>\n\n` +
            `Contoh:\n` +
            `${usedPrefix + command} 30d\n` +
            `${usedPrefix + command} 120363422829135355@g.us 7d\n` +
            `${usedPrefix + command} https://chat.whatsapp.com/xxxx 7d\n\n` +
            `Durasi:\nd = hari | h = jam | m = menit`
        );
    }

    let groupId;

    // Ambil ID grup dari teks
    const idMatch = text.match(/(\d+@g\.us)/i);
    if (idMatch) groupId = idMatch[1];

    // Jika di grup dan tidak menyertakan link
    if (!groupId && m.isGroup && !text.includes("chat.whatsapp.com")) {
        groupId = m.chat;
    }

    // Jika menyertakan link grup WA
    if (!groupId && text.includes("chat.whatsapp.com")) {
        const code = text.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/i)?.[1];
        if (!code) return m.reply("Link grup tidak valid.");

        try {
            groupId = await conn.groupAcceptInvite(code);
        } catch {
            return m.reply("Gagal mengambil ID grup dari link.");
        }
    }

    if (!groupId) return m.reply("ID grup tidak ditemukan.");

    // Ambil durasi
    const durationMatch = text.match(/(\d+)([dhm])/i);
    if (!durationMatch) return m.reply("Format durasi salah.\nContoh: 30d | 12h | 45m");

    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();

    const durationMs = value * { d: 86400000, h: 3600000, m: 60000 }[unit];

    // Ambil data grup dari database, jika tidak ada buat baru
    let group = await db.data.chats[groupId];
    if (!group) {
        group = { id: groupId };
        db.data.chats[groupId] = group; db.save();
    }

    // Inisialisasi sewa
    group.sewa = group.sewa || { status: false, expired: 0, warned: false };

    // Set sewa aktif
    group.sewa.status = true;
    group.sewa.expired = Date.now() + durationMs;
    group.sewa.warned = false;

    // Simpan perubahan ke database
    db.data.chats[groupId] = group; 
    db.save();

    const expiredDate = moment(group.sewa.expired).tz("Asia/Jakarta").format("DD MMMM YYYY, HH:mm:ss");
    
    m.reply(
        `✅ *GRUP SEWA AKTIF*\n\n` +
        `👥 Group ID: ${groupId}\n` +
        `⏳ Durasi: ${value}${unit}\n` +
        `📆 Expired: ${expiredDate} WIB\n\n` +
        `💡 Bot akan otomatis keluar dari grup ketika sewa habis.`
    );
    
    console.log(chalk.green(`[SEWA] Grup ${groupId} disewa selama ${value}${unit}, expired: ${expiredDate}`));
};

handler.command = ["addsewa", "addsewagc"];
handler.tags = ["owner"];
handler.description = "Menambahkan sewa ke grup";
handler.owner = true;
handler.register = true;

export default handler;