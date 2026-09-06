let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    let users = global.db.data.users
    let dapat = (Math.floor(Math.random() * 100000))
    let healtu = (Math.floor(Math.random() * 100))
    let rawWho = m.mentions?.[0] || m.quoted?.sender || false
    if (!rawWho) return m.reply('Tag orang yang mau kamu Bunuh!')
    let who = conn.decodeJid(rawWho)
    if (!who) return m.reply('Tag orang yang mau kamu Bunuh!')
    const allKeys = Object.keys(global.db.data.users)
    const whoNum = who.split('@')[0].split(':')[0]
    const matchKey = allKeys.find(k => k.split('@')[0].split(':')[0] === whoNum)
    if (!matchKey) return m.reply('Pengguna tidak ada didalam data base')
    who = matchKey
    if (users[who].level > users[m.sender].level) return m.reply(`Level kamu harus lebih tinggi dari @${who.split('@')[0]} Untuk bisa Membunuhnya!`, false, {
        mentions: [who]
    })
    let __timers = (new Date - global.db.data.users[m.sender].lastsda)
    let _timers = (3600000 - __timers)
    let timers = clockString(_timers)
    if (new Date - global.db.data.users[m.sender].lastsda > 3600000) {
        if (users[who].health <= 10) return m.reply(`❤️ Target sudah sekarat, health hanya ${users[who].health}!`)
        if (users[who].money < 100) return m.reply(`💠 Target tidak punya cukup money! (${toRupiah(users[who].money)} money)`)
        users[who].health -= healtu * 1
        users[who].money -= dapat * 1
        users[m.sender].money += dapat * 1
        global.db.data.users[m.sender].lastsda = new Date * 1
        users[m.sender].dosa += 1
        
        let bountyClaimed = 0
        if (users[who].bounty && users[who].bounty > 0) {
            bountyClaimed = users[who].bounty
            users[m.sender].money += bountyClaimed
            users[who].bounty = 0
            users[who].dosa = 0
        }

        let msg = `Target berhasil di bunuh dan kamu mengambil money target sebesar\n💰${toRupiah(dapat)} money\ndarah target berkurang -${healtu} health❤\n📥 Dosa Bertambah = +1\n📥 Total Dosa = ${users[m.sender].dosa}`
        
        if (bountyClaimed > 0) {
            msg += `\n\n🚨 *BOUNTY DIKLAIM!* 🚨\nKamu berhasil mendapatkan uang sayembara buronan sebesar *Rp${toRupiah(bountyClaimed)}*!\nDosa buronan kini telah di-reset.`
        }

        conn.reply(m.chat, msg, m)
    } else conn.reply(m.chat, `Anda Sudah Membunuh Dan Berhasil Sembunyi, tunggu ${timers} untuk membunuh lagi`, m)
}

handler.help = ['membunuh']
handler.tags = ['rpg']
handler.command = /^(membunuh)$/i
handler.register = true
handler.group = true
handler.rpg = true

export default handler

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

const toRupiah = number => parseInt(number).toLocaleString().replace(/,/gi, ".")