import { jidNormalizedUser } from "baileys";

let handler = async (m, {
    conn,
    text,
    groupMetadata
}) => {
    var lama = 86400000 * 7
    const milliseconds = Date.now()

    if (!groupMetadata) groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return m.reply('❌ Gagal mengambil data grup.')

    let member = groupMetadata.participants.map(v => v.id)
    var pesan = text || "*Mohon Aktif Di Grup Karena Sewaktu-waktu Akan Ada Pembersihan Anggota*"

    var sum = member.length
    var total = 0
    var sider = []

    for (let i = 0; i < sum; i++) {
        let rawJid = member[i]
        // Fix for corrupted JID domain seen in some sessions
        if (rawJid.includes('@sessions/')) rawJid = rawJid.split('@')[0] + '@lid'

        let v = conn.decodeJid(rawJid)
        if (v.endsWith('@lid') && conn.signalRepository?.lidMapping?.getPNForLID) {
            try {
                const pn = await conn.signalRepository.lidMapping.getPNForLID(v)
                if (pn) v = jidNormalizedUser(pn)
            } catch (e) {}
        }

        let users = groupMetadata.participants.find(u => u.id == member[i]) || {}
        let isAdmin = users?.admin === 'admin' || users?.admin === 'superadmin'
        let userData = global.db.data.users[v]

        if (
            (typeof userData == 'undefined' ||
                milliseconds - (userData.lastseen || 0) > lama) &&
            !isAdmin
        ) {
            total++
            sider.push(member[i])
        }
    }

    if (total == 0) return m.reply(`*Tidak Ada Sider Di Grup Ini*`)

    const listSider = await Promise.all(sider.map(async v_id => {
        let rawJid = v_id
        if (rawJid.includes('@sessions/')) rawJid = rawJid.split('@')[0] + '@lid'
        
        let v = conn.decodeJid(rawJid)
        if (v.endsWith('@lid') && conn.signalRepository?.lidMapping?.getPNForLID) {
            try {
                const pn = await conn.signalRepository.lidMapping.getPNForLID(v)
                if (pn) v = jidNormalizedUser(pn)
            } catch (e) {}
        }

        const userData = global.db.data.users[v]
        const status = typeof userData == 'undefined' || !userData.lastseen ?
            'Sider' :
            'Off ' + msToDate(milliseconds - userData.lastseen)
        return `  ○ @${v.replace(/@.+/, '')} (${status})`
    }))
    const listSiderText = listSider.join('\n')

    await conn.sendMessage(m.chat, {
        text: `*${total}/${sum}* Anggota Grup *${groupMetadata.subject}* Adalah Sider Dengan Alasan :\n*1.* Tidak Aktif Selama Lebih Dari 7 Hari\n*2.* Bergabung Tetapi Tidak Pernah Nimbrung\n\n"${pesan}"\n\n*LIST SIDER :*\n${listSiderText}`,
        mentions: sider
    }, {
        quoted: m
    })
}

handler.help = ['gcsider']
handler.tags = ['group']
handler.command = /^(gcsider)$/i
handler.group = true
handler.admin = true
handler.limit = 10
handler.register = true

export default handler

function msToDate(ms) {
    if (isNaN(ms)) return '--'
    let d = Math.floor(ms / 86400000)
    let h = Math.floor(ms / 3600000) % 24
    if (d == 0 && h == 0) return 'Baru Saja'
    return `${d}H ${h}J`
}