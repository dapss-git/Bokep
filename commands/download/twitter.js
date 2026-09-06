let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    if (!text) return m.reply(`Usage: ${usedPrefix}${command} <twitter_url>`);

    try {
        const url = global.API('theresav', '/download/twitter', {
            url: text
        }, 'apikey');
        const res = await fetch(url);
        const data = await res.json();

        if (data.status) {
            const result = data.result;
            let caption = `*${result.videoTitle}*\n\n${result.videoDescription}\n\n*Download Link:* ${result.downloadLink}`;
            await conn.sendMessage(m.chat, {
                video: {
                    url: result.downloadLink
                },
                caption: caption
            }, {
                quoted: m
            });
        } else {
            m.reply('Failed to fetch data from API.');
        }
    } catch (e) {
        console.error(e);
        m.reply(`An error occurred: ${e.message}`);
    }
};

handler.help = ["twitter <url>"];
handler.tags = ["downloader"];
handler.command = /^(twitter|x)$/i;
handler.description = "Downloads video from Twitter.";
handler.register = true
handler.limit = true;

export default handler;