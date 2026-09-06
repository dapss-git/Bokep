import path from 'path';
import fs from 'fs';
import js_beautify from 'js-beautify';
import {
    fileURLToPath
} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = '/root/base2/api';

function readFiles(dir, base = dir) {
    let results = [];
    const list = fs.readdirSync(dir);

    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            results = results.concat(readFiles(fullPath, base));
        } else if (file.endsWith('.js')) {
            results.push(path.relative(base, fullPath).replace(/\\/g, '/'));
        }
    }

    return results;
}

function safeJoin(base, target) {
    const targetPath = path.join(base, target);
    if (!targetPath.startsWith(base)) {
        throw new Error('Akses path tidak diizinkan');
    }
    return targetPath;
}

function safeReply(m, text) {
    try {
        if (typeof text !== "string") {
            text = JSON.stringify(text, null, 2);
        }
        return m.reply(text);
    } catch {
        return m.reply("Gagal reply.");
    }
}

const handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    const listApi = readFiles(BASE_DIR);

    const [option, ...pathParts] = args;
    const fullPathOrIndex = pathParts.join(' ').trim();

    if (!option || !['+', '-', '?'].includes(option[0]) || !fullPathOrIndex) {
        let txt = `Gunakan format: ${usedPrefix + command} [opsi] [nomor/path]\n\n`;
        txt += `Opsi:\n`;
        txt += `  + : Tambah API\n`;
        txt += `  - : Hapus API\n`;
        txt += `  ? : Lihat API\n\n`;
        txt += `Contoh:\n`;
        txt += `  ${usedPrefix + command} - 2\n`;
        txt += `  ${usedPrefix + command} + tools/test.js\n\n`;
        txt += `– Daftar API:\n`;
        txt += listApi.map((p, i) => `  ${i + 1}. ${p}`).join("\n");

        return safeReply(m, txt);
    }

    const action = option[0];
    let relativePath;

    const isIndex = !isNaN(fullPathOrIndex);
    if (isIndex && listApi[fullPathOrIndex - 1]) {
        relativePath = listApi[fullPathOrIndex - 1];
    } else {
        relativePath = fullPathOrIndex;
    }

    let targetPath;
    try {
        targetPath = safeJoin(BASE_DIR, relativePath);
    } catch (e) {
        return safeReply(m, e.message);
    }

    try {
        switch (action) {
            case '+': {
                if (!m.quoted) {
                    return safeReply(m, "Balas kode atau file .js");
                }

                let code = '';

                if (typeof m.quoted.text === 'string') {
                    code = m.quoted.text;
                } else if (m.quoted.isMedia) {
                    const buffer = await m.quoted.download();
                    code = buffer.toString('utf-8');
                }

                if (!code.trim()) {
                    return safeReply(m, "Kode kosong.");
                }

                const dir = path.dirname(targetPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, {
                        recursive: true
                    });
                }

                fs.writeFileSync(targetPath, js_beautify(code));

                return safeReply(m, `✅ API disimpan ke ${relativePath}`);
            }

            case '-': {
                if (!fs.existsSync(targetPath)) {
                    return safeReply(m, "API tidak ditemukan.");
                }

                fs.unlinkSync(targetPath);
                return safeReply(m, `🗑️ API dihapus: ${relativePath}`);
            }

            case '?': {
                if (!fs.existsSync(targetPath)) {
                    return safeReply(m, "API tidak ditemukan.");
                }

                const content = fs.readFileSync(targetPath, 'utf8');

                return conn.sendMessage(m.chat, {
                    text: `📄 API: ${relativePath}`,
                    footer: `© ${global.botname || 'Bot'}`,
                    title: `API Manager`,
                    interactiveButtons: [{
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "📋 Salin Kode API",
                            copy_code: content
                        })
                    }]
                }, {
                    quoted: m
                });
            }
        }
    } catch (e) {
        console.error(e);
        return safeReply(m, `Error: ${e.message}`);
    }
};

handler.command = ['api'];
handler.owner = true;
handler.tags = ['owner'];
handler.help = ['api'];
handler.register = true

export default handler;