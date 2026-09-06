function normalizeParticipant(jid) {
    if (!jid) return jid
    return jid.replace(/:\d+@/, '@')
}

function buildDeleteKey(m) {
    return {
        remoteJid: m.chat || m.from,
        fromMe: false,
        id: m.key?.id || m.id,
        participant: m.key?.participantAlt || normalizeParticipant(m.key?.participant) || normalizeParticipant(m.sender)
    }
}

export async function before(m, {
    conn
}) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const chat = global.db.data.chats[m.chat] || {}
    if (!chat.antitagsw2) return true

    const isTag = m.mtype === 'groupStatusMentionMessage' ||
        m.type === 'groupStatusMentionMessage' ||
        m.message?.groupStatusMentionMessage

    if (!isTag) return true

    const sender = m.sender
    const today = new Date().toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta'
    })

    if (chat.tagswWhitelist && chat.tagswWhitelist.includes(sender)) {
        return true
    }

    if (!chat.tagsw2Data) chat.tagsw2Data = {}
    if (chat.tagsw2Data.date !== today) {
        chat.tagsw2Data = {
            date: today
        }
    }
    if (!chat.tagsw2Data[sender]) chat.tagsw2Data[sender] = 0

    let isAdmin = false
    try {
        const meta = await conn.groupMetadata(m.chat)
        const participant = meta.participants?.find(p => p.id === sender)
        if (participant?.admin === 'admin' || participant?.admin === 'superadmin') {
            isAdmin = true
        }
    } catch {}

    const ownerJids = (global.owner || []).map(o => (Array.isArray(o) ? o[0] : o) + '@s.whatsapp.net')
    const isOwner = ownerJids.includes(sender) || sender === conn.user?.jid

    if (isAdmin || isOwner) return true

    chat.tagsw2Data[sender]++

    const maxTag = chat.maxTagSW || 2

    if (chat.tagsw2Data[sender] > maxTag) {
        try {
            await conn.sendMessage(m.chat, {
                delete: buildDeleteKey(m)
            })
            await conn.sendMessage(m.chat, {
                text: `⚠️ ᴛᴀɢ sᴛᴀᴛᴜs ᴅɪ ʜᴀᴘᴜs!\n\n👤 @${sender.split('@')[0]}\n🚫 sᴜᴅᴀʜ ${chat.tagsw2Data[sender]}x ᴛᴀɢ ʜᴀʀɪ ɪɴɪ!\n📌 ᴍᴀᴋsɪᴍᴀʟ ${maxTag}x ᴘᴇʀ ʜᴀʀɪ.`,
                mentions: [sender]
            })
        } catch (e) {
            console.error('[ANTITAGSW2] Gagal hapus:', e)
        }
        return false
    }

    const sisa = maxTag - chat.tagsw2Data[sender]
    setTimeout(async () => {
        await conn.sendMessage(m.chat, {
            text: `⚠️ @${sender.split('@')[0]} ᴋᴀᴍᴜ sᴜᴅᴀʜ ᴛᴀɢ ${chat.tagsw2Data[sender]}x ʜᴀʀɪ ɪɴɪ. sɪsᴀ: ${sisa}x ʟᴀɢɪ.`,
            mentions: [sender]
        }).catch(() => {})
    }, 1500)

    return true
}