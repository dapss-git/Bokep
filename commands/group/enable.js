import moment from 'moment-timezone'

function wish() {
    const time = moment.tz('Asia/Jakarta').format('HH')
    if (time >= 18) return 'Selamat Malam'
    if (time >= 15) return 'Selamat Sore'
    if (time >= 11) return 'Selamat Siang'
    if (time >= 4) return 'Selamat Pagi'
    return 'Selamat Malam'
}

let handler = async (m, {
    usedPrefix,
    command,
    args,
}) => {

    let group = global.db.data.chats[m.chat] || {}

    if (group.antiToxic !== undefined && group.antitoxic === undefined) {
        group.antitoxic = group.antiToxic
        delete group.antiToxic
    }

    const isEnable = /^(enable|on|true|1)$/i.test(command)

    const options = {
        antilink: 'antilink',
        antilinkgc: 'antilinkgc',
        antilinkwa: 'antilinkwa',
        antidelete: 'antidelete',
        antifoto: 'antifoto',
        antiaudio: 'antiaudio',
        antimedia: 'antimedia',
        antipolling: 'antipolling',
        antivideo: 'antivideo',
        antisticker: 'antisticker',
        antitagall: 'antitagall',
        antitagsw: 'antitagsw',
        antitagsw2: 'antitagsw2',
        antispam: 'antispam',
        anticall: 'anticall',
        antibot: 'antibot',
        antibugcatalog: 'antibugcatalog',
        antivirtex: 'antivirtex',
        antiluar: 'antiluar',
        antitoxic: 'antitoxic',
        autolevelup: 'autolevelup',
        autodownload: 'autodownload',
        autohd: 'autohd',
        autosticker: 'autosticker',
        detect: 'detect',
        game: 'game',
        mute: 'mute',
        nsfw: 'nsfw',
        rpg: 'rpg',
        welcome: 'welcome'
    }

    const optionKeys = Object.keys(options).sort()

    // parse args: bisa nama ("mute") atau angka ("1", "23")
    const rawInput = args.join(' ').toLowerCase().trim()

    if (!rawInput) {
        let teks = `◦❒ SETTINGS GRUP\n`
        teks += `◦❒ ${wish()}\n\n`

        optionKeys.forEach((key, i) => {
            teks += `${i + 1}. ${key} : ${group[options[key]] ? '🟢 ON' : '🔴 OFF'}\n`
        })

        teks += `\nContoh:\n`
        teks += `${usedPrefix}enable mute\n`
        teks += `${usedPrefix}disable antisticker\n`
        teks += `${usedPrefix}on 1 3 5\n`
        teks += `${usedPrefix}off 23`

        return m.reply(teks)
    }

    // kumpulkan semua token dari semua args
    const tokens = rawInput.split(/\s+/)
    const resolved = []

    for (const token of tokens) {
        if (/^\d+$/.test(token)) {
            // angka → index (1-based)
            const idx = parseInt(token) - 1
            if (idx >= 0 && idx < optionKeys.length) {
                resolved.push(optionKeys[idx])
            }
        } else if (options[token]) {
            resolved.push(token)
        }
    }

    if (!resolved.length) {
        return m.reply(`◦❒ Tidak ada fitur valid yang ditemukan.\nKirim ${usedPrefix}enable tanpa argumen untuk melihat daftar.`)
    }

    for (const key of resolved) {
        group[options[key]] = isEnable
    }

    global.db.data.chats[m.chat] = group
    global.db.save()

    const list = resolved.map(k => `• ${k}`).join('\n')
    m.reply(
        `◦❒ Berhasil diubah ke ${isEnable ? 'ON 🟢' : 'OFF 🔴'}\n\n${list}`
    )
}

handler.help = ['enable', 'disable']
handler.tags = ['tools']
handler.command = /^((en|dis)able|setting|settings|(tru|fals)e|(turn)?o(n|ff)|[01])$/i
handler.group = true
handler.admin = true
handler.register = true

export default handler