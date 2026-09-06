export async function before(m, { conn, isAdmin, isBotAdmin }) {
    if (!m.isGroup) return true
    if (m.fromMe) return true
    
    const chat = global.db.data.chats[m.chat] || {}
    if (!chat.antiluar) return true

    // Cek apakah nomor pengirim diawali dengan '62' (Indonesia)
    const isIndo = m.sender.startsWith('62')

    if (isIndo) return true

    if (isAdmin) return true
    if (!isBotAdmin) return true

    try {
        await conn.groupParticipantsUpdate(
            m.chat,
            [m.sender],
            'remove'
        )
    } catch {}

    try {
        await conn.sendMessage(m.chat, {
            text: `Terdeteksi @${m.sender.split('@')[0]} adalah nomor luar negeri!`,
            mentions: [m.sender]
        })
    } catch {}

    return false
}
