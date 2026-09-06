import {
    spawn
} from "child_process"
import fs from "fs"
import path from "path"
import crypto from "crypto"

async function runFFmpeg(input, output) {
    return new Promise((resolve, reject) => {
        const ff = spawn("ffmpeg", [
            "-i", input,
            "-vf", "scale=-2:1080,fps=30",
            "-c:v", "libx264",
            "-profile:v", "high",
            "-level", "4.0",
            "-pix_fmt", "yuv420p",
            "-preset", "medium",
            "-crf", "21",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            output
        ])

        ff.on("error", reject)
        ff.on("close", code => {
            if (code === 0) resolve()
            else reject(new Error("FFmpeg gagal memproses video"))
        })
    })
}

let handler = async (m, {
    conn,
    command,
    args
}) => {
    try {
        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || ""
        if (!mime.startsWith("video/")) return m.reply("Mana videonya")

        m.reply("Wait")

        if (!fs.existsSync("tmp")) fs.mkdirSync("tmp")

        const buffer = await q.download()

        const id = crypto.randomBytes(6).toString("hex")
        const inputPath = path.join("tmp", id + ".mp4")
        const outputPath = path.join("tmp", id + "_hd.mp4")

        fs.writeFileSync(inputPath, buffer)

        await runFFmpeg(inputPath, outputPath)

        const outBuffer = fs.readFileSync(outputPath)

        await conn.sendMessage(m.chat, {
            video: outBuffer
        }, {
            quoted: m
        })

        fs.unlinkSync(inputPath)
        fs.unlinkSync(outputPath)

    } catch (e) {
        m.reply(e.message)
    }
}

handler.help = ["swhd", "hdsw"]
handler.tags = ["tools"]
handler.command = ["swhd", "hdsw"]

handler.register = true

export default handler