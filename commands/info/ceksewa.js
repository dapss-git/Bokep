import moment from "moment-timezone";

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!m.isGroup) return m.reply("Perintah ini hanya dapat digunakan di dalam grup!");

    let group = global.db.data.chats[m.chat];
    if (!group || !group.sewa || !group.sewa.status) {
        return m.reply("Grup ini tidak memiliki status sewa aktif.");
    }

    let now = Date.now();
    let expired = group.sewa.expired;
    let sisa = expired - now;

    if (sisa <= 0) {
        return m.reply("Sewa grup ini telah berakhir.");
    }

    let formatExpired = moment(expired).tz("Asia/Jakarta").format("DD MMMM YYYY, HH:mm:ss");
    let hari = Math.floor(sisa / (24 * 60 * 60 * 1000));
    let jam = Math.floor((sisa % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    let menit = Math.floor((sisa % (60 * 60 * 1000)) / (60 * 1000));

    let groupName = await conn.getName(m.chat).catch(() => "Grup Tidak Diketahui");

    let caption = `📊 *CEK SEWA GRUP*\n\n` +
                  `🏠 *Grup:* ${groupName}\n` +
                  `📅 *Expired:* ${formatExpired}\n` +
                  `⏳ *Sisa Waktu:* ${hari} hari, ${jam} jam, ${menit} menit lagi.\n\n` +
                  `💡 _Bot akan otomatis keluar jika masa sewa sudah habis._`;

    await m.reply(caption);
}

handler.help = ["ceksewa"];
handler.tags = ["info"];
handler.command = /^(ceksewa)$/i;
handler.group = true;

handler.register = true

export default handler;