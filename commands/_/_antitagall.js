export async function before(m, { conn, isAdmin, isBotAdmin, group }) {
    if (!m.isGroup) return true
    if (m.fromMe) return true
    
    const chatData = global.db.data.chats[m.chat] || {}
    const isEnabled = group?.antitagall || chatData.antitagall
    if (!isEnabled) return true

    // Jika pengirim adalah admin, abaikan
    if (isAdmin) return true

    // Deteksi Tag All / Hidetag
    // Biasanya ditandai dengan jumlah mentionedJid yang sangat banyak
    // atau adanya flag khusus di contextInfo untuk hidetag pada beberapa library
    const mentions = m.mentionedJid || []
    const participants = m.metadata?.participants || []
    
    // Jika jumlah tag lebih dari 90% member, kita anggap itu Tag All
    const isTagAll = mentions.length > 0 && mentions.length >= (participants.length * 0.9)

    if (!isTagAll) return true

    // Log ke terminal
    console.log(`[ANTITAGALL] Terdeteksi Tag All dari: ${m.sender} di ${m.chat}`)

    if (!isBotAdmin) {
        console.log(`[ANTITAGALL] Bot bukan admin, tidak bisa menghapus pesan.`)
        return true
    }

    try {
        // 1. Hapus Pesan
        await conn.sendMessage(m.chat, { delete: m.key })
        
        // 2. Beri Peringatan
        await conn.sendMessage(m.chat, {
            text: `⚠️ *ANTI TAGALL*\n\nMaaf @${m.sender.split('@')[0]}, hanya Admin yang diperbolehkan untuk melakukan tag seluruh anggota grup.`,
            mentions: [m.sender]
        })
    } catch (e) {
        console.error(`[ANTITAGALL-ERROR]`, e.message)
    }

    return false
}
