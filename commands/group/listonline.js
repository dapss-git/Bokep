const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!m.isGroup) return m.reply("Perintah ini hanya dapat digunakan di dalam grup!");

    try {
        const id = m.chat;
        const presences = (conn.presences ? conn.presences[id] : {}) || {};
        const participants = m.metadata?.participants || [];
        const users = global.db.data.users || {};
        const now = Date.now();
        const activeThreshold = 10 * 60 * 1000; // 10 menit terakhir

        let activeUsers = new Map();

        // 1. Ambil dari real-time presence WhatsApp
        for (const jid in presences) {
            const status = presences[jid]?.lastKnownPresence;
            if (status === 'available' || status === 'composing' || status === 'recording') {
                if (participants.some(p => p.id === jid || p.lid === jid)) {
                    activeUsers.set(jid, {
                        jid,
                        status: status === 'composing' ? 'Sedang mengetik...' : status === 'recording' ? 'Sedang merekam audio...' : 'Online'
                    });
                }
            }
        }

        // 2. Ambil dari database (Aktivitas Chat Terakhir)
        participants.forEach(p => {
            const jid = p.id;
            if (activeUsers.has(jid)) return; // Lewati jika sudah ada di list presence
            
            const userData = users[jid];
            if (userData && userData.lastChat && (now - userData.lastChat < activeThreshold)) {
                activeUsers.set(jid, {
                    jid,
                    status: 'Aktif baru-baru ini'
                });
            }
        });

        const onlineList = Array.from(activeUsers.values());

        if (onlineList.length === 0) {
            return m.reply("📭 *Tidak ada anggota yang terdeteksi aktif saat ini.*\n\n_Tips: Status akan muncul jika anggota mengirim pesan atau sedang membuka chat._");
        }

        let txt = `🟢 *DAFTAR ANGGOTA AKTIF*\n\n`;
        onlineList.forEach((user, i) => {
            txt += `*${i + 1}.* @${user.jid.split('@')[0]} [ _${user.status}_ ]\n`;
        });
        txt += `\nTotal: ${onlineList.length} anggota terdeteksi.`;

        await conn.sendMessage(m.chat, { 
            text: txt, 
            mentions: onlineList.map(u => u.jid) 
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply("❌ Gagal mengambil daftar anggota online.");
    }
};

handler.help = ['listonline'];
handler.tags = ['group'];
handler.command = /^(listonline|here|online)$/i;
handler.group = true;

export default handler;
