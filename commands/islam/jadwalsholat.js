let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} Jakarta\n${usedPrefix + command} Surabaya`);
    
    await global.loading(m, conn);
    try {
        let api = global.API("theresav", "/islam/jadwalsholat", { q: text }, "apikey");
        let res = await fetch(api);
        let json = await res.json();

        if (!json?.status || !json?.result) {
            return m.reply("❌ Kota tidak ditemukan.");
        }

        let r = json.result;
        let t = r.today;

        let caption = `🕌 *JADWAL SHOLAT*\n\n`;
        caption += `📍 *Kota:* ${r.cityName}\n`;
        caption += `📅 *Tanggal:* ${r.date}\n`;
        caption += `🌙 *Hijriyah:* ${t.hijriyah}\n\n`;
        
        caption += `• Imsyak: ${t.imsyak}\n`;
        caption += `• Subuh: ${t.subuh}\n`;
        caption += `• Terbit: ${t.terbit}\n`;
        caption += `• Dhuha: ${t.dhuha}\n`;
        caption += `• Dzuhur: ${t.dzuhur}\n`;
        caption += `• Ashar: ${t.ashar}\n`;
        caption += `• Maghrib: ${t.maghrib}\n`;
        caption += `• Isya: ${t.isya}\n\n`;

        caption += `> ${global.footer}`;

        await conn.sendMessage(m.chat, { 
            text: caption
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["jadwalsholat <kota>"];
handler.tags = ["islam"];
handler.command = /^(jadwalsholat|sholat|sholatjadwal)$/i;
handler.register = true;

export default handler;
