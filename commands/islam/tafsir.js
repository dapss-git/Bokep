import * as cheerio from 'cheerio';

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Usage: ${usedPrefix}${command} <query>`);
    }

    try {
        global.loading(m, conn);
        const res = await fetch(`https://tafsirq.com/topik/${encodeURIComponent(text)}`);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.text();
        const $ = cheerio.load(data);
        const hasil = [];
        $('body > div:nth-child(4) > div > div.col-md-6 > div ').each(function(a, b) {
            let result = {
                surah: $(b).find('> div.panel-heading.panel-choco > div > div > a').text(),
                tafsir: $(b).find('> div.panel-body.excerpt').text().trim(),
                type: $(b).find('> div.panel-heading.panel-choco > div > div > span').text(),
                source: $(b).find('> div.panel-heading.panel-choco > div > div > a').attr('href')
            };
            hasil.push(result);
        });

        if (hasil.length === 0) {
            global.loading(m, conn, true);
            return m.reply('No tafsir found for that query.');
        }

        let message = '';
        hasil.forEach(item => {
            message += `Surah: ${item.surah}\n`;
            message += `Tafsir: ${item.tafsir}\n`;
            message += `Type: ${item.type}\n`;
            message += `Source: ${item.source}\n\n`;
        });
        global.loading(m, conn, true);
        m.reply(message);
    } catch (error) {
        global.loading(m, conn, true);
        console.error(error);
        m.reply(`An error occurred: ${error.message}`);
    }
};

handler.help = ['tafsir <query>'];
handler.tags = ['islam'];
handler.command = /^tafsir$/i;
handler.description = 'Get tafsir information from tafsirq.com';
handler.limit = true;
handler.register = true

export default handler;