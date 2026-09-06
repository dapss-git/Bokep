const handler = async (m, { conn, text, usedPrefix, command, store }) => {
    let jid = text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.chat;
    
    try {
        await global.loading(m, conn);

        // Fungsi untuk mengambil pesan terakhir di chat
        const getLastMessageInChat = async (jid) => {
            if (!store || !store.messages || !store.messages[jid]) return null;
            const messages = store.messages[jid].array();
            return messages.length > 0 ? messages[messages.length - 1] : null;
        };

        const lastMsgInChat = await getLastMessageInChat(jid);
        
        // Melakukan arsip chat
        await conn.chatModify({ 
            archive: true, 
            lastMessages: lastMsgInChat ? [lastMsgInChat] : [] 
        }, jid);

        m.reply(`✅ Berhasil mengarsipkan chat: *${jid.split('@')[0]}*`);

    } catch (e) {
        console.error(e);
        m.reply(`❌ Gagal mengarsipkan chat: ${e.message}`);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['archive <jid/nomor>'];
handler.tags = ['owner'];
handler.command = /^(archive|arsip)$/i;
handler.owner = true;

export default handler;
