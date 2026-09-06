let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {

    if (!text && !m.quoted && !(m.mentionedJid && m.mentionedJid[0])) {
        return m.reply(
            `Gunakan format:\n${usedPrefix + command} @user pesan\n\nContoh:\n${usedPrefix + command} @628123456789 halo`
        )
    }

    let cm = copy(m)
    let who

    if (m.isGroup) {
        who = m.mentionedJid?.[0] ?
            m.mentionedJid[0] :
            m.quoted ?
            m.quoted.sender :
            text.match(/@([0-9]{5,16})/) ?
            text.match(/@([0-9]{5,16})/)[1] + '@s.whatsapp.net' :
            text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    } else {
        who = m.quoted ?
            m.quoted.sender :
            text.match(/@([0-9]{5,16})/) ?
            text.match(/@([0-9]{5,16})/)[1] + '@s.whatsapp.net' :
            text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    }

    if (!who || who.trim() === '@s.whatsapp.net') {
        return m.reply('❌ Tag, reply, atau masukkan nomor target yang valid.')
    }

    cm.key.fromMe = false

    if (cm.message?.[m.mtype]) {
        cm.message[m.mtype] = copy(m.msg)
    }

    let sp = '@' + who.split('@')[0]

    let [fake, ...real] = text.split(sp)

    conn.fakeReply(
        m.chat,
        real.join(sp).trimStart() || ' ',
        who,
        fake.trimEnd() || ' ',
        m.isGroup ? m.chat : false, {
            contextInfo: {
                mentionedJid: conn.parseMention(real.join(sp).trim())
            }
        }
    )
}

handler.help = ['fake <text> @user <text2>']
handler.tags = ['tools']
handler.command = /^(fitnah|fakereply|fake)$/i

function copy(obj) {
    return JSON.parse(JSON.stringify(obj))
}

handler.register = true

export default handler