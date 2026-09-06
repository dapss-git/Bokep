import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (text) {
        let isPid = /^\d+$/.test(text);
        let cmd = isPid ? `kill -9 ${text}` : `killall -9 ${text}`;
        let target = isPid ? `PID: *${text}*` : `proses dengan nama: *${text}*`;

        try {
            await execPromise(cmd);
            return m.reply(`✅ Berhasil menghentikan ${target}`);
        } catch (e) {
            return m.reply(`❌ Gagal menghentikan ${target}\nError: ${e.message}`);
        }
    }

    // List top processes
    try {
        const { stdout } = await execPromise("ps -eo pid,ppid,%cpu,%mem,comm --sort=-%cpu | head -n 21");
        let lines = stdout.split('\n').filter(l => l.trim() !== "");
        let headers = lines.shift(); // Remove header line
        
        let rows = lines.map(line => {
            let parts = line.trim().split(/\s+/);
            let pid = parts[0];
            let cpu = parts[2];
            let mem = parts[3];
            let comm = parts.slice(4).join(" ");
            
            return {
                header: `PID: ${pid} | CPU: ${cpu}% | MEM: ${mem}%`,
                title: comm,
                description: `Klik untuk menghentikan proses ini`,
                id: `${usedPrefix + command} ${pid}`
            };
        });

        if (rows.length === 0) return m.reply("❌ Tidak ada proses yang ditemukan.");

        return conn.sendMessage(m.chat, {
            text: `🖥️ *Process Manager*\n\nBerikut adalah daftar proses yang sedang berjalan (diurutkan berdasarkan penggunaan CPU tertinggi).`,
            footer: "Gunakan dengan hati-hati!",
            buttons: [{
                buttonId: "kill_process_select",
                buttonText: {
                    displayText: "⏹️ Kill Process"
                },
                type: 4,
                nativeFlowInfo: {
                    name: "single_select",
                    paramsJson: JSON.stringify({
                        title: "Daftar Proses",
                        sections: [{
                            title: "Pilih proses untuk di-kill",
                            rows
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    }
};

handler.help = ["kill [pid/name]"];
handler.tags = ["owner"];
handler.command = /^(kill|killall|stopall)$/i;
handler.owner = true;

handler.register = true

export default handler;
