import { jidNormalizedUser } from 'baileys'

export async function before(m, { isAdmin, isBotAdmin, conn }) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const group = global.db.data.chats[m.chat] || {}

    let mediaType = null

    if (m.message?.imageMessage) mediaType = 'foto'
    else if (m.message?.videoMessage) mediaType = 'video'
    else if (m.message?.audioMessage)
        mediaType = m.message.audioMessage.ptt ? 'voice note' : 'audio'
    else if (m.message?.stickerMessage) mediaType = 'stiker'
    else if (m.message?.documentMessage) mediaType = 'dokumen'
    else if (m.message?.gifMessage) mediaType = 'gif'

    const isMedia = !!mediaType

    if (group.antimedia === true && isMedia && !isAdmin) {
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
                console.error('[ANTIMEDIA] gagal hapus:', err)
            }
        }

        await m.reply(`🚫 @${m.sender.split("@")[0]} dilarang mengirim *${mediaType}* di grup ini!`, {
            mentions: [m.sender]
        })
        return false
    }

    return true
}

