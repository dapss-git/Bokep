import { jidNormalizedUser } from "baileys";

const formatDuration = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);

    if (d > 0) return `${d} hari ${h % 24} jam`;
    if (h > 0) return `${h} jam ${m % 60} menit`;
    if (m > 0) return `${m} menit ${s % 60} detik`;
    return `${s} detik`;
};

let handler = async (m, { conn }) => {
    if (!global.afkUsers || global.afkUsers.size === 0) return m.reply('Tidak ada user AFK saat ini.');

    let groupMetadata = m.metadata || await conn.groupMetadata(m.chat).catch(() => null);
    if (!groupMetadata) return m.reply('❌ Gagal mengambil data grup.');

    let participants = groupMetadata.participants.map(u => u.id);
    let afkList = [];

    for (let rawJid of participants) {
        if (rawJid.includes('@sessions/')) rawJid = rawJid.split('@')[0] + '@lid'
        
        let v = conn.decodeJid(rawJid)
        if (v.endsWith('@lid') && conn.signalRepository?.lidMapping?.getPNForLID) {
            try {
                const pn = await conn.signalRepository.lidMapping.getPNForLID(v)
                if (pn) v = jidNormalizedUser(pn)
            } catch (e) {}
        }

        if (global.afkUsers.has(v)) {
            let data = global.afkUsers.get(v);
            afkList.push({
                jid: v,
                reason: data.reason,
                since: data.since
            });
        }
    }

    if (afkList.length === 0) return m.reply('*Tidak ada user AFK di grup ini.*');

    let text = `*LIST AFK GRUP*\n\n`;
    text += afkList.map((u, i) => {
        return `${i + 1}. @${u.jid.split('@')[0]}\n   - Alasan: ${u.reason}\n   - Sejak: ${formatDuration(Date.now() - u.since)} yang lalu`;
    }).join('\n\n');

    await conn.sendMessage(m.chat, {
        text: text,
        mentions: afkList.map(u => u.jid)
    }, { quoted: m });
}

handler.help = ['listafk']
handler.tags = ['group']
handler.command = /^(listafk)$/i
handler.group = true

handler.register = true

export default handler
