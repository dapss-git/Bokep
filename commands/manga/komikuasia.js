import fs from 'fs';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import { finished } from 'stream/promises';
import sharp from 'sharp';

const TMP_DIR = './tmp';
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const getBuffer = async (url) => {
    if (!url) return null;
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
        return Buffer.from(res.data);
    } catch {
        return null;
    }
};

const downloadImage = async (url, destPath) => {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000, validateStatus: s => s < 400 });
        await sharp(Buffer.from(res.data)).jpeg({ quality: 85, progressive: true }).toFile(destPath);
    } catch (e) {
        throw e;
    }
};

const getParamValue = (rawVal) => {
    if (!rawVal) return null;
    rawVal = decodeURIComponent(rawVal);
    if ('url' === 'slug' && rawVal.startsWith('http')) {
        return rawVal.split('/').filter(Boolean).pop();
    }
    return rawVal;
};

let handler = async (m, { args, conn }) => {
    const subcommand = (args[0] || '').toLowerCase();

    switch (subcommand) {
        case 'search': {
            const keyword = args.slice(1).join(' ');
            if (!keyword) return m.reply('Masukkan judul manga yang ingin dicari');
            await m.reply('Mencari...');
            try {
                const url = global.API('theresav', '/manga/komikuasia/search', { q: keyword }, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.data || data?.result || data?.results;

                if (!data?.status || !results?.length) return m.reply('Tidak ditemukan hasil untuk ' + keyword);

                let rows = results.slice(0, 50).map(v => ({
                    header: v.type || v.status || '',
                    title: (v.title || 'No title').substring(0, 50),
                    description: 'Lihat Detail',
                    id: `.komikuasia detail ${v.id || v.url || v.slug}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Hasil pencarian komikuasia: *${keyword}*`,
                    footer: `Total: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Manga' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'List Manga', sections: [{ title: 'Hasil', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('KOMIKUASIA SEARCH ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mencari');
            }
            break;
        }

        case 'latest':
        case 'home': {
            await m.reply('Mengambil update terbaru dari komikuasia...');
            try {
                const url = global.API('theresav', '/manga/komikuasia/latest', {}, 'apikey');
                const { data } = await axios.get(url);
                const results = data?.data || data?.result || data?.results;

                if (!data?.status || !results?.length) return m.reply('Tidak ada update terbaru');

                let rows = results.slice(0, 50).map(v => ({
                    header: '',
                    title: (v.title || 'No title').substring(0, 50),
                    description: v.latestChapter || v.chapter || 'Lihat Detail',
                    id: `.komikuasia detail ${v.id || v.url || v.slug}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Update Terbaru komikuasia 🆕`,
                    footer: `Total Update: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Manga' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'Update Terbaru', sections: [{ title: 'List Update', rows }] })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('KOMIKUASIA HOME ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil update terbaru');
            }
            break;
        }

        case 'detail': {
            const val = getParamValue(args[1]);
            if (!val) return m.reply('Parameter tidak valid');

            await m.reply('Mengambil detail manga...');
            try {
                const params = {};
                params['url'] = val;
                const apiUrl = global.API('theresav', '/manga/komikuasia/detail', params, 'apikey');
                const { data } = await axios.get(apiUrl);
                const r = data?.data || data?.result;

                if (!data?.status || !r) return m.reply('Gagal mengambil detail');

                let teks = `*${r.title || '-'}*\n\n`;
                if (r.status) teks += `Status: ${r.status}\n`;
                if (r.rating) teks += `Rating: ${r.rating}\n`;
                
                let desc = r.synopsis || r.description || r.summary || 'Tidak ada deskripsi';
                if (desc.length > 800) desc = desc.substring(0, 800) + '...';
                teks += `\n*Sinopsis:*\n${desc}`;

                const thumbUrl = r.thumbnail || r.thumb || r.cover || r.coverImage;
                const thumbBuffer = thumbUrl ? await getBuffer(thumbUrl) : null;
                const chapters = r.chapters || r.episodes || r.list;

                if (!chapters?.length) {
                    return conn.sendMessage(m.chat, { ...(thumbBuffer ? { image: thumbBuffer } : {}), caption: teks + '\n\n(Belum ada chapter)' }, { quoted: m });
                }

                const rows = chapters.map((ch, idx) => ({
                    id: `.komikuasia download ${ch.url || ch.link || ch.id || ch.slug || ch.chapterId}`,
                    title: ch.name || ch.title || `Chapter ${chapters.length - idx}`,
                    description: ch.date || ch.releaseDate || 'Baca Chapter'
                }));

                await conn.sendMessage(m.chat, {
                    ...(thumbBuffer ? { image: thumbBuffer } : {}),
                    caption: teks,
                    footer: `Total Chapter: ${chapters.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Chapter' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({ title: 'Daftar Chapter', sections: [{ title: 'Chapter', rows }] })
                        }
                    }]
                }, { quoted: m });
            } catch (e) {
                console.error('KOMIKUASIA DETAIL ERROR:', e?.response?.data || e.message);
                m.reply('Error saat mengambil detail');
            }
            break;
        }

        case 'download': {
            const val = args[1] ? decodeURIComponent(args[1]) : null;
            if (!val) return m.reply('Parameter tidak valid');

            await m.reply('Download gambar & membuat dokumen PDF...');
            try {
                const params = {};
                let paramKey = 'url';
                if ('komikuasia' === 'manta' || 'komikuasia' === 'mangadex') paramKey = 'id';
                else if ('url' === 'slug' && !val.startsWith('http')) paramKey = 'slug';
                
                params[paramKey] = val;

                const apiUrl = global.API('theresav', '/manga/komikuasia/download', params, 'apikey');
                const { data } = await axios.get(apiUrl);

                const images = data?.images || data?.result?.images || data?.data?.images || data?.chapter?.images || data?.result?.pages?.map(p => p.url) || data?.data?.pages?.map(p => p.url) || data?.data;

                if (!data?.status || !images?.length) return m.reply('Gagal mengambil data gambar chapter.');

                const cleanName = `komikuasia_chapter`.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-');
                const pdfPath = `${TMP_DIR}/${Date.now()}_komikuasia.pdf`;
                const imgPaths = [];
                const limit = 5;

                for (let i = 0; i < images.length; i += limit) {
                    const batch = images.slice(i, i + limit);
                    const results = await Promise.allSettled(
                        batch.map((img, idx) => {
                            const path = `${TMP_DIR}/${Date.now()}-${i + idx}.jpg`;
                            let imgUrl = typeof img === 'string' ? img : (img.url || img.src || img.link);
                            return downloadImage(imgUrl, path).then(() => path);
                        })
                    );
                    results.forEach(r => {
                        if (r.status === 'fulfilled') imgPaths.push(r.value);
                        else console.error(`[DL komikuasia] Failed:`, r.reason?.message);
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
                    caption: `📖 KOMIKUASIA\nTotal: ${imgPaths.length} halaman`
                }, { quoted: m });

                fs.unlinkSync(pdfPath);
            } catch (e) {
                console.error('KOMIKUASIA DOWNLOAD ERROR:', e?.response?.data || e.message);
                m.reply('Error saat membuat PDF');
            }
            break;
        }

        default:
            m.reply(
                `*KOMIKUASIA*\n\n` +
                `.komikuasia search <judul>\n` +
                `.komikuasia latest\n` +
                `.komikuasia detail <url/id>\n` +
                `.komikuasia download <url/id>`
            );
    }
};

handler.command = /^(komikuasia)$/i;
handler.help = [
    'komikuasia search <judul>',
    'komikuasia latest',
    'komikuasia detail <url>',
    'komikuasia download <url>'
].filter(Boolean);
handler.tags = ['manga'];
handler.limit = true;
handler.register = true;

export default handler;
