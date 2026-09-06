let handler = async (m, {
    conn
}) => {
    let dapat = Math.floor(Math.random() * 100000)

    let rawWho = m.mentions?.[0] || m.quoted?.sender || false
    if (!m.isGroup) rawWho = m.chat
    if (!rawWho) return m.reply('Tag orang yang mau kamu Rampok!')

    let who = conn.decodeJid(rawWho)
    if (!who) return m.reply('Tag orang yang mau kamu Rampok!')

    const allKeys = Object.keys(global.db.data.users)
    const whoNum = who.split('@')[0].split(':')[0]
    const senderNum = m.sender.split('@')[0].split(':')[0]

    if (whoNum === senderNum) return m.reply('Tidak bisa merampok diri sendiri!')

    const matchKey = allKeys.find(k => k.split('@')[0].split(':')[0] === whoNum)
    if (!matchKey) return m.reply('Pengguna tidak ada didalam database')
    who = matchKey

    let users = global.db.data.users
    let user = users[m.sender]
    let target = users[who]

    if (target.level > user.level) {
        return m.reply(`Level kamu harus lebih tinggi dari @${whoNum} untuk bisa merampoknya!`, false, {
            contextInfo: {
                mentionedJid: [who]
            }
        })
    }

    let last = user.lastrampok || 0
    let timeDiff = new Date() - last
    let timeLeft = 3600000 - timeDiff

    if (timeDiff < 3600000) {
        return conn.reply(m.chat, `Anda sudah merampok, tunggu ${clockString(timeLeft)} untuk merampok lagi`, m)
    }

    if (target.money < 10000) return m.reply('Target tidak punya cukup uang')

    target.money -= dapat
    user.money += dapat
    user.lastrampok = new Date().getTime()
    user.dosa += 1

    conn.reply(m.chat, `Berhasil merampok @${whoNum} sebesar 💰${toRupiah(dapat)}\n📥 Dosa Bertambah = +1\n📥 Total Dosa = ${user.dosa}`, m, {
        contextInfo: {
            mentionedJid: [who]
        }
    })
}

handler.help = ['merampok']
handler.tags = ['rpg']
handler.command = /^(merampok)$/i
handler.register = true
handler.group = true
handler.rpg = true
handler.energy = 5
export default handler

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

const toRupiah = n => parseInt(n).toLocaleString().replace(/,/g, '.')