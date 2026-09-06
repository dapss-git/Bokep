import fs from 'fs';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import { finished } from 'stream/promises';
import sharp from 'sharp';

const TMP_DIR = './tmp';
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const getBuffer = async (url) => {
    try {
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 20000
        });
        return Buffer.from(res.data);
    } catch {
        return null;
    }
};

const downloadImage = async (url, destPath) => {
    try {
        const res = await axios({
            method: 'GET',
            url,
            responseType: 'arraybuffer',
            timeout: 30000,
            validateStatus: s => s < 400
        });

        await sharp(Buffer.from(res.data))
            .jpeg({ quality: 85, progressive: true })
            .toFile(destPath);
    } catch (e) {
        throw e;
    }
};

let handler = async (m, { args, conn, usedPrefix, command }) => {
    const subcommand = (args[0] || '').toLowerCase();

    switch (subcommand) {
        case 'search': {
            const keyword = args.slice(1).join(' ');
            if (!keyword) return m.reply(`Masukkan judul manga yang ingin dicari\nContoh: ${usedPrefix + command} search naruto`);

            await m.reply('Mencari...');
            try {
                const url = global.API('theresav', '/manga/mangadex/search', { q: keyword }, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.data?.length)
                    return m.reply('Tidak ditemukan hasil untuk ' + keyword);

                let rows = data.data.map(v => ({
                    header: v.status || 'Manga',
                    title: v.title || 'No title',
                    description: `Year: ${v.year || '-'} | ID: ${v.id}`,
                    id: `${usedPrefix + command} detail ${v.id}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Hasil pencarian MangaDex: *${keyword}*`,
                    footer: `Total: ${data.total || data.data.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Manga' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'List Manga',
                                sections: [{ title: 'Hasil', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('MANGADEX SEARCH ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mencari');
            }
            break;
        }

        case 'latest': {
            await m.reply('Mengambil update terbaru...');
            try {
                const url = global.API('theresav', '/manga/mangadex/list', {}, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.data?.length)
                    return m.reply('Tidak ada update terbaru');

                let rows = data.data.slice(0, 50).map(v => ({
                    header: v.status || '',
                    title: v.title || 'No title',
                    description: `ID: ${v.id}`,
                    id: `${usedPrefix + command} detail ${v.id}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `MangaDex Update Terbaru 🆕`,
                    footer: `Sumber: MangaDex`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Manga' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Update Terbaru',
                                sections: [{ title: 'List Update', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('MANGADEX LATEST ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil update terbaru');
            }
            break;
        }

        case 'detail': {
            let id = args[1];
            if (!id) return m.reply('ID manga tidak valid');

            await m.reply('Mengambil detail manga...');
            try {
                const apiUrl = global.API('theresav', '/manga/mangadex/detail', { id }, 'apikey');
                const { data } = await axios.get(apiUrl);

                if (!data?.status || !data?.data)
                    return m.reply('Gagal mengambil detail komik');

                const r = data.data;

                let teks = `*${r.title || '-'}*\n\n`;
                teks += `Status: ${r.status || '-'}\n`;
                teks += `Year: ${r.year || '-'}\n`;
                teks += `Rating: ${r.contentRating || '-'}\n`;
                teks += `Author: ${r.authors?.map(a => a.name).join(', ') || '-'}\n\n`;
                teks += `*Sinopsis:*\n${r.description || 'Tidak ada sinopsis'}`;

                if (teks.length > 1000) {
                    teks = teks.substring(0, 1000) + '...';
                }

                const thumbBuffer = await getBuffer(r.coverImage);

                if (!data.chapters?.length) {
                    return conn.sendMessage(m.chat, {
                        ...(thumbBuffer ? { image: thumbBuffer } : {}),
                        caption: teks + '\n\n(Belum ada chapter)'
                    }, { quoted: m });
                }

                const rows = data.chapters.slice(0, 100).map(ch => ({
                    id: `${usedPrefix + command} read ${ch.id}`,
                    title: `Chapter ${ch.chapter || ''} ${ch.title ? '- ' + ch.title : ''}`,
                    description: `Lang: ${ch.translatedLanguage || '-'} | Pages: ${ch.pages || '-'}`
                }));

                await conn.sendMessage(m.chat, {
                    ...(thumbBuffer ? { image: thumbBuffer } : {}),
                    caption: teks,
                    footer: `Total Chapter: ${data.totalChapters}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Chapter' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Daftar Chapter',
                                sections: [{ title: 'Chapter', rows }]
                            })
                        }
                    }]
                }, { quoted: m });
            } catch (e) {
                console.error('MANGADEX DETAIL ERROR:', e?.response?.data || e.message);
                m.reply('Error saat mengambil detail');
            }
            break;
        }

        case 'read': {
            let chapterId = args[1];
            if (!chapterId) return m.reply('Chapter ID tidak valid');

            await m.reply('Download gambar & membuat dokumen PDF...');
            try {
                const apiUrl = global.API('theresav', '/manga/mangadex/read', { chapterId }, 'apikey');
                const { data } = await axios.get(apiUrl);

                if (!data?.status || !data?.chapter?.images?.length)
                    return m.reply('Gagal mengambil data gambar chapter atau chapter kosong');

                const images = data.chapter.images;
                const cleanName = `MangaDex_${chapterId}`.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-');

                const pdfPath = `${TMP_DIR}/${Date.now()}_mangadex.pdf`;
                const imgPaths = [];
                const limit = 5;

                for (let i = 0; i < images.length; i += limit) {
                    const batch = images.slice(i, i + limit);
                    const results = await Promise.allSettled(
                        batch.map((img, idx) => {
                            const path = `${TMP_DIR}/${Date.now()}-${i + idx}.jpg`;
                            return downloadImage(img, path).then(() => path);
                        })
                    );
                    results.forEach(r => {
                        if (r.status === 'fulfilled') imgPaths.push(r.value);
                        else console.error('[DL MangaDex] Failed:', r.reason?.message);
                    });
                }

                if (!imgPaths.length) return m.reply('Semua gambar gagal didownload');

                const doc = new PDFDocument({ autoFirstPage: false, margin: 0 });
                const stream = fs.createWriteStream(pdfPath);
                doc.pipe(stream);

                for (const img of imgPaths) {
                    try {
                        const meta = await sharp(img).metadata();
                        doc.addPage({ size: [meta.width, meta.height], margin: 0 });
                        doc.image(img, 0, 0, { width: meta.width, height: meta.height });
                    } catch (e) {
                        console.error('[PDF] Skip image:', e.message);
                    }
                    try { fs.unlinkSync(img); } catch {}
                }

                doc.end();
                await finished(stream);

                await conn.sendMessage(m.chat, {
                    document: fs.readFileSync(pdfPath),
                    mimetype: 'application/pdf',
                    fileName: cleanName + '.pdf',
                    caption: `📖 *MangaDex Reader*\nChapter ID: ${chapterId}\nTotal: ${imgPaths.length} halaman`
                }, { quoted: m });

                fs.unlinkSync(pdfPath);
            } catch (e) {
                console.error('MANGADEX READ ERROR:', e?.response?.data || e.message);
                m.reply('Error saat membuat PDF');
            }
            break;
        }

        case 'random': {
            await m.reply('Mengambil manga random...');
            try {
                const url = global.API('theresav', '/manga/mangadex/random', {}, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.data)
                    return m.reply('Gagal mengambil manga random');

                // Redirect to detail
                args[0] = 'detail';
                args[1] = data.data.id;
                return handler(m, { args, conn, usedPrefix, command });
            } catch (e) {
                console.error('MANGADEX RANDOM ERROR:', e?.response?.data || e.message);
                m.reply('Error saat mengambil manga random');
            }
            break;
        }

        default:
            m.reply(
                '*MangaDex Downloader*\n\n' +
                `.${command} search <judul>\n` +
                `.${command} latest\n` +
                `.${command} random\n` +
                `.${command} detail <id>\n` +
                `.${command} read <chapterId>`
            );
    }
};

handler.command = /^(mangadex|mdex)$/i;
handler.help = [
    'mangadex search <judul>',
    'mangadex latest',
    'mangadex random',
    'mangadex detail <id>',
    'mangadex read <chapterId>'
];
handler.tags = ['manga'];
handler.limit = true;
handler.register = true;

export default handler;
