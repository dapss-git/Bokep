import {
    areJidsSameUser
} from 'baileys'

let handler = async (m, {
    conn,
    text,
    participants
}) => {

    let targets = []

    if (m.quoted) {
        let quotedSender = m.quoted.sender || m.quoted.key?.participant || m.quoted.key?.remoteJid
        if (quotedSender && !targets.some(t => areJidsSameUser(t, quotedSender))) targets.push(quotedSender)
    }

    if (text) {
        try {
            let jid = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            if (!targets.some(t => areJidsSameUser(t, jid))) targets.push(jid)
        } catch (e) {}
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        for (let jid of m.mentionedJid) {
            if (areJidsSameUser(jid, m.sender)) continue
            if (!targets.some(t => areJidsSameUser(t, jid))) targets.push(jid)
        }
    }

    if (targets.length === 0) targets.push(m.sender)

    const thumbnail = await fetch("https://i.ibb.co/j42Rphd/images-1.jpg")
        .then(r => r.buffer())
        .catch(() => Buffer.alloc(0))

    const mentionList = Array.isArray(participants) ? participants.map(a => a.id) : []

    for (let target of targets) {
        let number = target.replace(/[^0-9]/g, '')

        const interactiveMessage = {
            text: `\n 🪀 nomor ${areJidsSameUser(target, m.sender) ? 'kamu' : '@' + number}\n ╰┈➤ *${number}*`,
            title: "✅ *BERHASIL COPY NOMOR*",
            footer: "\nᴛᴇᴋᴀɴ ᴛᴏᴍʙᴏʟ ᴅɪʙᴀᴡᴀʜ ɪɴɪ ᴜɴᴛᴜᴋ ᴍᴇɴʏᴀʟɪɴ ɴᴏᴍᴏʀ.",
            interactiveButtons: [{
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                    display_text: "📋 SALIN NOMOR",
                    id: "copy_number",
                    copy_code: number
                })
            }],
            contextInfo: {
                mentionedJid: [target, ...mentionList]
            }
        }

        await conn.sendMessage(m.chat, interactiveMessage, {
            quoted: m
        })
    }
}

handler.help = ['getnumber', 'getnomor', 'copynumber']
handler.tags = ['tools']
handler.command = /^getnumber|getnomor|copynumber$/i
handler.group = true
handler.limit = true;
handler.register = true;

export default handler