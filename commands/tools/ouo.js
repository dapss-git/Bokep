let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Kirim perintah dengan URL. Contoh: ${usedPrefix}${command} https://vt.tiktok.com/ZSUckmNt8/`);
    }

    try {
        await m.reply("⏳ Memproses...");
        const apiUrl = global.API('theresav', '/tools/ouo', {
            url: text
        }, 'apikey');
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.status) {
            m.reply(`URL Asli: ${data.input}\nURL Pendek: ${data.result}`);
        } else {
            m.reply(`Terjadi kesalahan: ${JSON.stringify(data)}`);
        }
    } catch (error) {
        console.error(error);
        m.reply(`Terjadi kesalahan. Pastikan URL sudah benar.\n\n${String(error)}`);
    }
};

handler.help = ["ouo <url>"];
handler.tags = ["tools"];
handler.command = /^ouo$/i;
handler.description = "Memendekkan URL menggunakan ouo.io";
handler.limit = true;
handler.register = true;

export default handler;