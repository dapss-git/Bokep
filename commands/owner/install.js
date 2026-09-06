import {
    exec
} from 'child_process'
import {
    promisify
} from 'util'

const execAsync = promisify(exec)

let handler = async (m, {
    text,
    usedPrefix,
    command
}) => {
    if (!text) return m.reply(`Masukkan nama modul yang akan diinstall.\nContoh: ${usedPrefix + command} axios`)

    // Pisahkan beberapa modul jika dipisah spasi
    const modules = text.trim().split(/\s+/)
    if (modules.length === 0) return m.reply('❌ Modul tidak valid.')

    await m.reply(`⏳ Menginstall ${modules.join(', ')}...`)

    let success = []
    let failed = []

    for (const mod of modules) {
        // Validasi nama modul (agar tidak terjadi typo)
        if (!/^[a-zA-Z0-9@/._-]+$/.test(mod)) {
            failed.push(`${mod} (nama tidak valid)`)
            continue
        }

        try {
            // Jalankan npm install per modul, dengan timeout & flag agar tidak bertele-tele
            const {
                stdout,
                stderr
            } = await execAsync(`npm install ${mod} --no-audit --no-fund`, {
                timeout: 120000,
                maxBuffer: 1024 * 1024 * 5
            })

            if (stderr && /error/i.test(stderr)) {
                // Cek jika ada error E404 atau semacamnya
                const errLine = stderr.match(/npm error[^\n]*/i)?.[0] || 'unknown error'
                failed.push(`${mod} (${errLine})`)
            } else {
                success.push(mod)
            }
        } catch (err) {
            // Tangkap error dari execAsync, ambil pesan penting
            const msg = err.message.match(/npm error[^\n]*/i)?.[0] || err.message.split('\n')[0]
            failed.push(`${mod} (${msg})`)
        }
    }

    let reply = '📦 *Hasil Instalasi*\n\n'
    if (success.length) {
        reply += `✅ Berhasil: ${success.join(', ')}\n`
    }
    if (failed.length) {
        reply += `❌ Gagal: ${failed.join('\n- ')}\n`
    }
    if (!success.length && !failed.length) {
        reply += 'Tidak ada modul yang diproses.'
    }

    await m.reply(reply)
}

handler.help = ['install <module>']
handler.tags = ['owner']
handler.command = /^(install|npm)$/i
handler.owner = true
handler.register = true

export default handler