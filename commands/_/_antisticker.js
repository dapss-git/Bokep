import { jidNormalizedUser } from 'baileys'

export async function before(m, {
    isAdmin,
    isBotAdmin,
    db,
    conn
}) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const group = db.data.chats[m.chat] || {}

    const msg = m.message?.ephemeralMessage?.message || m.message

    const isSticker = !!msg?.stickerMessage ||
        !!msg?.lottieStickerMessage

    if ((group.antiSticker === true || group.antisticker === true) && isSticker && !isAdmin) {
        let botIsAdmin = isBotAdmin
        if (!botIsAdmin) {
            try {
                const meta = await conn.groupMetadata(m.chat)
                const botJid = jidNormalizedUser(conn.user?.jid || conn.user?.id || '')
                botIsAdmin = meta.participants.some(p => {
                    return jidNormalizedUser(p.id) === botJid && (p.admin === 'admin' || p.admin === 'superadmin')
                })
            } catch {}
        }

        if (botIsAdmin) {
            try {
                const deleteKey = {
                    remoteJid: jidNormalizedUser(m.chat),
                    fromMe: false,
                    id: m.key.id,
                    participant: jidNormalizedUser(m.key.participant || m.sender)
                }
                await conn.sendMessage(m.chat, { delete: deleteKey })
            } catch (err) {
                console.error('[ANTISTICKER] gagal hapus:', err)
            }
        }
        return false
    }

    return true
}

