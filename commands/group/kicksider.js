let handler = async (m, { conn, text, isAdmin, isBotAdmin, groupMetadata }) => {
    if (!m.isGroup) return m.reply("❌ Perintah ini hanya bisa digunakan di grup.")
    if (!isAdmin) return m.reply("❌ Perintah ini hanya bisa digunakan oleh *admin grup*.")
    if (!isBotAdmin) return m.reply("❌ Bot harus menjadi admin untuk mengeluarkan anggota.")

    if (!groupMetadata) groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return m.reply('❌ Gagal mengambil data grup.')

    const lama = 86400000 * 7
    const milliseconds = new Date(new Date().toLocaleString("en-US", {
        timeZone: "Asia/Jakarta"
    })).getTime()

    let member = groupMetadata.participants.map(v => v.id)
    let sider = []

    for (let i = 0; i < member.length; i++) {
        let rawJid = member[i]
        // Fix for corrupted JID domain seen in some sessions
        if (rawJid.includes('@sessions/')) rawJid = rawJid.split('@')[0] + '@lid'

        let jid = conn.decodeJid(rawJid)
        if (jid.endsWith('@lid') && conn.signalRepository?.lidMapping?.getPNForLID) {
            try {
                const pn = await conn.signalRepository.lidMapping.getPNForLID(jid)
                if (pn) {
                    const { jidNormalizedUser } = (await import("baileys")).default || await import("baileys")
                    jid = jidNormalizedUser(pn)
                }
            } catch (e) {}
        }

        let users = groupMetadata.participants.find(u => u.id == member[i]) || {}
        let isParticipantAdmin = users?.admin === 'admin' || users?.admin === 'superadmin'

        const botJid = conn.decodeJid(conn.user?.jid || conn.user?.id || "")
        let isBot = jid === botJid

        const userData = global.db.data.users[jid]

        if (
            (typeof userData == 'undefined' ||
                milliseconds - (userData.lastseen || 0) > lama) &&
            !isParticipantAdmin && !isBot
        ) {
            sider.push(member[i])
        }
    }

    if (sider.length === 0) {
        return m.reply(`✅ Tidak ada sider (anggota tidak aktif > 7 hari) di grup ini.`)
    }

    await m.reply(`🔍 Ditemukan *${sider.length}* sider. Memulai pembersihan...`)

    // Kick in batches to avoid rate limits
    const batchSize = 5
    for (let i = 0; i < sider.length; i += batchSize) {
        const batch = sider.slice(i, i + batchSize)
        try {
            await conn.groupParticipantsUpdate(m.chat, batch, "remove")
            if (i + batchSize < sider.length) await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (e) {
            console.error("Kicksider Error:", e)
        }
    }

    m.reply(`✅ Berhasil membersihkan *${sider.length}* sider.`)
}

handler.help = ['kicksider']
handler.tags = ['group']
handler.command = /^(kicksider)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true
handler.register = true

export default handler
