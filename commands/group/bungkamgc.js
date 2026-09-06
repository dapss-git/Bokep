import {
    delay
} from 'baileys'

const deleteMessage = async (conn, chatId, stanzaId) => {
    const tempId = await conn.relayMessage(
        chatId, {
            groupStatusMessageV2: {
                message: {
                    extendedTextMessage: {
                        text: '',
                        contextInfo: {
                            isGroupStatus: true,
                        },
                    },
                },
            },
        }, {}
    )

    const tempId2 = await conn.relayMessage(
        chatId, {
            protocolMessage: {
                key: {
                    jid: chatId,
                    fromMe: true,
                    id: tempId,
                },
                type: 14,
                editedMessage: {
                    extendedTextMessage: {
                        text: '\0',
                        contextInfo: {
                            isGroupStatus: false,
                        },
                    },
                },
            },
        }, {
            messageId: stanzaId,
        }
    )

    await delay(100)

    await Promise.allSettled([
        conn.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                id: tempId,
                fromMe: true,
            },
        }),
        conn.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                id: tempId2,
                fromMe: true,
            },
        }),
    ])
}

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command,
    isAdmin,
    isOwner
}) => {
    const args = text.trim().split(/\s+/)
    const status = args[0]?.toLowerCase()
    const targetId = args[1] || m.chat

    // ================= KOMANDO UNBUNGKAM =================
    if (command === 'unbungkam') {
        const idTarget = args[0] || m.chat

        if (!idTarget.endsWith('@g.us')) {
            return m.reply('❌ ID grup tidak valid. Gunakan format: 628xxxx-xxxx@g.us')
        }

        if (idTarget !== m.chat && !isOwner) {
            return m.reply('❌ Hanya owner yang bisa mengatur bungkam untuk grup lain.')
        }

        if (!m.isGroup && !isOwner) {
            return m.reply('❌ Hanya owner yang bisa mengatur bungkam dari chat pribadi.')
        }

        if (!global.db.data.chats[idTarget]) global.db.data.chats[idTarget] = {}
        global.db.data.chats[idTarget].bungkam = false
        global.db.save()

        return m.reply(`✅ Bungkam GC dinonaktifkan untuk ${idTarget === m.chat ? 'grup ini' : idTarget}.`)
    }

    // ================= KOMANDO BUNGKAMGC ON/OFF =================
    if (!status || !['on', 'off'].includes(status)) {
        const currentGroup = global.db.data.chats[m.chat]?.bungkam ? '🟢 AKTIF' : '🔴 NONAKTIF'
        return m.reply(
            `🤖 *Bungkam GC*\n` +
            `Status grup ini: ${currentGroup}\n\n` +
            `Gunakan:\n` +
            `• ${usedPrefix}bungkamgc on [idgroup]\n` +
            `• ${usedPrefix}bungkamgc off [idgroup]\n` +
            `• ${usedPrefix}unbungkam [idgroup]\n\n` +
            `Contoh:\n` +
            `• ${usedPrefix}bungkamgc on\n` +
            `• ${usedPrefix}bungkamgc off 628123456789-123456@g.us\n` +
            `• ${usedPrefix}unbungkam 628123456789-123456@g.us`
        )
    }

    // Validasi target
    if (!targetId.endsWith('@g.us')) {
        return m.reply('❌ ID grup tidak valid. Gunakan format: 628xxxx-xxxx@g.us')
    }

    if (targetId !== m.chat && !isOwner) {
        return m.reply('❌ Hanya owner yang bisa mengatur bungkam untuk grup lain.')
    }

    if (!m.isGroup && !isOwner) {
        return m.reply('❌ Hanya owner yang bisa mengatur bungkam dari chat pribadi.')
    }

    if (m.isGroup && targetId === m.chat && !isAdmin && !isOwner) {
        return m.reply('❌ Hanya admin grup yang bisa mengatur bungkam di grup ini.')
    }

    if (!global.db.data.chats[targetId]) global.db.data.chats[targetId] = {}
    global.db.data.chats[targetId].bungkam = status === 'on'
    global.db.save()

    return m.reply(`✅ Bungkam GC ${status === 'on' ? 'diaktifkan' : 'dinonaktifkan'} untuk ${targetId === m.chat ? 'grup ini' : targetId}.`)
}

// ================= BEFORE HANDLER: auto-delete jika bungkam aktif =================
handler.before = async function(m, {
    conn,
    isAdmin,
    isOwner
}) {
    if (!m.isGroup) return true
    if (m.fromMe) return true

    const group = global.db.data.chats[m.chat]
    if (!group?.bungkam) return true

    const text = m.text || ''
    const prefix = text.match(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/)?.[0] || '.'
    const cmd = text.startsWith(prefix) ? text.slice(prefix.length).trim().split(' ')[0].toLowerCase() : ''

    if ((isAdmin || isOwner) && ['bungkamgc', 'unbungkam'].includes(cmd)) {
        return true
    }

    try {
        await deleteMessage(conn, m.chat, m.key.id)
    } catch (e) {
        console.error('[bungkamgc] gagal hapus:', e)
    }

    return true
}

handler.help = ['bungkamgc on/off [idgroup]', 'unbungkam [idgroup]']
handler.tags = ['group']
handler.command = /^(bungkamgc|unbungkam)$/i

export default handler