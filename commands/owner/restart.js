import {
    exec
} from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

const handler = async (m, {
    conn,
    text
}) => {
    const isHard = text?.toLowerCase() === 'hard'

    await conn.sendMessage(m.chat, {
        react: {
            text: '🔄',
            key: m.key
        }
    });

    await m.reply(
        `♻️ *Merestart bot...*${isHard ? '\n(Cleaning session cache...)' : ''}\n\n` +
        `> Jika bot tidak kembali dalam 30 detik, restart manual diperlukan.`
    );

    // Delay agar pesan terkirim dahulu
    await new Promise(r => setTimeout(r, 2000));

    // Hard restart: Hapus junk session
    if (isHard) {
        try {
            const sessionDir = "./sessions";
            if (fs.existsSync(sessionDir)) {
                const files = fs.readdirSync(sessionDir).filter(f => f !== "creds.json");
                for (let file of files) {
                    const fullPath = path.join(sessionDir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        fs.rmSync(fullPath, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(fullPath);
                    }
                }
            }
        } catch (e) {
            console.error("Gagal hapus junk session saat restart:", e);
        }
    }

    // Cek apakah berjalan di PM2
    try {
        const {
            stdout
        } = await execPromise('pm2 id ' + (process.env.name || process.env.pm_id || 'bot'));
        if (stdout && stdout.trim() !== '[]') {
            const pmId = process.env.pm_id || process.env.name || 'bot';
            exec(`pm2 restart ${pmId}`);
            return;
        }
    } catch (_) {}

    // Cek pm_id langsung dari env (kalau dijalankan via PM2)
    if (process.env.pm_id !== undefined) {
        exec(`pm2 restart ${process.env.pm_id}`);
        return;
    }

    // Fallback: spawn proses baru lalu exit
    const args = process.argv.slice(1);
    const child = exec(
        `${process.execPath} ${args.join(' ')}`, {
            detached: true,
            stdio: 'ignore'
        }
    );
    child?.unref?.();

    setTimeout(() => process.exit(0), 500);
};

handler.help = ['restart'];
handler.command = /^restart$/i;
handler.tags = ['owner'];
handler.description = 'Restart proses bot utama.';
handler.owner = true;
handler.register = true;

export default handler;