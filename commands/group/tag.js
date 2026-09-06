let handler = async (m, {
    conn
}) => {
    if (!m.isGroup) return m.reply('Khusus grup')
    if (!m.quoted) return m.reply('🚩 Reply pesan.')

    let groupMetadata = await conn.groupMetadata(m.chat)
    let users = groupMetadata.participants
        .map(v => v.id)
        .filter(v => v !== conn.user.jid)

    await conn.sendMessage(m.chat, {
        forward: m.quoted.fakeObj,
        mentions: users
    })
}

handler.help = ['tag']
handler.tags = ['group']
handler.command = /^(totag|tag)$/i

handler.admin = true
handler.group = true

handler.register = true

export default handler