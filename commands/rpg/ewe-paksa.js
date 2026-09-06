import {
    areJidsSameUser
} from 'baileys'

let handler = async (m, {
    conn,
    isOwner
}) => {
    let rawWho = m.mentions?.[0] || m.quoted?.sender || false
    if (!rawWho) return m.reply('Tag siapa yang mau kamu ewe paksa!')

    let who = conn.decodeJid(rawWho)
    if (!who) return m.reply('Tag siapa yang mau kamu ewe paksa!')

    const allKeys = Object.keys(global.db.data.users)
    const whoNum = who.split('@')[0].split(':')[0]
    const matchKey = allKeys.find(k => k.split('@')[0].split(':')[0] === whoNum)
    if (!matchKey) return m.reply('Pengguna tidak ada di dalam database')
    who = matchKey

    let ownerNumbers = global.owner.map(o => o[0] + '@s.whatsapp.net')
    if (who === m.sender) return m.reply('Kamu tidak bisa ewe paksa dirimu sendiri!')
    if (areJidsSameUser(who, conn.user.jid)) return m.reply('Tidak bisa ewe paksa bot!')
    if (ownerNumbers.some(o => areJidsSameUser(o, who))) return m.reply('👑 Kamu tidak bisa ewe paksa Owner-ku tercinta!')

    let user = global.db.data.users[m.sender]
    let order = user.ojekk
    let __timers = new Date - user.lastmisi
    let _timers = 1200000 - __timers
    let timers = clockString(_timers)

    let name = conn.getName(m.sender)
    let targetName = conn.getName(who)
    let id = m.sender
    let kerja = 'ewe-paksa'
    conn.misi = conn.misi || {}

    if (id in conn.misi) {
        conn.reply(m.chat, `Selesaikan Misi ${conn.misi[id][0]} Terlebih Dahulu`, m)
        return
    }

    if (isOwner || __timers > 1200000) {
        let randomaku1 = Math.floor(Math.random() * 1000000)
        let randomaku2 = Math.floor(Math.random() * 10000)

        let dimas = `👙 kamu paksa @${who.split('@')[0]}\n     dia buka baju😋`
        let dimas2 = `🥵💦 sszz Ahhhh.....`
        let dimas3 = `🥵Ahhhh, Sakitttt!! >////<\n 💦Crotttt.....\n  💦Crottt lagi`
        let dimas4 = `🥵💦💦Ahhhhhh😫`
        let dosa_count = user.dosa + 1
        let hsl = `—[ Hasil Ewe Paksa ${name} terhadap ${targetName} ]—\n➕ 💹 Uang = [ ${randomaku1} ]\n➕ ✨ Exp = [ ${randomaku2} ]\n➕ 📥 Dosa Bertambah = +1\n➕ 📥 Total Dosa = ${dosa_count}`

        user.money += randomaku1
        user.exp += randomaku2
        user.dosa += 1

        conn.misi[id] = [
            kerja,
            setTimeout(() => {
                delete conn.misi[id]
            }, 27000)
        ]

        setTimeout(() => m.reply(hsl), 27000)
        setTimeout(() => m.reply(dimas4), 25000)
        setTimeout(() => m.reply(dimas3), 20000)
        setTimeout(() => m.reply(dimas2), 15000)
        setTimeout(() => conn.reply(m.chat, dimas, m, {
            mentions: [who]
        }), 10000)
        setTimeout(() => m.reply(`😋 mulai ewe paksa @${who.split('@')[0]}...`, null, {
            mentions: [who]
        }), 0)

        user.lastmisi = new Date * 1
    } else {
        m.reply(`Silahkan menunggu selama ${timers} untuk Ewe-paksa kembali`)
    }
}

handler.help = ['ewe-paksa @tag']
handler.tags = ['rpg', 'premium']
handler.command = /^(ewe-paksa)$/i
handler.register = true
handler.group = true
handler.premium = true
handler.nsfw = true
export default handler

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}