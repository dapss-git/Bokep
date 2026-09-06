import {
    jidDecode
} from 'baileys'

let handler = async (m, {
    conn
}) => {
    if (!m?.sender) return
    if (!m.isGroup) return m.reply('❌ Perintah ini hanya bisa digunakan di grup.')

    const metadata = m.metadata
    if (!metadata) return m.reply('⚠️ Metadata grup tidak ditemukan.')

    let who

    if (m.mentionedJid?.length) {
        who = m.mentionedJid[0]
    } else if (m.quoted) {
        who = m.quoted.sender
    } else if (m.text) {
        const number = m.text.replace(/\D/g, '')
        if (number) who = `${number}@s.whatsapp.net`
    }

    if (!who) return m.reply('⚠️ Tag / reply / input nomor.')

    const target = jidDecode(who)
    if (!target?.user) return m.reply('⚠️ Target tidak valid.')

    const participants = metadata.participants || []

    const participant = participants.find(p => {
        const pJid = jidDecode(p.id)
        return pJid?.user === target.user
    })

    const pp = await conn.profilePictureUrl(who, 'image')
        .catch(() => 'src/avatar_contact.png')

    const groupId = metadata.id

    if (participant) {
        const name = participant.name || '-'
        const username = participant.username || '-'
        const lid = participant.lid || '-'
        const number = participant.id?.split('@')[0] || '-'

        const adminStatus = participant.admin ?
            participant.admin === 'superadmin' ?
            '👑 Owner' :
            '✅ Admin' :
            '❌ Bukan Admin'

        const caption = `
╭─❁ Cek ID Grup (LID Mode) ❁
◦❒ Nama: ${name}
◦❒ Username: ${username}
◦❒ Nomor: ${number}
◦❒ LID: ${lid}
◦❒ Status: ✅ Terdaftar
◦❒ Jabatan: ${adminStatus}

╭─❁ Info Grup ❁
◦❒ Nama Grup: ${metadata.subject}
◦❒ ID Grup: ${groupId}
◦❒ Mode: ${metadata.addressingMode}
╰─────────────❁
`.trim()

        await conn.sendMessage(
            m.chat, {
                image: {
                    url: pp
                },
                caption,
                mentions: [who]
            }, {
                quoted: m
            }
        )
    } else {
        const caption = `
╭─❁ Cek ID Grup ❁
◦❒ Target: @${target.user}
◦❒ Status: ❌ Tidak ditemukan di grup

◦❒ ID Grup: ${groupId}
╰─────────────❁
`.trim()

        await conn.sendMessage(
            m.chat, {
                image: {
                    url: pp
                },
                caption,
                mentions: [who]
            }, {
                quoted: m
            }
        )
    }
}

handler.help = ['ceklid']
handler.tags = ['group']
handler.command = ['ceklid', 'checklid', 'cekgc']
handler.group = true
handler.register = true

export default handler