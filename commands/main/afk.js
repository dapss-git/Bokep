import { jidNormalizedUser } from "baileys";

if (!global.afkUsers) global.afkUsers = new Map();

const normalizeJid = (jid) => {
    if (!jid) return "";
    return jidNormalizedUser(jid);
};

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

const handler = async (m, {
    text,
    db
}) => {
    const senderJid = normalizeJid(m.sender);
    const user = db.data.users[senderJid];

    if (!user) return m.reply("Kamu belum terdaftar. Ketik .daftar dulu.");

    if (global.afkUsers.has(senderJid)) {
        const data = global.afkUsers.get(senderJid);
        const durasi = formatDuration(Date.now() - data.since);

        global.afkUsers.delete(senderJid);

        return m.reply(
            `👋 Kamu sudah kembali!\n` +
            `⏱️ AFK selama: ${durasi}`
        );
    }

    const reason = text?.trim() || "Tidak ada alasan";

    global.afkUsers.set(senderJid, {
        reason,
        since: Date.now(),
    });

    m.reply(
        `😴 Kamu sekarang AFK\n` +
        `📝 Alasan: ${reason}\n\n` +
        `Bot akan auto-reply jika kamu di-mention.\n` +
        `Ketik .afk lagi untuk menonaktifkan.`
    );
};

handler.before = async (m, {
    conn
}) => {
    if (m.isBaileys || m.fromMe) return true;
    if (!global.afkUsers || global.afkUsers.size === 0) return true;

    const senderJid = normalizeJid(m.sender);

    if (global.afkUsers.has(senderJid) && m.text) {
        const data = global.afkUsers.get(senderJid);
        const durasi = formatDuration(Date.now() - data.since);

        global.afkUsers.delete(senderJid);

        await conn.sendMessage(
            m.chat, {
                text: `👋 @${senderJid.split("@")[0]} sudah kembali!\n` +
                    `⏱️ AFK selama: ${durasi}`,
                mentions: [senderJid],
            }, {
                quoted: m
            }
        );

        return true;
    }

    const rawMentions = [
        ...(m.mentions || []),
        ...(m.quoted?.sender ? [m.quoted.sender] : [])
    ];

    const mentioned = [...new Set(rawMentions)].filter(Boolean);

    for (let jid of mentioned) {
        let v = conn.decodeJid(jid);
        if (v.endsWith('@lid') && conn.signalRepository?.lidMapping?.getPNForLID) {
            try {
                const pn = await conn.signalRepository.lidMapping.getPNForLID(v)
                if (pn) v = jidNormalizedUser(pn)
            } catch (e) {}
        }
        v = normalizeJid(v);

        if (!global.afkUsers.has(v)) continue;

        const data = global.afkUsers.get(v);
        const durasi = formatDuration(Date.now() - data.since);

        await conn.sendMessage(
            m.chat, {
                text: `😴 @${v.split("@")[0]} sedang AFK\n` +
                    `📝 Alasan: ${data.reason}\n` +
                    `⏱️ Sudah: ${durasi}`,
                mentions: [v],
            }, {
                quoted: m
            }
        );
    }

    return true;
};

handler.command = ["afk"];
handler.tags = "main";
handler.description = "Tandai diri AFK. Bot auto-reply jika kamu di-mention.";
handler.register = true;

export default handler;