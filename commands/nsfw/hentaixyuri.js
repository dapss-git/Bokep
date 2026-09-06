import fs from 'fs';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import { finished } from 'stream/promises';
import sharp from 'sharp';

const TMP_DIR = './tmp';
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://hentaixyuri.com/',
    'Origin': 'https://hentaixyuri.com'
};

const getBuffer = async (url) => {
    try {
        const res = await axios.get(url, {
            headers: HEADERS,
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
            headers: HEADERS,
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

let handler = async (m, { args, conn }) => {
    const subcommand = (args[0] || '').toLowerCase();

    switch (subcommand) {
        case 'search': {
            const keyword = args.slice(1).join(' ');
            if (!keyword) return m.reply('Masukkan judul doujin yang ingin dicari');

            await m.reply('Mencari...');
            try {
                const url = global.API('theresav', '/manga/hentaixyuri/search', { q: keyword }, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.manga?.length)
                    return m.reply('Tidak ditemukan hasil untuk ' + keyword);

                let rows = data.manga.map(v => ({
                    header: '',
                    title: (v.title || 'No title').substring(0, 50),
                    description: `Slug: ${v.slug}`,
                    id: `.hentaiyuri detail ${v.slug}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Hasil pencarian HentaiYuri: *${keyword}*`,
                    footer: `Halaman: ${data.current_page} dari ${data.total_pages}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Doujin' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'List Doujin',
                                sections: [{ title: 'Hasil', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            } catch (e) {
                console.error('HENTAIYURI SEARCH ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mencari');
            }
            break;
        }

        case 'latest':
        case 'home': {
            await m.reply('Mengambil update terbaru dari HentaiYuri...');
            try {
                const url = global.API('theresav', '/manga/hentaixyuri/latest', {}, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.manga?.length)
                    return m.reply('Tidak ada update terbaru');

                let rows = data.manga.map(v => ({
                    header: '',
                    title: (v.title || 'No title').substring(0, 50),
                    description: 'Lihat Detail',
                    id: `.hentaiyuri detail ${v.slug}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `HentaiYuri Update Terbaru 🆕`,
                    footer: `Halaman: ${data.current_page} dari ${data.total_pages}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Doujin' },
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
                console.error('HENTAIYURI LATEST ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil update terbaru');
            }
            break;
        }

        case 'detail': {
            let slug = args[1];
            if (!slug) return m.reply('Slug tidak valid');

            await m.reply('Mengambil detail doujin...');
            try {
                const apiUrl = global.API('theresav', '/manga/hentaixyuri/detail', { slug }, 'apikey');
                const { data } = await axios.get(apiUrl);

                if (!data?.status || !data?.result)
                    return m.reply('Gagal mengambil detail doujin');

                const r = data.result;

                let teks = `*${r.title || '-'}*\n\n`;
                teks += `Rating: ${r.rating || '-'}\n`;
                teks += `Genre: ${(r.genres || []).join(', ') || '-'}\n\n`;
                
                let desc = r.description || 'Tidak ada deskripsi';
                if (desc.length > 800) desc = desc.substring(0, 800) + '...';
                teks += `*Sinopsis:*\n${desc}`;

                const thumbBuffer = await getBuffer(r.thumbnail);

                if (!r.chapters?.length) {
                    return conn.sendMessage(m.chat, {
                        ...(thumbBuffer ? { image: thumbBuffer } : {}),
                        caption: teks + '\n\n(Belum ada chapter)'
                    }, { quoted: m });
                }

                // Pada API ini, list chapter memberikan URL. Kita perlu mengambil "chapter identifier" dari URL tersebut.
                // Format URL: https://hentaixyuri.com/manga/{slug}/{chapter}/
                const rows = r.chapters.map(ch => {
                    const urlParts = ch.url.split('/').filter(Boolean);
                    const chapterId = urlParts[urlParts.length - 1]; // Mengambil bagian terakhir dari URL sebagai ID chapter
                    return {
                        id: `.hentaiyuri download ${slug} ${chapterId}`,
                        title: ch.name || chapterId,
                        description: `Download Chapter`
                    };
                });

                await conn.sendMessage(m.chat, {
                    ...(thumbBuffer ? { image: thumbBuffer } : {}),
                    caption: teks,
                    footer: `Total Chapter: ${r.total_chapters || r.chapters.length}`,
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
                console.error('HENTAIYURI DETAIL ERROR:', e?.response?.data || e.message);
                m.reply('Error saat mengambil detail');
            }
            break;
        }

        case 'download': {
            let slug = args[1];
            let chapterId = args[2];
            
            if (!slug || !chapterId) return m.reply('Format salah. Gunakan: .hentaiyuri download <slug> <chapter_id>');

            await m.reply('Download gambar & membuat dokumen PDF...');
            try {
                const apiUrl = global.API('theresav', '/manga/hentaixyuri/chapter', { slug, chapter: chapterId }, 'apikey');
                const { data } = await axios.get(apiUrl);

                if (!data?.status || !data?.result?.images?.length)
                    return m.reply('Gagal mengambil data gambar chapter.');

                const images = data.result.images;
                const cleanName = `HentaiYuri_${slug}_${chapterId}`.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-');

                const pdfPath = `${TMP_DIR}/${Date.now()}_hentaiyuri.pdf`;
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
                        else console.error('[DL HentaiYuri] Failed:', r.reason?.message);
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
                    caption: `🔞 HentaiYuri Chapter: ${chapterId}\nTotal: ${imgPaths.length} halaman`
                }, { quoted: m });

                fs.unlinkSync(pdfPath);
            } catch (e) {
                console.error('HENTAIYURI DOWNLOAD ERROR:', e?.response?.data || e.message);
                m.reply('Error saat membuat PDF');
            }
            break;
        }

        default:
            m.reply(
                '*HentaiYuri (NSFW)* 🔞\n\n' +
                '.hentaiyuri search <judul>\n' +
                '.hentaiyuri latest\n' +
                '.hentaiyuri detail <slug>\n' +
                '.hentaiyuri download <slug> <chapter_id>'
            );
    }
};

handler.command = /^(hentaiyuri|hentaixyuri)$/i;
handler.help = [
    'hentaiyuri search <judul>',
    'hentaiyuri latest',
    'hentaiyuri detail <slug>',
    'hentaiyuri download <slug> <chapter_id>'
];
handler.tags = ['nsfw'];
handler.limit = true;
handler.register = true;

// Fitur ini adalah NSFW. Sesuaikan dengan kebijakan bot jika perlu menambahkan .premium = true
// handler.premium = true; 

export default handler;