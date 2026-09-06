let handler = async (m, { conn, args, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    if (!user) return m.reply("Kamu belum terdaftar di database")

    // Initialize business data if not exists
    if (!user.bisnis) user.bisnis = { minimarket: 0, restoran: 0, klubmalam: 0, lastprofit: 0 }
    
    let b = user.bisnis

    const bisnisList = {
        minimarket: { nama: '🏪 Minimarket', harga: 500000, profitBase: 10000 },
        restoran: { nama: '🍽️ Restoran', harga: 2000000, profitBase: 50000 },
        klubmalam: { nama: '🪩 Klub Malam', harga: 10000000, profitBase: 300000 }
    }

    if (!args[0]) {
        let msg = `🏢 *SISTEM BISNIS & PROPERTI* 🏢\nJadilah pengusaha dan dapatkan Passive Income!\n\n`
        msg += `*Aset Bisnismu:*\n`
        msg += `- 🏪 Minimarket: Level ${b.minimarket}\n`
        msg += `- 🍽️ Restoran: Level ${b.restoran}\n`
        msg += `- 🪩 Klub Malam: Level ${b.klubmalam}\n\n`
        msg += `Gunakan *.profit* untuk mengambil semua penghasilan dari bisnismu.\n\n`
        msg += `*Beli / Upgrade Bisnis:*\n`
        
        for (let key in bisnisList) {
            let item = bisnisList[key]
            let currentLevel = b[key]
            let cost = currentLevel === 0 ? item.harga : item.harga * (currentLevel + 1)
            let profit = item.profitBase * (currentLevel + 1)
            msg += `\n${item.nama}\n`
            if (currentLevel === 0) {
                msg += `Harga Beli: Rp${cost.toLocaleString('id-ID')}\n`
                msg += `Profit: Rp${profit.toLocaleString('id-ID')} / jam\n`
                msg += `Ketik: *${usedPrefix}bisnis beli ${key}*\n`
            } else {
                msg += `Upgrade ke Level ${currentLevel + 1}\n`
                msg += `Harga Upgrade: Rp${cost.toLocaleString('id-ID')}\n`
                msg += `Profit Berikutnya: Rp${profit.toLocaleString('id-ID')} / jam\n`
                msg += `Ketik: *${usedPrefix}bisnis upgrade ${key}*\n`
            }
        }
        return m.reply(msg)
    }

    let action = args[0].toLowerCase()
    let type = args[1] ? args[1].toLowerCase() : ''

    if (!['beli', 'upgrade'].includes(action)) {
        return m.reply(`Aksi tidak valid! Gunakan *${usedPrefix}bisnis* untuk melihat daftar.`)
    }

    if (!bisnisList[type]) {
        return m.reply(`Tipe bisnis tidak valid! Pilih: minimarket, restoran, atau klubmalam.`)
    }

    let item = bisnisList[type]
    let currentLevel = b[type]

    if (action === 'beli') {
        if (currentLevel > 0) return m.reply(`Kamu sudah memiliki ${item.nama}! Gunakan perintah upgrade.`)
        let cost = item.harga
        if (user.money < cost) return m.reply(`Uangmu tidak cukup! Harga ${item.nama} adalah Rp${cost.toLocaleString('id-ID')}`)
        
        user.money -= cost
        b[type] = 1
        if (b.lastprofit === 0) b.lastprofit = Date.now() // start profit timer
        return m.reply(`🎉 *PEMBELIAN BERHASIL!* 🎉\nKamu telah membeli ${item.nama} seharga Rp${cost.toLocaleString('id-ID')}! Sekarang bisnis ini akan menghasilkan uang setiap jam. Gunakan *.profit* untuk mengambil keuntungan.`)
    }

    if (action === 'upgrade') {
        if (currentLevel === 0) return m.reply(`Kamu belum memiliki ${item.nama}! Gunakan perintah beli terlebih dahulu.`)
        if (currentLevel >= 10) return m.reply(`${item.nama} milikmu sudah mencapai Level Maksimal (Level 10)!`)
        
        let cost = item.harga * (currentLevel + 1)
        if (user.money < cost) return m.reply(`Uangmu tidak cukup! Biaya upgrade ke Level ${currentLevel + 1} adalah Rp${cost.toLocaleString('id-ID')}`)
        
        user.money -= cost
        b[type] += 1
        return m.reply(`📈 *UPGRADE BERHASIL!* 📈\n${item.nama} milikmu berhasil di-upgrade ke *Level ${b[type]}*! Profit per jam dari bisnis ini telah meningkat pesat.`)
    }
}

handler.help = ["bisnis", "bisnis beli <tipe>", "bisnis upgrade <tipe>"]
handler.tags = ["rpg"]
handler.command = /^(bisnis)$/i
handler.group = true
handler.register = true
handler.rpg = true

export default handler
