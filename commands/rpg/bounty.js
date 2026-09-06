let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    if (!user) return m.reply("Kamu belum terdaftar di database")

    let who = m.mentionedJid?.[0] || m.quoted?.sender
    if (!who && text) {
        let textWithoutMentions = text.replace(/@\d+/g, '').trim()
        let match = textWithoutMentions.match(/\d+/)
        if (!who && m.quoted) who = m.quoted.sender
    }
    
    // Extract nominal from text
    let nominal = text.replace(/@\d+/g, '').replace(/[^\d]/g, '')
    let amount = parseInt(nominal)

    if (!who) return m.reply(`Tag orang yang ingin kamu pasang bounty!\nContoh: ${usedPrefix + command} @user 500000`)
    if (!amount || isNaN(amount) || amount < 10000) return m.reply("Masukkan jumlah bounty yang valid (minimal 10.000)!")
    
    let target = global.db.data.users[who]
    if (!target) return m.reply("Orang tersebut tidak terdaftar di database")

    if (who === m.sender) return m.reply("Kamu tidak bisa menaruh bounty pada dirimu sendiri!")
    if (user.money < amount) return m.reply(`Uangmu tidak cukup! Uangmu: Rp${user.money.toLocaleString('id-ID')}`)

    if ((target.dosa || 0) < 5) return m.reply("Orang tersebut belum cukup berdosa untuk dipasang bounty (Minimal Dosa: 5)!")

    user.money -= amount
    target.bounty = (target.bounty || 0) + amount

    await m.reply(
        `🚨 *SAYEMBARA BURONAN DIBUAT!* 🚨\n\n@${m.sender.split("@")[0]} telah memasang bounty sebesar *Rp${amount.toLocaleString('id-ID')}* pada kepala @${who.split("@")[0]}!\n\nSiapapun yang berhasil melakukan *.membunuh @user* akan mendapatkan uang bounty ini!\nTotal Bounty target sekarang: *Rp${target.bounty.toLocaleString('id-ID')}*`,
        false, { mentions: [m.sender, who] }
    )
}

handler.help = ["bounty @user nominal"]
handler.tags = ["rpg"]
handler.command = /^(bounty)$/i
handler.group = true
handler.register = true

export default handler
