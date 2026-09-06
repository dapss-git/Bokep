let handler = async (m, {
    conn,
    usedPrefix,
    command,
    text
}) => {
    let rawWho = m.mentions?.[0] || m.quoted?.sender || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false)
    if (!m.isGroup) rawWho = m.chat
    if (!rawWho) return m.reply(`Reply atau tag orangnya\n\nContoh:\n${usedPrefix + command} @${m.sender.split('@')[0]}`, false, {
        contextInfo: {
            mentionedJid: [m.sender]
        }
    })

    let who = conn.decodeJid(rawWho)
    if (!who) return m.reply('Target tidak valid')

    const allKeys = Object.keys(global.db.data.users)
    const whoNum = who.split('@')[0].split(':')[0]
    const senderNum = m.sender.split('@')[0].split(':')[0]

    if (whoNum === senderNum) return m.reply('Tidak bisa hack diri sendiri!')

    const matchKey = allKeys.find(k => k.split('@')[0].split(':')[0] === whoNum)
    if (!matchKey) return m.reply('Orang tersebut tidak ada didatabase')
    who = matchKey

    let users = global.db.data.users
    let user = users[m.sender]
    let target = users[who]

    if (target.bank < 1000000) return m.reply('Saldo bank orang tersebut tidak mencukupi')

    let lock = target.lockBankCD || 0
    if (new Date() - lock < 36000000) {
        return m.reply(`Bank orang tersebut terkunci selama ${getTime(36000000, lock)}`)
    }

    let lastHack = user.lasthackbank || 0
    if (new Date() - lastHack < 10800000) {
        return conn.reply(m.chat, `Anda sudah menjebol bank, tunggu ${getTime(10800000, lastHack)}`, m)
    }

    if (user.level < target.level) return m.reply('Level kamu kurang untuk hack bank dia')

    let dapat = Math.floor(Math.random() * 1000000)

    let caption = [
        'Please enter the password and user',
        'Login *****',
        'Password ******',
        `Berhasil masuk ke sistem ${conn.getName(who)}`,
        `Mengambil *${toRupiah(dapat)} Money* ${global.rpg.emoticon("money")}`,
        'Logout ******',
        `Berhasil mendapatkan *${toRupiah(dapat)} Money* ${global.rpg.emoticon("money")} dari bank user`
    ]

    target.bank -= dapat
    user.money += dapat
    user.lasthackbank = new Date().getTime()
    user.dosa += 1

    let initialMessage = await conn.sendMessage(m.chat, { text: 'Sedang mencoba menjebol sistem...' }, { quoted: m });
    let key = initialMessage.key;

    for (let cap of caption) {
        await conn.sendMessage(m.chat, {
            text: cap,
            edit: key
        })
        await delay(2000)
    }

    conn.sendMessage(m.chat, {
        text: `Sukses hack bank @${whoNum}\n📥 Dosa Bertambah = +1\n📥 Total Dosa = ${user.dosa}`,
        contextInfo: {
            mentionedJid: [who]
        }
    }, {
        quoted: m
    })
}

handler.help = ['hackbank']
handler.tags = ['rpg']
handler.command = ['hackbank']
handler.rpg = true
handler.group = true
handler.register = true;
export default handler

const isNumber = x => typeof x === 'number' && !isNaN(x)

const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(() => resolve(), ms))

function getTime(cooldown, date) {
    let __timers = (new Date - date)
    let _timers = (cooldown - __timers)
    return clockString(_timers)
}

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

const toRupiah = n => parseInt(n).toLocaleString().replace(/,/g, '.')