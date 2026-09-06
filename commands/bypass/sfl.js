let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(
            `Masukkan URL sfl.gl yang ingin di bypass!\nContoh: ${usedPrefix + command} https://sfl.gl/5jfhStXT`
        );
    }

    try {
        await m.reply("⏳ Memproses...");

        const apiUrl = global.API(
            'theresav',
            '/bypass/sfl', {
                url: text
            },
            'apikey'
        );

        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data?.status === true) {
            const original_url = data?.original_url || data?.data?.original_url || text;
            const bypassed_url = data?.bypassed_url || data?.result || data?.data?.bypassed_url;

            if (bypassed_url) {
                let message = `[ SFL BYPASS ]\n\n`;
                message += `Original URL: ${original_url}\n`;
                message += `Bypassed URL: ${bypassed_url}`;
                if (data?.execution_time_ms) {
                    message += `\nExecution Time: ${data.execution_time_ms} ms`;
                }

                return conn.sendMessage(
                    m.chat, {
                        text: message
                    }, {
                        quoted: m
                    }
                );
            }
        }

        return m.reply(
            `Gagal memproses URL.\nResponse:\n${JSON.stringify(data, null, 2)}`
        );

    } catch (error) {
        console.error(error);

        return conn.sendMessage(
            m.chat, {
                text: `Terjadi kesalahan:\n${error.message || error}`
            }, {
                quoted: m
            }
        );
    }
};

handler.help = ["sfl <url>"];
handler.tags = ["bypass"];
handler.command = /^(sfl)$/i;
handler.description = "Bypass sfl.gl URL menggunakan Theresa API.";
handler.register = true;
handler.limit = true;

export default handler;