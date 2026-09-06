import { uploadToTelegraph } from "../../library/uploadImage.js"
import uploadFile from "../../library/uploadFile.js"
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Jimp = require('jimp')

let handler = async (m, {
    conn,
    usedPrefix,
    args
}) => {
    try {
        let towidth = args[0]
        let toheight = args[1]
        if (!towidth) return m.reply('size width?')
        if (!toheight) return m.reply('size height?')

        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        if (!mime) return m.reply("where the media?")
        let isMedia = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime)
        if (!isMedia) return m.reply(`Mime ${mime} tidak didukung`)
        await global.loading(m, conn)
        let media = await q.download()
        let link = await uploadToTelegraph(media)

        let source = await Jimp.read(Buffer.from(media))
        let size = {
            before: {
                height: source.getHeight(),
                width: source.getWidth()
            },
            after: {
                height: toheight,
                width: towidth,
            },
        }
        let compres = await conn.resize(link, towidth - 0, toheight - 0)
        let linkcompres = await uploadToTelegraph(compres)

        await conn.sendFile(m.chat, compres, null, `––––––『 COMPRESS RESIZE 』––––––

• BEFORE
> Width : ${size.before.width}
> Height : ${size.before.height}

• AFTER
> Width : ${size.after.width}
> Height : ${size.after.height}

• LINK
> Link Original : ${link}
> Link Compress : ${linkcompres}`, m)
    } catch (e) {
        throw e
    } finally {
        await global.loading(m, conn, true)
    }
}
handler.help = ['resize']
handler.tags = ['tools']
handler.command = /^(resize)$/i
handler.limit = true;

handler.register = true

export default handler