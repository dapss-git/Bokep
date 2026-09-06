let handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender]
    if (!user) return m.reply("Kamu belum terdaftar di database")

    if (!user.bisnis) user.bisnis = { minimarket: 0, restoran: 0, klubmalam: 0, lastprofit: 0 }
    
    let b = user.bisnis

    if (b.minimarket === 0 && b.restoran === 0 && b.klubmalam === 0) {
        return m.reply("Kamu belum memiliki bisnis apa pun! Ketik *.bisnis* untuk melihat daftar properti yang bisa dibeli.")
    }

    if (b.lastprofit === 0) {
        b.lastprofit = Date.now()
        return m.reply("Bisnismu baru saja mulai beroperasi, belum ada profit yang terkumpul. Silakan tunggu beberapa saat lagi!")
    }

    let elapsedMs = Date.now() - b.lastprofit
    let elapsedHours = elapsedMs / 3600000 // Convert ms to hours

    if (elapsedHours < 1) {
        let remainingMinutes = Math.ceil((1 - elapsedHours) * 60)
        return m.reply(`Profit bisnismu belum siap dicairkan! Tunggu sekitar *${remainingMinutes} menit* lagi.`)
    }

    // Cap at 24 hours so players can't just AFK for 1 year and get infinite money
    if (elapsedHours > 24) elapsedHours = 24

    const bisnisList = {
        minimarket: { profitBase: 10000 },
        restoran: { profitBase: 50000 },
        klubmalam: { profitBase: 300000 }
    }

    let totalProfit = 0
    let detailMsg = ""

    for (let key in bisnisList) {
        let level = b[key]
        if (level > 0) {
            let hourlyProfit = bisnisList[key].profitBase * level
            let generatedProfit = Math.floor(hourlyProfit * elapsedHours)
            totalProfit += generatedProfit
            detailMsg += `- ${key.charAt(0).toUpperCase() + key.slice(1)} (Lv.${level}): Rp${generatedProfit.toLocaleString('id-ID')}\n`
        }
    }

    user.money += totalProfit
    b.lastprofit = Date.now()

    let msg = `💰 *PROFIT BISNIS CAIR!* 💰\n\nKamu mengklaim hasil keuntungan dari seluruh bisnismu selama *${Math.floor(elapsedHours)} jam* terakhir.\n\n*Rincian:*\n${detailMsg}\n`
    msg += `*Total Pendapatan: Rp${totalProfit.toLocaleString('id-ID')}*\n`
    if (elapsedHours === 24) msg += `\n_(Catatan: Profit maksimal yang bisa ditampung adalah 24 jam. Klaim setidaknya sehari sekali!)_`

    await m.reply(msg)
}

handler.help = ["profit"]
handler.tags = ["rpg"]
handler.command = /^(profit)$/i
handler.group = true
handler.register = true
handler.rpg = true

export default handler
