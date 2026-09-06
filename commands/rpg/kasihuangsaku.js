let handler = async (m, { conn, args }) => {
    let user = global.db.data.users
    if (!user[m.sender]) return m.reply("Belum terdaftar")

    let who =
        m.mentionedJid?.[0] ||
        m.quoted?.sender ||
        (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)

    if (!who || who === '@s.whatsapp.net') return m.reply("Tag atau reply anaknya!")

    if (!user[m.sender].children || !user[m.sender].children.includes(who)) {
        return m.reply("Dia bukan anakmu!")
    }

    let amount = parseInt(args[1] || args[0])
    if (isNaN(amount) || amount < 1) return m.reply("Masukkan jumlah uang yang valid!")
    if (user[m.sender].money < amount) return m.reply("Uangmu tidak cukup!")

    user[m.sender].money -= amount
    user[who].money = (user[who].money || 0) + amount
    user[who].happiness = Math.min(100, (user[who].happiness || 0) + Math.floor(amount / 1000))

    await m.reply(`💰 Berhasil memberikan uang saku sebesar Rp ${amount.toLocaleString()} kepada @${who.split("@")[0]}. Kebahagiaannya meningkat!`, false, { mentions: [who] })
}

handler.help = ["kasihuangsaku"]
handler.tags = ["rpg"]
handler.command = /^(kasihuangsaku)$/i
handler.register = true

export default handler