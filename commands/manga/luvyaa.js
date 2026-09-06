import fs from 'fs';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import {
    finished
} from 'stream/promises';
import sharp from 'sharp';

const TMP_DIR = './tmp';
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const luvyaa_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'image/webp,image/apng,image/,/;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://luvyaa.co/',
    'Origin': 'https://luvyaa.co'
};

const getBuffer = async (url) => {
    try {
        const res = await axios.get(url, {
            headers: luvyaa_HEADERS,
            responseType: 'arraybuffer',
            timeout: 20000
        });
        return Buffer.from(res.data);
    } catch {
        return null;
    }
};

const downloadImage = async (url, destPath) => {
    const res = await axios({
        method: 'GET',
        url,
        responseType: 'arraybuffer',
        headers: luvyaa_HEADERS,
        timeout: 20000,
        validateStatus: s => s < 500
    });

    if (res.status !== 200) throw new Error(`Bad image: status ${res.status}`);

    await sharp(Buffer.from(res.data))
        .jpeg({
            quality: 90
        })
        .toFile(destPath);
};

let handler = async (m, {
    args,
    conn
}) => {
    const subcommand = (args[0] || '').toLowerCase();

    switch (subcommand) {

        case 'search': {
            const keyword = args.slice(1).join(' ');
            if (!keyword) return m.reply('Masukkan judul luvyaa');

            await m.reply('Mencari...');

            try {
                const url = global.API('theresav', '/manga/luvyaa/search', {
                    q: keyword
                }, 'apikey');

                const {
                    data
                } = await axios.get(url);

                if (!data?.status || !data?.results?.length)
                    return m.reply('Tidak ditemukan');

                const seen = new Set();
                const unique = data.results.filter(v => {
                    if (!v?.url) return false;
                    if (seen.has(v.url)) return false;
                    seen.add(v.url);
                    return true;
                });

                if (!unique.length) return m.reply('Tidak ditemukan');

                let rows = unique.map(v => ({
                    header: v.views || '',
                    title: v.title || 'No title',
                    description: `${v.type || '-'} | ${v.status || '-'}`,
                    id: `.luvyaa detail ${v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Hasil pencarian ${keyword}`,
                    footer: `Total: ${data.total || unique.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: {
                            displayText: 'Pilih luvyaa'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'List luvyaa',
                                sections: [{
                                    title: 'Hasil',
                                    rows
                                }]
                            })
                        }
                    }],
                    viewOnce: true
                }, {
                    quoted: m
                });

            } catch (e) {
                console.error('SEARCH ERROR:', e?.response?.data || e.message);
                const apiErr = e?.response?.data?.error || e.message || '';
                if (apiErr.includes('403') || apiErr.includes('Gagal mengambil')) {
                    m.reply('⚠️ Situs Luvyaa sedang tidak dapat diakses (dilindungi Cloudflare). Coba lagi nanti.');
                } else {
                    m.reply('Error API: ' + (apiErr || 'Unknown'));
                }
            }
            break;
        }

        case 'detail': {
            let url = args[1];
            if (!url) return m.reply('Link tidak valid');

            url = decodeURIComponent(url);

            await m.reply('Mengambil detail...');

            try {
                const apiUrl = global.API('theresav', '/manga/luvyaa/detail', {
                    url
                }, 'apikey');

                const {
                    data
                } = await axios.get(apiUrl);

                if (!data?.status || !data?.result)
                    return m.reply('Gagal mengambil detail');

                const r = data.result;

                let teks = `${r.title || '-'}\n`;
                teks += `Type: ${r.type || '-'}\n`;
                teks += `Status: ${r.status || '-'}\n`;
                teks += `Rating: ${r.rating || '-'}\n`;
                teks += `Views: ${r.views || '-'}\n`;
                teks += `Genre: ${(r.genres || []).join(', ') || '-'}\n`;
                teks += `Total Chapter: ${r.total_chapters || 0}\n\n`;
                teks += `${r.description || '-'}`;

                const thumbBuffer = await getBuffer(r.thumbnail);

                if (!r.chapters?.length) {
                    return conn.sendMessage(m.chat, {
                        ...(thumbBuffer ? {
                            image: thumbBuffer
                        } : {}),
                        caption: teks + '\n\n(Tidak ada chapter)'
                    }, {
                        quoted: m
                    });
                }

                const rows = r.chapters.map(ch => ({
                    id: `.luvyaa download ${ch.url}`,
                    title: ch.title || 'No title',
                    description: `${ch.date || '-'}`
                }));

                await conn.sendMessage(m.chat, {
                    ...(thumbBuffer ? {
                        image: thumbBuffer
                    } : {}),
                    caption: teks,
                    footer: `Total Chapter: ${r.chapters.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: {
                            displayText: 'Pilih Chapter'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Chapter',
                                sections: [{
                                    title: 'List Chapter',
                                    rows
                                }]
                            })
                        }
                    }]
                }, {
                    quoted: m
                });

            } catch (e) {
                console.error('DETAIL ERROR:', e?.response?.data || e.message);
                const apiErr = e?.response?.data?.error || e.message || '';
                if (apiErr.includes('403') || apiErr.includes('Gagal mengambil')) {
                    m.reply('⚠️ Situs Luvyaa sedang tidak dapat diakses (dilindungi Cloudflare). Coba lagi nanti.');
                } else {
                    m.reply('Error detail: ' + (apiErr || 'Unknown'));
                }
            }
            break;
        }

        case 'download': {
            let url = args[1];
            if (!url || !url.startsWith('http'))
                return m.reply('Link tidak valid');

            url = decodeURIComponent(url);

            await m.reply('Download & membuat PDF...');

            try {
                const apiUrl = global.API('theresav', '/manga/luvyaa/chapter', {
                    url
                }, 'apikey');

                const {
                    data
                } = await axios.get(apiUrl);

                if (!data?.status || !data?.result?.images)
                    return m.reply('Gagal ambil data');

                const r = data.result;
                const images = r.images.map(v => v.url);

                const cleanName = (r.title || 'luvyaa')
                    .replace(/[^\w\s]/gi, '')
                    .replace(/\s+/g, '-');

                const pdfPath = `${TMP_DIR}/${Date.now()}.pdf`;
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
                        else console.error('[DL] Failed:', r.reason?.message);
                    });
                }

                if (!imgPaths.length) return m.reply('Semua gambar gagal');

                const doc = new PDFDocument({
                    autoFirstPage: false,
                    margin: 0
                });

                const stream = fs.createWriteStream(pdfPath);
                doc.pipe(stream);

                for (const img of imgPaths) {
                    try {
                        const meta = await sharp(img).metadata();

                        doc.addPage({
                            size: [meta.width, meta.height],
                            margin: 0
                        });

                        doc.image(img, 0, 0, {
                            width: meta.width,
                            height: meta.height
                        });
                    } catch (e) {
                        console.error('[PDF] Skip image:', e.message);
                    }

                    try {
                        fs.unlinkSync(img);
                    } catch {}
                }

                doc.end();
                await finished(stream);

                await conn.sendMessage(m.chat, {
                    document: fs.readFileSync(pdfPath),
                    mimetype: 'application/pdf',
                    fileName: cleanName + '.pdf',
                    caption: `📖 ${r.title}\nTotal: ${r.total_pages || imgPaths.length} halaman`
                }, {
                    quoted: m
                });

                fs.unlinkSync(pdfPath);

            } catch (e) {
                console.error('DOWNLOAD ERROR:', e?.response?.data || e.message);
                const apiErr = e?.response?.data?.error || e.message || '';
                if (apiErr.includes('403') || apiErr.includes('Gagal mengambil')) {
                    m.reply('⚠️ Situs Luvyaa sedang tidak dapat diakses (dilindungi Cloudflare). Coba lagi nanti.');
                } else {
                    m.reply('Error download: ' + (apiErr || 'Unknown'));
                }
            }
            break;
        }

        case 'home':
        case 'latest': {
            await m.reply('Mengambil update terbaru dari Luvyaa...');

            try {
                const url = global.API('theresav', '/manga/luvyaa/home', {}, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.result?.length)
                    return m.reply('Tidak ada update terbaru');

                let rows = data.result.map(v => ({
                    header: '',
                    title: v.title || 'No title',
                    description: 'Lihat Detail',
                    id: `.luvyaa detail ${v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Update Terbaru Luvyaa 🆕`,
                    footer: `Total: ${data.total || data.result.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Manga' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Update Terbaru',
                                sections: [{ title: 'Manga Terbaru', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });

            } catch (e) {
                console.error('HOME ERROR:', e?.response?.data || e.message);
                const apiErr = e?.response?.data?.error || e.message || '';
                if (apiErr.includes('403') || apiErr.includes('Gagal mengambil')) {
                    m.reply('⚠️ Situs Luvyaa sedang tidak dapat diakses (dilindungi Cloudflare). Coba lagi nanti.');
                } else {
                    m.reply('Error API: ' + (apiErr || 'Unknown'));
                }
            }
            break;
        }

        case 'genre': {
            const genre = args[1] ? args[1].toLowerCase() : '';

            if (!genre) {
                // Tampilkan list genre jika tidak ada genre yang dipilih
                const genresList = [
                    'action', 'adventure', 'comedy', 'drama', 'fantasy', 'horror', 'mystery', 
                    'psychological', 'romance', 'sci-fi', 'slice-of-life', 'sports', 'supernatural', 
                    'thriller', 'manga', 'manhwa', 'manhua', 'adaptation', 'adult', 'bdsm', 'demon', 
                    'gender-bender', 'josei', 'joseiw', 'magic', 'mature', 'reverse-harem', 'rofan', 
                    'smut', 'tragedy'
                ];

                let rows = genresList.map(g => ({
                    header: '',
                    title: g.charAt(0).toUpperCase() + g.slice(1),
                    description: `Lihat manga bergenre ${g}`,
                    id: `.luvyaa genre ${g}`
                }));

                return await conn.sendMessage(m.chat, {
                    text: `Pilih Genre Manga Luvyaa:`,
                    footer: `Total: ${genresList.length} Genre`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Daftar Genre' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'List Genre',
                                sections: [{ title: 'Genre Tersedia', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });
            }

            // Jika genre dipilih, ambil daftar manganya
            await m.reply(`Mencari manga dengan genre *${genre}*...`);

            try {
                const url = global.API('theresav', '/manga/luvyaa/genres', { genre }, 'apikey');
                const { data } = await axios.get(url);

                if (!data?.status || !data?.result?.length)
                    return m.reply(`Tidak ditemukan manga untuk genre ${genre}`);

                let rows = data.result.map(v => ({
                    header: '',
                    title: v.title || 'No title',
                    description: 'Lihat Detail',
                    id: `.luvyaa detail ${v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Hasil pencarian genre: *${genre}*`,
                    footer: `Total: ${data.total || data.result.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: { displayText: 'Pilih Manga' },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: `Manga ${genre}`,
                                sections: [{ title: 'Hasil', rows }]
                            })
                        }
                    }],
                    viewOnce: true
                }, { quoted: m });

            } catch (e) {
                console.error('GENRE ERROR:', e?.response?.data || e.message);
                const apiErr = e?.response?.data?.error || e.message || '';
                if (apiErr.includes('403') || apiErr.includes('Gagal mengambil')) {
                    m.reply('⚠️ Situs Luvyaa sedang tidak dapat diakses (dilindungi Cloudflare). Coba lagi nanti.');
                } else {
                    m.reply('Error API saat mencari genre: ' + (apiErr || 'Unknown'));
                }
            }
            break;
        }

        default:
            m.reply(
                '.luvyaa search <judul>\n' +
                '.luvyaa latest\n' +
                '.luvyaa genre [nama_genre]\n' +
                '.luvyaa detail <url>\n' +
                '.luvyaa download <url>'
            );
    }
};

handler.command = /^(luvyaa)$/i;
handler.help = [
    'luvyaa search <judul>',
    'luvyaa latest',
    'luvyaa genre [nama_genre]',
    'luvyaa detail <url>',
    'luvyaa download <url>'
];
handler.tags = ['manga'];
handler.limit = true;
handler.register = true;

export default handler;