let handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender]
    if (!user) return m.reply("Kamu belum terdaftar di database")

    let berobatCost = 50000 // Rp 50.000

    if (!user.sakit && user.health >= 100) {
        return m.reply("Kamu sedang tidak sakit dan darahmu penuh! Dokter mengusirmu dari rumah sakit.")
    }

    let isFree = false
    if (user.asuransi && user.asuransi > Date.now()) {
        isFree = true
    }

    if (!isFree && user.money < berobatCost) {
        return m.reply(`Uangmu tidak cukup untuk biaya berobat!\nBiaya rumah sakit: *Rp${berobatCost.toLocaleString('id-ID')}*\nUangmu: Rp${user.money.toLocaleString('id-ID')}\n\n*Tips:* Beli asuransi agar biaya berobat gratis!`)
    }

    if (!isFree) {
        user.money -= berobatCost
    }

    user.sakit = false
    user.health = 100

    let msg = `🏥 *BEROBAT BERHASIL!* 🏥\n\nKamu telah dirawat oleh dokter terbaik. Sekarang penyakitmu hilang dan darahmu kembali 100%!`
    if (isFree) {
        msg += `\nBiaya pengobatan ditanggung oleh kartu *Asuransi* milikmu (Gratis).`
    } else {
        msg += `\nKamu membayar biaya pengobatan sebesar *Rp${berobatCost.toLocaleString('id-ID')}*.`
    }

    await m.reply(msg)
}

handler.help = ["berobat"]
handler.tags = ["rpg"]
handler.command = /^(berobat)$/i
handler.group = true
handler.register = true
handler.rpg = true

export default handler
