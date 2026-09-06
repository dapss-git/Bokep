let handler = async (m, { conn, usedPrefix }) => {
    let user = global.db.data.users[m.sender]
    let partner = user.nikah || user.pacar
    if (!partner) return m.reply("Kamu harus punya pasangan untuk kerja bareng!")
    
    if (user.tinggalBareng !== partner) return m.reply("Kamu dan pasangan harus tinggal bareng dulu!")

    if (new Date() - (user.lastKerjaBareng || 0) < 3600000) {
        let remaining = 3600000 - (new Date() - user.lastKerjaBareng)
        return m.reply(`Kamu dan pasangan lelah. Tunggu ${Math.floor(remaining / 60000)} menit lagi.`)
    }

    if (global.db.data.users[partner].ajakKerja === m.sender) {
        // Melakukan pekerjaan
        let money = Math.floor(Math.random() * 50000) + 50000
        let exp = Math.floor(Math.random() * 5000) + 2000

        // Bonus Anak Sekolah/Pintar
        let bonusMoney = 0
        let children = [...(user.children || []), ...(global.db.data.users[partner].children || [])]
        children.forEach(cid => {
            let child = global.db.data.users[cid]
            if (child && child.education) {
                if (child.education.status === "Pintar") bonusMoney += 10000
                if (child.education.status === "Lulus") bonusMoney += 25000
                if (child.education.status === "Sekolah") bonusMoney += 5000
            }
        })
        money += bonusMoney

        // Bonus perabotan TV
        let houseId = user.rumahTinggal
        let owner = user.rumah[houseId] ? m.sender : (global.db.data.users[partner].rumah[houseId] ? partner : null)
        if (owner) {
            let uHouse = global.db.data.users[owner].rumah[houseId]
            if (uHouse.furniture && uHouse.furniture.includes("Televisi")) {
                exp = Math.floor(exp * 1.05)
            }
        }

        user.money += money
        user.exp += exp
        global.db.data.users[partner].money += money
        global.db.data.users[partner].exp += exp

        user.lastKerjaBareng = Date.now()
        global.db.data.users[partner].lastKerjaBareng = Date.now()
        global.db.data.users[partner].ajakKerja = ""

        await m.reply(`💼 *KERJA BARENG SELESAI*\n\nKalian berdua kompak bekerja!\nMasing-masing mendapatkan:\n💰 Uang: Rp ${money.toLocaleString()}\n✨ EXP: ${exp.toLocaleString()}`, false, { mentions: [m.sender, partner] })
    } else {
        user.ajakKerja = partner
        await m.reply(`💼 @${m.sender.split("@")[0]} mengajak @${partner.split("@")[0]} untuk kerja bareng!\n\nPasangan harus mengetik *${usedPrefix}kerjabareng* untuk memulai.`, false, { mentions: [m.sender, partner] })
    }
}

handler.help = ["kerjabareng"]
handler.tags = ["rpg"]
handler.command = /^(kerjabareng)$/i
handler.group = true
handler.register = true

export default handler