import { jidNormalizedUser } from 'baileys'

export async function before(m, { isAdmin, isBotAdmin, conn }) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const group = global.db.data.chats[m.chat] || {}

    const isPollCreateV2 = !!m.message?.pollCreationMessageV2
    const isPollCreateV3 = !!m.message?.pollCreationMessageV3

    const isPolling = isPollCreateV2 || isPollCreateV3

    if (group.antipolling === true && isPolling && !isAdmin) {
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
                console.error('[ANTIPOLLING] gagal hapus:', err)
            }
        }

        await m.reply(
            `🚫 @${m.sender.split("@")[0]} dilarang *membuat polling* di grup ini!`,
            { mentions: [m.sender] }
        )
        return false
    }

    return true
}

