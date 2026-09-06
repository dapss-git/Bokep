let handler = async (m, { conn, usedPrefix, command }) => {
    let amprems = global.db.data.amprems || [];
    
    if (amprems.length === 0) {
        return m.reply("Belum ada data Alight Motion Premium yang tersimpan.");
    }

    let caption = `📊 *DAFTAR ALIGHT MOTION PREMIUM*\n\n`;
    
    // Sort by date (newest first)
    let sorted = amprems.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let total = sorted.length;
    let limit = 50;
    if (sorted.length > limit) {
        sorted = sorted.slice(0, limit);
        caption += `_Menampilkan ${limit} dari ${total} akun terbaru:_\n\n`;
    }
    
    sorted.forEach((item, i) => {
        let dateStr = '-';
        if (item.date) {
            const d = new Date(item.date);
            dateStr = d.toLocaleDateString('id-ID') + ' ' + d.toLocaleTimeString('id-ID');
        }
        
        caption += `*${i + 1}.* ${item.email}\n`;
        caption += `   ◦ *Status:* ${item.status === 'verified' ? '✅ Verified' : '⏳ Pending'}\n`;
        if (item.package) caption += `   ◦ *Paket:* ${item.package}\n`;
        caption += `   ◦ *Source:* ${item.source}\n`;
        caption += `   ◦ *Tanggal:* ${dateStr}\n\n`;
    });
    
    caption += `Total tersimpan: ${total} Akun`;

    m.reply(caption.trim());
};

handler.help = ['listamprem'];
handler.tags = ['owner'];
handler.command = /^listamprem$/i;
handler.owner = true;

export default handler;
