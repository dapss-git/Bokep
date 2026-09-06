import {
    readFileSync
} from 'fs'

let handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {

    const thumb = readFileSync('./media/menu.jpg')

    await conn.relayMessage(m.chat, {
        extendedTextMessage: {
            text: `${global.website}\n\n◦ *Website* : ${global.website}\n◦ *Bot* : ${global.botname || 'bot'}\n◦ *Status* : Online ✅\n\n_Kunjungi website resmi kami untuk dokumentasi lengkap_`,
            matchedText: global.website,
            title: global.botname || 'bot',
            previewType: 'NONE',
            jpegThumbnail: thumb.toString('base64')
        }
    }, {})

    await new Button(conn)
        .setTitle('🌐 Website')
        .setSubtitle('Official Links')
        .setBody('Kunjungi website resmi kami')
        .setFooter(`© ${global.botname || 'bot'}`)
        .addUrl('🌐 Kunjungi Website', global.website, true)
        .send(m.chat)

};

handler.help = ['webapi'];
handler.tags = ['info'];
handler.command = /^(webapi|web)$/i;
handler.description = 'Tampilkan link website resmi bot';
handler.limit = false;

handler.register = true

export default handler;