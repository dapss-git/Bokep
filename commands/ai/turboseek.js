let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Use example: ${usedPrefix}${command} What is the capital of France?`);
    }

    try {
        await m.reply("⏳ Please wait, fetching results...");
        const url = global.API('theresav', '/ai/turboseek', {
            text
        }, 'apikey');
        const res = await fetch(url);
        const data = await res.json();

        if (data.status && data.result && data.result.answer) {
            let answer = `*Answer:* ${data.result.answer}\n\n*Sources:*\n`;
            if (data.result.sources && Array.isArray(data.result.sources)) {
                data.result.sources.forEach((source, index) => {
                    answer += `${index + 1}. ${source}\n`;
                });
            } else {
                answer += "No sources found.";
            }
            m.reply(answer);
        } else {
            m.reply("No results found or an error occurred.");
        }
    } catch (e) {
        console.error(e);
        m.reply(`An error occurred: ${e.message}`);
    }
};

handler.help = ["turboseek <query>"];
handler.tags = ["ai"];
handler.command = /^turboseek$/i;
handler.description = "Searches for answers using the Theresa AI TurboSeek API.";
handler.register = true;
handler.limit = true;

export default handler;