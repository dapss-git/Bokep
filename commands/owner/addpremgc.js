import moment from 'moment-timezone'

const handler = async (m, {
    text,
    usedPrefix,
    command,
    db,
    conn
}) => {
    if (!text && !m.isGroup) {
        return m.reply(
            `Gunakan format:\n` +
            `${usedPrefix + command} <durasi>\n` +
            `${usedPrefix + command} <nomor grup> <durasi>\n` +
            `${usedPrefix + command} <group_id> <durasi>\n` +
            `${usedPrefix + command} <linkgrup> <durasi>\n\n` +
            `Contoh:\n` +
            `${usedPrefix + command} 30d\n` +
            `${usedPrefix + command} 3 7d\n` +
            `${usedPrefix + command} 120363422829135355@g.us 7d\n` +
            `${usedPrefix + command} https://chat.whatsapp.com/xxxx 7d\n\n` +
            `Durasi:\nd = hari | h = jam | m = menit`
        )
    }

    const groups = Object.values(await conn.groupFetchAllParticipating())

    let groupId
    let durationText

    const args = text.trim().split(/\s+/)

    if (args[0]?.match(/^\d+$/) && groups[parseInt(args[0]) - 1]) {
        const index = parseInt(args[0]) - 1
        groupId = groups[index].id
        durationText = args[1]
    } else if (args[0]?.endsWith('@g.us')) {
        groupId = args[0]
        durationText = args[1]
    } else if (args[0]?.includes('chat.whatsapp.com')) {
        const code = args[0].match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/i)?.[1]

        if (!code) {
            return m.reply('Link grup tidak valid.')
        }

        try {
            groupId = await conn.groupAcceptInvite(code)
            durationText = args[1]
        } catch {
            return m.reply('Gagal mengambil ID grup dari link.')
        }
    } else if (m.isGroup) {
        groupId = m.chat
        durationText = args[0]
    }

    if (!groupId) {
        return m.reply('ID grup tidak ditemukan.')
    }

    const durationMatch = durationText?.match(/(\d+)([dhm])/i)

    if (!durationMatch) {
        return m.reply('Format durasi salah.\nContoh: 30d | 12h | 45m')
    }

    const value = parseInt(durationMatch[1])
    const unit = durationMatch[2].toLowerCase()

    const durationMs = value * {
        d: 86400000,
        h: 3600000,
        m: 60000
    } [unit]

    if (!db.data.chats[groupId]) {
        db.data.chats[groupId] = {}
    }

    const group = db.data.chats[groupId]

    group.premium ??= {
        status: false,
        expired: 0
    }

    const expired = Date.now() + durationMs

    group.premium.status = true
    group.premium.expired = expired

    await db.save()

    m.reply(
        `✅ PREMIUM GRUP AKTIF\n\n` +
        `👥 Group ID: ${groupId}\n` +
        `⏳ Durasi: ${value}${unit}\n` +
        `📆 Expired: ${moment(expired)
            .tz('Asia/Jakarta')
            .format('DD MMMM YYYY, HH:mm:ss')} WIB`
    )
}

handler.command = ['addpremgc', 'addpremiumgc']
handler.tags = ['owner']
handler.description = 'Menambahkan premium ke grup'
handler.owner = true
handler.register = true

export default handler