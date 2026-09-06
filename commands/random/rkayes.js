import { fileTypeFromBuffer } from 'file-type';

let handler = async (m, { conn, usedPrefix, command, Func }) => {
    await global.loading(m, conn);
    try {
        let apiUrl = global.API("theresav", "/random/kayes", {}, "apikey");

        let buffer = await Func.fetchBuffer(apiUrl);
        let { mime } = await fileTypeFromBuffer(buffer);
        let isVideo = mime.startsWith('video/');

        await conn.sendMessage(m.chat, { 
            [isVideo ? 'video' : 'image']: buffer, 
            caption: `✨ *RANDOM KAYES*`,
            footer: global.footer,
            buttons: [{ buttonId: `${usedPrefix}${command}`, buttonText: { displayText: 'Next ⏩' }, type: 1 }],
            viewOnce: true
        }, { quoted: m });

    } catch (e) {
        m.reply("❌ Error: " + e.message);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["rkayes"];
handler.tags = ["random"];
handler.command = /^rkayes$/i;
handler.register = true;
handler.limit = true;

export default handler;