import {
    jidDecode
} from "baileys";

const decodeJid = (jid) => {
    if (!jid) return jid;
    try {
        const decode = jidDecode(jid);
        return decode?.user && decode?.server ? decode.user + "@" + decode.server : jid;
    } catch {
        return jid;
    }
};

let handler = async (m, {
    conn
}) => {
    if (!global.db.data.users[m.jid]) {
        global.db.data.users[m.jid] = {
            name: conn.getName(m.jid),
            register: false,
            premium: {
                status: false,
                expired: 0
            },
            limit: 0,
            command: 0,
            commandTotal: 0,
            commandLimit: 50,
            level: 0
        };
    }

    const user = global.db.data.users[m.jid];

    const senderNum = m.sender.split("@")[0];
    const ownerList = (global.owner || []).map(o => o[0]).filter(Boolean);

    const isOwner = m.fromMe || ownerList.includes(senderNum);
    const isPrems = isOwner || (user.premium?.status && user.premium.expired > Date.now());

    m.reply(`
❏ Username : ${user.register ? user.name : conn.getName(m.jid)}
▧ Status : ${isOwner ? 'Owner' : isPrems ? 'Premium User' : user.level > 999 ? 'Elite User' : 'Free User'}
▧ Limit : ${isPrems ? 'Unlimited' : user.limit} / 1000
▧ Command : ${isPrems ? 'Unlimited' : (user.commandLimit - (user.command||0))} / ${user.commandLimit}
▧ Total Command : ${user.commandTotal||0}
`.trim());
};

handler.help = ['limit'];
handler.tags = ['xp'];
handler.command = /^(limit)$/i;
handler.register = true;

export default handler;