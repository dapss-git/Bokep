let handler = async (m, {
    text,
    usedPrefix,
    command
}) => {
    if (!text) return m.reply(`Contoh: ${usedPrefix + command} harga bitcoin sekarang`);

    try {
        await m.reply("⏳ Memproses... (bisa sampai 30 detik)");

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const url = global.API('theresav', '/ai/ainvest', {
            text: text
        }, 'apikey');

        const res = await fetch(url, {
            signal: controller.signal
        });
        clearTimeout(timeout);

        const data = await res.json();

        if (!data.status) return m.reply("Gagal mengambil data.");

        let hasil = data.result
            .replace(/```[\s\S]*?```/g, '')
            .replace(/\[\^\d+\]/g, '')
            .replace(/\*\*/g, '')
            .replace(/---+/g, '')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/•/g, '-')
            .trim();

        if (hasil.length > 4000) {
            hasil = hasil.slice(0, 4000) + "\n\n... (dipotong)";
        }

        m.reply(hasil);

    } catch (e) {
        if (e.name === 'AbortError') {
            m.reply("⏱️ Waktu habis, coba lagi nanti.");
        } else {
            m.reply(`Error: ${e.message}`);
        }
    }
};

handler.help = ['ainvest <text>'];
handler.tags = ['ai'];
handler.command = /^(ainvest)$/i;
handler.register = true;
handler.limit = true;

export default handler;