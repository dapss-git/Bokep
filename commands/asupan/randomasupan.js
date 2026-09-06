import { fileTypeFromBuffer } from 'file-type'
let handler = async (m, { conn, usedPrefix, command, Func }) => {
    const ASUPAN_ENDPOINTS = [
        { name: "Bocil", path: "/asupan/bocil" },
        { name: "Ghea Yubi", path: "/asupan/gheayubi" },
        { name: "Kayes", path: "/asupan/kayes" },
        { name: "Notnot", path: "/asupan/notnot" },
        { name: "Onlyfans", path: "/asupan/onlyfans" },
        { name: "Panrika", path: "/asupan/panrika" },
        { name: "Santuy", path: "/asupan/santuy" },
        { name: "Tiktok Girl", path: "/asupan/tiktokgirl" },
        { name: "Ukhty", path: "/asupan/ukhty" },
        { name: "Bohay SMA", path: "/asupan/bohaysma" },
        { name: "Cewe Bohay", path: "/asupan/cewebohay" }
    ];

    const random = ASUPAN_ENDPOINTS[Math.floor(Math.random() * ASUPAN_ENDPOINTS.length)];
    
    await global.loading(m, conn);
    try {
        let apiUrl = global.API("theresav", random.path, {}, "apikey");
        
        
        let buffer = await Func.fetchBuffer(apiUrl);
        let type = await fileTypeFromBuffer(buffer);
        let mime = type ? type.mime : 'video/mp4';

        let messageData = { 
            caption: `✨ *RANDOM ASUPAN: ${random.name}*`,
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

handler.help = ["randomasupan"];
handler.tags = ["asupan"];
handler.command = /^(randomasupan|asupanrandom|asupan)$/i;
handler.register = true;
handler.limit = true;

export default handler;
