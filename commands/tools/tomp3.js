import {
    spawn
} from 'child_process';
import {
    createWriteStream
} from 'fs';
import {
    unlink
} from 'fs/promises';
import {
    fileTypeFromBuffer
} from 'file-type';
import {
    tmpdir
} from 'os';
import path from 'path';

async function toMp3(buffer) {
    const type = await fileTypeFromBuffer(buffer);
    const ext = type?.ext || "bin";

    const input = path.join(tmpdir(), `${Date.now()}.${ext}`);
    const output = path.join(tmpdir(), `${Date.now()}.mp3`);

    await new Promise((resolve, reject) => {
        const ws = createWriteStream(input);
        ws.write(buffer);
        ws.end();
        ws.on('finish', resolve);
        ws.on('error', reject);
    });

    return new Promise((resolve, reject) => {
        const ff = spawn('ffmpeg', [
            '-y',
            '-i', input,
            '-vn',
            '-acodec', 'libmp3lame',
            '-ac', '2',
            '-b:a', '128k',
            output
        ]);

        ff.stderr.on('data', d => console.log('FFMPEG:', d.toString()));

        ff.on('error', reject);

        ff.on('close', async (code) => {
            if (code !== 0) return reject(new Error('FFmpeg gagal'));

            await unlink(input).catch(() => {});

            resolve({
                file: output,
                del: () => unlink(output).catch(() => {})
            });
        });
    });
}

let handler = async (m, {
    conn
}) => {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';

    if (!mime) return m.reply('❌ Tidak ada media');
    if (!/audio|video/.test(mime)) return m.reply('❌ Kirim/reply audio/video');

    let media = await q.download();
    if (!media || !Buffer.isBuffer(media))
        return m.reply('❌ Gagal download media');

    let res;
    try {
        res = await toMp3(media);
    } catch (e) {
        console.error(e);
        return m.reply('❌ Gagal convert ke MP3');
    }

    await conn.sendMessage(m.chat, {
        audio: {
            url: res.file
        },
        mimetype: 'audio/mpeg',
        ptt: false
    }, {
        quoted: m
    });

    setTimeout(() => res.del(), 3000);
};

handler.help = ['tomp3'];
handler.tags = ['tools'];
handler.command = /^(tomp3|toaudio)$/i;
handler.description = 'Convert video/audio ke MP3';
handler.limit = true;
handler.register = true;

export default handler;