import {
    randomInt
} from "crypto"

let handler = async (m, {
    conn,
    usedPrefix
}) => {
    let user = global.db.data.users[m.sender]
    const now = Date.now()

    // cooldown 1 jam
    const cooldown = 1 * 60 * 60 * 1000
    if (user.lastDemo && now - user.lastDemo < cooldown) {
        const sisa = Math.ceil((cooldown - (now - user.lastDemo)) / (60 * 1000))
        return m.reply(`🕒 Kamu masih capek demo! Tunggu ${sisa} menit lagi sebelum demo lagi.`)
    }

    // hasil acak
    const chance = randomInt(100)
    let result, moneyChange = 0,
        expChange = 0

    if (chance < 25) {
        result = "🚔 Kamu ditangkap polisi saat demo! Uangmu berkurang Rp1.000.000 💸"
        moneyChange = -1000000
    } else if (chance < 70) {
        result = "🔥 Kamu berhasil demo dan menumbangkan koruptor DPR! Dapat Rp2.000.000 💰 + Exp 1000"
        moneyChange = 2000000
        expChange = 1000
    } else {
        result = "💨 Koruptor kabur lewat belakang gedung DPR, kamu gak dapet apa-apa."
    }

    // update data user
    user.money = (user.money || 0) + moneyChange
    user.exp = (user.exp || 0) + expChange
    user.lastDemo = now

    await m.reply(`🪧 *DEMO SELESAI!* 🪧\n\n${result}`)
}

handler.help = ["demo"]
handler.tags = ["rpg"]
handler.command = /^(demo)$/i
handler.rpg = true
handler.register = true
export default handler