let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Silakan masukkan kata kunci pencarian.\nContoh: ${usedPrefix + command} kasih`);
    }

    try {
        await m.reply("⏳ Sedang mencari...");
        const query = encodeURIComponent(text);
        const url = global.API('theresav', '/search/bible', {
            q: query
        }, 'apikey');
        const res = await fetch(url);
        const data = await res.json();

        if (data.status && data.result && data.result.length > 0) {
            let message = `Hasil Pencarian Alkitab untuk "${text}":\n\n`;
            data.result.forEach((item, index) => {
                message += `${index + 1}. *${item.title}*\n`;
                message += `   _${item.text}_\n`;
                message += `   Link: ${item.link}\n\n`;
            });
            m.reply(message);
        } else {
            m.reply(`Tidak ditemukan hasil untuk "${text}".`);
        }
    } catch (error) {
        console.error(error);
        m.reply(`Terjadi kesalahan saat mencari: ${error.message}`);
    }
};

handler.help = ["bible <teks>"];
handler.tags = ["search"];
handler.command = /^bible$/i;
handler.description = "Mencari ayat Alkitab berdasarkan kata kunci.";
handler.register = true

export default handler;