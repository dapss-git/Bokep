import {
    unlinkSync,
    readFileSync,
    writeFileSync,
    existsSync,
    mkdirSync
} from 'fs'
import {
    join
} from 'path'
import {
    exec
} from 'child_process'

let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    try {
        let q = m.quoted ? m.quoted : m
        let mime = q.msg?.mimetype || m.msg?.mimetype || ''

        if (!/audio/.test(mime)) {
            return m.reply(`Balas vn/audio yang ingin diubah dengan caption *${usedPrefix + command}*`)
        }

        if (!args[0] || !args[1]) {
            return m.reply(`example: ${usedPrefix + command} 00:00:30 00:00:30`)
        }

        await global.loading(m, conn)

        let tmpDir = join(process.cwd(), 'tmp')
        if (!existsSync(tmpDir)) mkdirSync(tmpDir, {
            recursive: true
        })

        let inputPath = join(tmpDir, getRandom('.mp3'))
        let outputPath = join(tmpDir, getRandom('.mp3'))

        let media = await (q.download ? q.download() : m.download())
        writeFileSync(inputPath, media)

        exec(`ffmpeg -y -ss ${args[0]} -i "${inputPath}" -t ${args[1]} -c copy "${outputPath}"`, async (err) => {
            try {
                try {
                    unlinkSync(inputPath)
                } catch {}
                if (err) return m.reply(`_*Error!*_`)

                let buff = readFileSync(outputPath)
                await conn.sendFile(m.chat, buff, 'cut.mp3', '', m, false, {
                    mimetype: 'audio/mpeg'
                })

                try {
                    unlinkSync(outputPath)
                } catch {}
            } catch {
                m.reply('Error processing file')
            }
        })

    } finally {
        global.loading(m, conn, true)
    }
}

handler.help = ['cutaudio']
handler.tags = ['audio']
handler.command = /^(potong(audio|mp3)|cut(audio|mp3))$/i
handler.register = true;
handler.limit = true;

export default handler

const getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`