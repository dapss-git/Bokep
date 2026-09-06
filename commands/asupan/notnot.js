import { fileTypeFromBuffer } from 'file-type'
let handler = async (m, { conn, usedPrefix, command, Func }) => {
    await global.loading(m, conn);
    try {
        let apiUrl = global.API("theresav", "/asupan/notnot", {}, "apikey");
        
        
        let buffer = await Func.fetchBuffer(apiUrl);
        let type = await fileTypeFromBuffer(buffer);
        let mime = type ? type.mime : 'video/mp4';

        let messageData = { 
            caption: `✨ *ASUPAN NOTNOT*`,
            footer: global.footer,
            buttons: [
                {
                    buttonId: `${usedPrefix}${command}`,
                    buttonText: { displayText: 'Next ⏩' },
                    type: 1
                }
            ],
            viewOnce: true
        }

        if (mime.startsWith('image/')) {
            messageData.image = buffer;
        } else {
            messageData.video = buffer;
            messageData.gifPlayback = false;
        }

        await conn.sendMessage(m.chat, messageData, { quoted: m });

    } catch (e) {
        m.reply("❌ Error: " + e.message);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["notnot"];
handler.tags = ["asupan"];
handler.command = /^notnot$/i;
handler.register = true;
handler.limit = true;

export default handler;
