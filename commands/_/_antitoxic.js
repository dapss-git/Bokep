import { jidNormalizedUser } from 'baileys'

const toxicRegex =
/anj(k|g)|ajn?(g|k)|a?njin(g|k)|bajingan|b(a?n)?gsa?t|ko?nto?l|me?me?(k|q)|pe?pe?(k|q)|meki|titi(t|d)|pe?ler|tetek|toket|ngewe|go?blo?k|to?lo?l|idiot|(k|ng)e?nto?(t|d)|jembut|bego|dajj?al|janc(u|o)k|pantek|puki ?(mak)?|kimak|kampang|lonte|col(i|mek?)|pelacur|henceu?t|nigga|fuck|dick|bitch|babi|tits|bastard|asshole/i

export async function before(m, { conn, isAdmin, isBotAdmin }) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true
    if (!m.text) return true

    const group = global.db.data.chats[m.chat] || {}
    const isToxic = toxicRegex.test(m.text)

    if (
        (group.antiToxic === true || group.antitoxic === true) &&
        isToxic &&
        !isAdmin
    ) {
        let botIsAdmin = isBotAdmin
        if (!botIsAdmin) {
            try {
                const meta = await conn.groupMetadata(m.chat)
                const botJid = jidNormalizedUser(conn.user?.jid || conn.user?.id || '')
                botIsAdmin = meta.participants.some(p => {
                    return jidNormalizedUser(p.id) === botJid && (p.admin === 'admin' || p.admin === 'superadmin')
                })
            } catch (e) {
                console.error('[ANTITOXIC] error checking admin:', e)
            }
        }

        if (botIsAdmin) {
            try {
                const deleteKey = {
                    remoteJid: jidNormalizedUser(m.chat),
                    fromMe: false,
                    id: m.key.id,
                    participant: jidNormalizedUser(m.key.participant || m.sender)
                }
                console.log(`[ANTITOXIC] Attempting delete with normalized key:`, JSON.stringify(deleteKey))
                await conn.sendMessage(m.chat, { delete: deleteKey })
                console.log(`[ANTITOXIC] Delete command sent.`)
            } catch (e) {
                console.error('[ANTITOXIC] Delete error:', e)
            }
        }

        await conn.sendMessage(
            m.chat,
            { text: '◦❒ *Jangan toxic ya di grup ini!*' },
            { quoted: m }
        )

        return false
    }

    return true
}

