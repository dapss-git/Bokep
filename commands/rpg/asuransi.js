let handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender]
    if (!user) return m.reply("Kamu belum terdaftar di database")

    let asuransiCost = 100000 // Rp 100.000 untuk 7 hari

    if (user.asuransi && user.asuransi > Date.now()) {
        let remaining = user.asuransi - Date.now()
        let days = Math.floor(remaining / (1000 * 60 * 60 * 24))
        let hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        return m.reply(`Kamu masih memiliki kartu asuransi yang aktif!\nMasa berlaku tersisa: *${days} hari ${hours} jam*`)
    }

    if (user.money < asuransiCost) {
        return m.reply(`Uangmu tidak cukup untuk membeli asuransi!\nHarga asuransi (7 Hari): *Rp${asuransiCost.toLocaleString('id-ID')}*\nUangmu saat ini: Rp${user.money.toLocaleString('id-ID')}`)
    }

    user.money -= asuransiCost
    user.asuransi = Date.now() + (7 * 24 * 60 * 60 * 1000) // Aktif 7 Hari

    await m.reply(`💳 *ASURANSI KESEHATAN DIBELI!* 💳\n\nSelamat, kamu telah membeli asuransi kesehatan senilai *Rp${asuransiCost.toLocaleString('id-ID')}*.\nSelama 7 hari ke depan, seluruh biaya pengobatan di rumah sakit (menggunakan *.berobat*) akan ditanggung sepenuhnya alias *GRATIS*!`)
}

handler.help = ["asuransi"]
handler.tags = ["rpg"]
handler.command = /^(asuransi)$/i
handler.group = true
handler.register = true
handler.rpg = true

export default handler
