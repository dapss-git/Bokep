import {
    jidNormalizedUser
} from 'baileys'

let handler = async (m, {
    conn,
    isAdmin,
    isBotAdmin
}) => {
    if (!m || !m.sender) return

    if (!m.isGroup) return m.reply("❌ Perintah ini hanya bisa digunakan di grup.")

    const metadata = m.metadata
    if (!metadata)
        return m.reply("⚠️ Metadata grup tidak ditemukan. Pastikan handler utama mengisi m.metadata.")

    if (!isAdmin)
        return m.reply("❌ Perintah ini hanya bisa digunakan oleh admin grup.")

    if (!isBotAdmin)
        return m.reply("❌ Bot harus menjadi admin untuk mengeluarkan anggota.")

    let who
    if (m.mentionedJid?.length) {
        who = m.mentionedJid[0]
    } else if (m.quoted) {
        who = m.quoted.sender || m.quoted.key?.participant
    } else if (m.text) {
        const number = m.text.replace(/[^0-9]/g, "")
        if (number) who = number + "@s.whatsapp.net"
    }

    if (!who) return m.reply("⚠️ Tag, balas pesan, atau tulis nomor target.")
    if (who === "@s.whatsapp.net") return m.reply("⚠️ Target tidak valid.")

    // Normalize target JID
    who = conn.decodeJid(who)
    if (who.endsWith("@lid") && conn.signalRepository?.lidMapping?.getPNForLID) {
        try {
            const pn = await conn.signalRepository.lidMapping.getPNForLID(who)
            if (pn) who = jidNormalizedUser(pn)
        } catch {}
    }

    // Normalize owner JID
    let ownerGroup = metadata.owner || m.chat.split("-")[0] + "@s.whatsapp.net"
    ownerGroup = conn.decodeJid(ownerGroup)
    if (ownerGroup.endsWith("@lid") && conn.signalRepository?.lidMapping?.getPNForLID) {
        try {
            const pn = await conn.signalRepository.lidMapping.getPNForLID(ownerGroup)
            if (pn) ownerGroup = jidNormalizedUser(pn)
        } catch {}
    }

    // Normalize bot JID
    let botJid = conn.decodeJid(conn.user?.id)
    if (botJid.endsWith("@lid") && conn.signalRepository?.lidMapping?.getPNForLID) {
        try {
            const pn = await conn.signalRepository.lidMapping.getPNForLID(botJid)
            if (pn) botJid = jidNormalizedUser(pn)
        } catch {}
    }

    if (who === ownerGroup)
        return m.reply("❌ Tidak bisa mengeluarkan Owner Grup.")

    if (who === botJid)
        return m.reply("❌ Tidak bisa mengeluarkan Bot itu sendiri.")

    try {
        await conn.groupParticipantsUpdate(m.chat, [who], "remove")
        // Tidak mengirim pesan jika berhasil
    } catch (e) {
        console.error("Kick Error:", e)
        m.reply("⚠️ Gagal mengeluarkan target.")
    }
}

handler.help = ["kick"]
handler.tags = ["group"]
handler.command = ["kick"]
handler.group = true
handler.admin = true
handler.botAdmin = true
handler.register = true

export default handler