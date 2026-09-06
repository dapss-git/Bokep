let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} @blckrose/baileys`);

    await global.loading(m, conn);

    try {
        let api = global.API("theresav", "/stalk/npm", { name: text }, "apikey");
        let res = await fetch(api);
        let json = await res.json();

        if (!json?.status || !json?.result) {
            return m.reply("❌ Package tidak ditemukan atau nama salah.");
        }

        let r = json.result;

        let caption = `📦 *NPM PACKAGE STALK*\n\n`;
        caption += `📛 *Name:* ${r.name}\n`;
        caption += `🏷️ *Latest Version:* ${r.versionLatest}\n`;
        caption += `🆕 *First Version:* ${r.versionPublish}\n`;
        caption += `🔄 *Total Updates:* ${r.versionUpdate}\n`;
        caption += `📚 *Latest Dependencies:* ${r.latestDependencies}\n`;
        caption += `📥 *Initial Dependencies:* ${r.publishDependencies}\n\n`;
        
        caption += `📅 *First Published:* ${new Date(r.publishTime).toLocaleString('id-ID')}\n`;
        caption += `⏰ *Last Updated:* ${new Date(r.latestPublishTime).toLocaleString('id-ID')}\n\n`;

        caption += `🔗 *NPM Link:* https://www.npmjs.com/package/${r.name}\n\n`;
        caption += `> ${global.footer || "Stalker NPM"}`;

        await conn.sendMessage(m.chat, { text: caption }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["stalknpm <package_name>"];
handler.tags = ["stalk"];
handler.command = /^(stalknpm|npmstalk)$/i;

handler.register = true

export default handler;
