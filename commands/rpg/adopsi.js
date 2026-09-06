let handler = async (m, {
    conn,
    usedPrefix,
    command,
    text
}) => {
    let user = global.db.data.users
    if (!user[m.sender]) return m.reply("Kamu belum terdaftar di database")

    let partner = user[m.sender].nikah || user[m.sender].pacar
    if (!partner) return m.reply("Kamu harus punya pasangan (nikah/pacar) untuk mengadopsi anak!")
    if (user[m.sender].tinggalBareng !== partner) return m.reply("Kamu dan pasangan harus tinggal bareng dulu untuk mengadopsi anak!")

    let who = m.mentionedJid?.[0] || m.quoted?.sender || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null) || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
    
    if (!who) return m.reply(`Tag orang yang ingin diajak menjadi anak!\nContoh: ${usedPrefix + command} @user`)
    if (who === m.sender || who === partner) return m.reply("Tidak bisa mengadopsi diri sendiri atau pasangan sendiri!")
    if (!user[who]) return m.reply("Orang tersebut tidak terdaftar di database")
    if (user[who].parent) return m.reply("Orang tersebut sudah punya orang tua!")

    if (user[who].ajakAnak === m.sender) return m.reply("Kamu sudah mengajak orang ini, tunggu jawabannya!")

    user[who].ajakAnak = m.sender
    user[who].parentTemp = [m.sender, partner]

    await m.reply(
        `👪 @${m.sender.split("@")[0]} dan @${partner.split("@")[0]} ingin mengadopsi @${who.split("@")[0]} sebagai anak!\n\nKetik:\n${usedPrefix}terimaanak - Untuk menerima\n${usedPrefix}tolakanak - Untuk menolak`,
        false, { mentions: [m.sender, partner, who] }
    )
}

handler.help = ["adopsi"]
handler.tags = ["rpg"]
handler.command = /^(adopsi)$/i
handler.group = true

handler.register = true

export default handler