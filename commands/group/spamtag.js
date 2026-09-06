import {
    jidNormalizedUser
} from 'baileys'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const handler = async (m, {
    conn,
    text,
    args
}) => {
    if (!text) return m.reply(`Contoh:\n.spamtag 3 @user Halo semua`)

    let jumlah = parseInt(args[0])
    if (isNaN(jumlah)) jumlah = 5
    if (jumlah < 1) jumlah = 1
    if (jumlah > 10) jumlah = 10

    const rawMentions = m.mentions?.length ?
        m.mentions :
        m.quoted?.sender ?
        [m.quoted.sender] :
        []

    if (!rawMentions.length) return m.reply('❌ Tag minimal 1 user!')

    const mentionedJid = rawMentions.map(jid => jidNormalizedUser(jid))

    // Buang angka jumlah di depan dan strip @nomor dari teks
    const teks = args.slice(1)
        .join(' ')
        .replace(/@\d+/g, '')
        .trim()

    // Teks di samping tag: │◦❒ @Theresa <teks>
    const body = mentionedJid
        .map(v => `│◦❒ @${v.replace(/@.+/, '')}${teks ? ` ${teks}` : ''}`)
        .join('\n')

    for (let i = 0; i < jumlah; i++) {
        await conn.sendMessage(
            m.chat, {
                text: body,
                mentions: mentionedJid
            }, {
                quoted: m
            }
        )
        if (i < jumlah - 1) await delay(1500)
    }
}

handler.help = ['spamtag <jumlah> @user <teks>']
handler.tags = ['group']
handler.command = ['spamtag']
handler.group = true
handler.owner = true
handler.register = true;

export default handler