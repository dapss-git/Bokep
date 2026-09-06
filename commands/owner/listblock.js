const handler = async (m, { conn, usedPrefix }) => {
    try {
        await global.loading(m, conn);
        const blocklist = await conn.fetchBlocklist();
        
        if (!blocklist || blocklist.length === 0) {
            return m.reply("📭 *Daftar Blokir Kosong.*");
        }

        let txt = `🚫 *DAFTAR NOMOR DIBLOKIR*\n\nTotal: ${blocklist.length} nomor\n\n`;
        blocklist.forEach((jid, i) => {
            txt += `*${i + 1}.* @${jid.split('@')[0]}\n`;
        });
        txt += `\n_Gunakan *${usedPrefix}unblock @user* untuk membuka blokir._`;

        await conn.sendMessage(m.chat, { 
            text: txt, 
            mentions: blocklist 
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply("❌ Gagal mengambil daftar blokir.");
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['listblock'];
handler.tags = ['owner'];
handler.command = /^(listblock|blocklist)$/i;
handler.owner = true;

export default handler;
