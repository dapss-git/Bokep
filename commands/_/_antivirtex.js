export async function before(m, { conn, isAdmin, isBotAdmin }) {
    if (!m.isGroup) return true
    if (m.fromMe) return true
    
    const chat = global.db.data.chats[m.chat] || {}
    if (!chat.antivirtex) return true

    const text = m.text || 
                 m.message?.conversation || 
                 m.message?.extendedTextMessage?.text || 
                 m.message?.imageMessage?.caption || 
                 m.message?.videoMessage?.caption || 
                 ''

    // Threshold 20.000 karakter biasanya sudah dianggap virtex
    const isVirtex = text.length > 20000

    if (!isVirtex) return true

    if (isAdmin) return true
    if (!isBotAdmin) return true

    try {
        await conn.sendMessage(m.chat, {
            delete: m.key
        })
    } catch {}

    try {
        await conn.groupParticipantsUpdate(
            m.chat,
            [m.sender],
            'remove'
        )
    } catch {}

    try {
        await conn.sendMessage(m.chat, {
            text: `Terdeteksi @${m.sender.split('@')[0]} mengirim virtex!`,
            mentions: [m.sender]
        })
    } catch {}

    return false
}
