let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    if (!text) return m.reply(`Masukkan URL subs4unlock!\nContoh: ${usedPrefix + command} https://subs4unlock.id/xxxxx`);

    try {
        await m.reply("⏳ Memproses...");

        const apiUrl = global.API('theresav', '/bypass/subs4unlock', {
            url: text
        }, 'apikey');

        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.status) {
            let message = `[ SUBS4UNLOCK BYPASS ]\n\n`;
            message += `Input URL: ${data.input}\n`;
            message += `Result URL: ${data.result}\n`;
            message += `Method: ${data.method}`;

            m.reply(message);
        } else {
            m.reply(`Gagal bypass URL.`);
        }

    } catch (error) {
        console.error(error);
        m.reply(`Terjadi kesalahan: ${error}`);
    }
};

handler.help = ["subs4unlock <url>"];
handler.tags = ["bypass"];
handler.command = /^subs4unlock$/i;
handler.description = "Bypass subs4unlock URL menggunakan Theresa API.";
handler.register = true;
handler.limit = true;

export default handler;