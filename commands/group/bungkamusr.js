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
    if (!m.isGroup) return m.reply('❌ Fitur ini hanya untuk grup.')
    if (!isAdmin && !isOwner) return m.reply('❌ Hanya admin grup.')

    const group = global.db.data.chats[m.chat]
    if (!group) return

    if (!group.bungkamUsers) group.bungkamUsers = []

    const who = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)

    if (command === 'bungkamuser') {
        if (!who) return m.reply(`❌ Tag atau reply user yang ingin dibungkam.\nContoh: ${usedPrefix}bungkamuser @user`)

        if (who === conn.user.jid) return m.reply('❌ Tidak bisa membungkam bot.')
        if (group.bungkamUsers.includes(who)) return m.reply('✅ User sudah dibungkam sebelumnya.')

        group.bungkamUsers.push(who)
        global.db.save()
        return m.reply(`✅ User @${who.split('@')[0]} kini dibungkam. Semua chat-nya akan dihapus otomatis.`, {
            mentions: [who]
        })
    }

    if (command === 'unbungkamuser') {
        if (!who) return m.reply(`❌ Tag atau reply user yang ingin di-unbungkam.\nContoh: ${usedPrefix}unbungkamuser @user`)
        const index = group.bungkamUsers.indexOf(who)
        if (index === -1) return m.reply('❌ User tidak ada dalam daftar bungkam.')
        group.bungkamUsers.splice(index, 1)
        global.db.save()
        return m.reply(`✅ User @${who.split('@')[0]} tidak lagi dibungkam.`, {
            mentions: [who]
        })
    }

    if (command === 'listbungkamuser') {
        if (!group.bungkamUsers.length) return m.reply('✅ Tidak ada user yang dibungkam.')
        const list = group.bungkamUsers.map((jid, i) => `${i + 1}. @${jid.split('@')[0]}`).join('\n')
        return m.reply(`🔇 *Daftar Bungkam User*\n\n${list}\n\nGunakan ${usedPrefix}unbungkamuser @user untuk menghapus.`, {
            mentions: group.bungkamUsers
        })
    }
}

handler.before = async function(m, {
    conn
}) {
    if (!m.isGroup) return true
    if (m.fromMe) return true

    const group = global.db.data.chats[m.chat]
    if (!group?.bungkamUsers?.length) return true

    const sender = m.sender
    if (!group.bungkamUsers.includes(sender)) return true

    try {
        await deleteMessage(conn, m.chat, m.key.id)
    } catch (e) {
        console.error('[bungkamuser] gagal hapus:', e)
    }

    return true
}

handler.help = ['bungkamuser @user', 'unbungkamuser @user', 'listbungkamuser']
handler.tags = ['group']
handler.command = /^(bungkamuser|unbungkamuser|listbungkamuser)$/i
handler.admin = true
handler.group = true

export default handler