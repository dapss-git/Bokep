import {
    sticker
} from '../../library/sticker.js'

let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command,
    user
}) => {
    try {
        if (!text) return m.reply(`Contoh: ${usedPrefix + command} [warna_opsional] teks`)

        await conn.sendReact(m.chat, '⏳', m.key)

        const COLORS = {
            pink: '#f68ac9',
            blue: '#6cace4',
            red: '#f44336',
            green: '#4caf50',
            yellow: '#ffeb3b',
            purple: '#9c27b0',
            darkblue: '#0d47a1',
            lightblue: '#03a9f4',
            ash: '#9e9e9e',
            orange: '#ff9800',
            black: '#000000',
            white: '#ffffff',
            teal: '#008080',
            lightpink: '#FFC0CB',
            chocolate: '#A52A2A',
            salmon: '#FFA07A',
            magenta: '#FF00FF',
            tan: '#D2B48C',
            wheat: '#F5DEB3',
            deeppink: '#FF1493',
            fire: '#B22222',
            skyblue: '#00BFFF',
            brightskyblue: '#1E90FF',
            hotpink: '#FF69B4',
            lightskyblue: '#87CEEB',
            seagreen: '#20B2AA',
            darkred: '#8B0000',
            orangered: '#FF4500',
            cyan: '#48D1CC',
            violet: '#BA55D3',
            mossgreen: '#00FF7F',
            darkgreen: '#008000',
            navyblue: '#191970',
            darkorange: '#FF8C00',
            darkpurple: '#9400D3',
            fuchsia: '#FF00FF',
            darkmagenta: '#8B008B',
            darkgray: '#2F4F4F',
            peachpuff: '#FFDAB9',
            darkishgreen: '#BDB76B',
            darkishred: '#DC143C',
            goldenrod: '#DAA520',
            darkishgray: '#696969',
            darkishpurple: '#483D8B',
            gold: '#FFD700',
            silver: '#C0C0C0'
        }

        let split = text.trim().split(' ')
        let colorKey = split[0].toLowerCase()
        let message = COLORS[colorKey] ? split.slice(1).join(' ') : text
        let backgroundColor = COLORS[colorKey] || COLORS.white

        if (!message) return m.reply('Teks tidak boleh kosong!')
        if (message.length > 80) return m.reply(`Maximal 80 karakter!`)

        const username = user.name || 'User'
        const avatar = await conn.profilePictureUrl(m.sender, "image").catch(() => 'src/avatar_contact.png')
        const json = {
            type: 'quote',
            format: 'png',
            backgroundColor,
            width: 512,
            height: 768,
            scale: 2,
            messages: [{
                entities: [],
                avatar: true,
                from: {
                    id: 1,
                    name: username,
                    photo: {
                        url: avatar
                    }
                },
                text: m.quoted ? m.quoted.text : message,
                replyMessage: {}
            }]
        }

        const response = await fetch('https://bot.lyo.su/quote/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(json)
        });

        const data = await response.json();

        if (!data.result || !data.result.image) {
            return m.reply("Gagal membuat stiker kutipan.");
        }

        const buffer = Buffer.from(data.result.image, 'base64')
        let stiker = await sticker(buffer, {
            asSticker: true,
            author: global.author,
            pack: global.packname,
            crop: true
        })
        if (stiker) return conn.sendFile(m.chat, stiker, 'sticker.webp', '', m)
        throw stiker.toString()

    } catch (err) {
        console.error(err)
        m.reply('Terjadi kesalahan: ' + err)
    } finally {
        await conn.sendReact(m.chat, '✅', m.key)
    }
}

handler.help = ['qcstic <text>']
handler.tags = ['maker']
handler.command = ['qcstic', 'qc']
handler.description = 'Membuat stiker kutipan dengan warna latar belakang opsional.'
handler.register = true

export default handler