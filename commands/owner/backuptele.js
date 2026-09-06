import fs from "fs"
import {
    execSync
} from "child_process"
import fetch from "node-fetch"
import FormData from "form-data"

const TELEGRAM_TOKEN = "8860804193:AAFbpvZGiIC-mtMMx1ugfZtJYVWbQXKROAA"
const TELEGRAM_CHAT_ID = "8136654727"

async function sendToTelegram(backupPath, fileName) {
    const form = new FormData()
    form.append("chat_id", TELEGRAM_CHAT_ID)
    form.append("document", fs.createReadStream(backupPath), fileName)
    form.append("caption", `🤖 Backup Script\n📁 ${fileName}\n🕒 ${new Date().toLocaleString("id-ID")}`)

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
        method: "POST",
        body: form,
        headers: form.getHeaders()
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.description || "Gagal kirim ke Telegram")
}

async function doBackup() {
    const tempDir = "./tmp"
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, {
        recursive: true
    })

    const backupName = global.botname || "backup"
    const backupPath = `${tempDir}/${backupName}.zip`

    if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath)

    const ls = (await execSync("ls")).toString().split("\n").filter(
        pe => pe !== "node_modules" && pe !== "sessions" &&
        pe !== "package-lock.json" && pe !== "yarn.lock" &&
        pe !== "pnpm-lock.yaml" && pe !== "" && pe !== "node"
    )
    await execSync(`zip -r ${backupPath} ${ls.join(" ")}`)

    if (!fs.existsSync(backupPath)) throw new Error("File backup gagal dibuat.")

    await sendToTelegram(backupPath, `${backupName}.zip`)
    fs.unlinkSync(backupPath)
}

let handler = async (m, {
    conn
}) => {
    try {
        await doBackup()
        m.reply("✅ Script bot berhasil dikirim ke Telegram owner!")
    } catch (e) {
        m.reply(`❌ Gagal backup: ${e.message}`)
    }
}

handler.help = ["backuptele"]
handler.tags = ["owner"]
handler.command = ["backuptele"]
handler.owner = true
handler.register = true

export default handler