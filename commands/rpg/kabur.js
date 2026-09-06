let handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender]
    if (!user) return m.reply("Kamu belum terdaftar di database")

    if (user.penjara === 0) {
        return m.reply("Kamu tidak sedang berada di dalam penjara!")
    }

    let __timers = (new Date - (user.lastkabur || 0))
    let _timers = (3600000 - __timers) // 1 jam cooldown
    if (__timers < 3600000) {
        return m.reply(`Kamu masih lelah setelah percobaan kabur sebelumnya.\nTunggu selama *${clockString(_timers)}* untuk mencoba lagi.`)
    }

    user.lastkabur = new Date * 1

    // 30% chance to succeed
    let success = Math.random() < 0.30

    if (success) {
        user.penjara = 0
        await m.reply("🏃‍♂️💨 *BERHASIL KABUR!* \n\nKamu berhasil membobol sel dan melarikan diri dari penjara! Kamu sekarang bebas!")
    } else {
        let fine = Math.floor(Math.random() * 50000) + 10000
        user.money -= fine
        await m.reply(`🚔 *GAGAL KABUR!* \n\nUsahamu untuk melarikan diri ketahuan oleh sipir penjara! Kamu dipukuli dan didenda sebesar *Rp${fine.toLocaleString('id-ID')}*.`)
    }
}

handler.help = ["kabur"]
handler.tags = ["rpg"]
handler.command = /^(kabur)$/i
handler.group = true
handler.register = true
handler.rpg = true

export default handler

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}
