import fs from 'fs';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import {
    finished
} from 'stream/promises';
import sharp from 'sharp';

const TMP_DIR = './tmp';
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const GENRES = [
    'uncensored', 'action', 'adventure', 'bl', 'comedy', 'drama', 'ecchi', 'gl',
    'fantasy', 'harem', 'historical', 'horror', 'martial-arts', 'mature', 'mystery',
    'psychological', 'romance', 'school-life', 'sci-fi', 'slice-of-life', 'smut',
    'supernatural', 'thriller'
];

const ORDER_OPTS = ['latest', 'alphabet', 'rating', 'trending', 'views', 'new-manga'];

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/*;q=0.8',
    'Referer': 'https://www.toongod.org/',
    'Accept-Language': 'en-US,en;q=0.9'
};

const fixUrl = (url) => url?.replace(/^https?:\s+/, '') || '';

const apiGet = async (path, params = {}) => {
    const url = global.API('theresav', `/manga/toongod/${path}`, params, 'apikey');
    const {
        data
    } = await axios.get(url);
    return data;
};

const downloadImage = async (url, path) => {
    const res = await axios.get(fixUrl(url), {
        responseType: 'arraybuffer',
        headers: HEADERS
    });
    await sharp(Buffer.from(res.data)).jpeg({
        quality: 90
    }).toFile(path);
};

const getBuffer = async (url) => {
    try {
        const res = await axios.get(fixUrl(url), {
            responseType: 'arraybuffer',
            headers: HEADERS
        });
        return Buffer.from(res.data);
    } catch {
        return null;
    }
};

const sendList = async (conn, m, text, footer, title, sectionTitle, rows) => {
    await conn.sendMessage(m.chat, {
        text,
        footer,
        buttons: [{
            buttonId: 'action',
            buttonText: {
                displayText: 'Pilih'
            },
            type: 4,
            nativeFlowInfo: {
                name: 'single_select',
                paramsJson: JSON.stringify({
                    title,
                    sections: [{
                        title: sectionTitle,
                        rows
                    }]
                })
            }
        }]
    }, {
        quoted: m
    });
};

let handler = async (m, {
    args,
    conn
}) => {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'search') {
        const q = args.slice(1).join(' ');
        if (!q) return m.reply('Masukkan judul manga');
        m.reply('🔍 Mencari...');
        const data = await apiGet('search', {
            q
        });
        if (!data.status || !data.result?.length) return m.reply('Tidak ditemukan');
        const rows = data.result.map(v => ({
            title: v.title,
            description: `${v.type || 'Manga'} | ${v.status} | ⭐ ${v.rating}`,
            id: `.toongod detail ${encodeURIComponent(v.url)}`
        }));
        return sendList(conn, m, `🔎 Hasil pencarian: *${q}*`, `Total: ${data.total}`, 'Hasil Pencarian', 'Manga', rows);
    }

    if (sub === 'detail') {
        const url = args[1] ? decodeURIComponent(args[1]) : null;
        if (!url) return m.reply('URL tidak valid');
        m.reply('📖 Mengambil detail...');
        const data = await apiGet('detail', {
            url
        });
        if (!data.status) return m.reply('Gagal mengambil detail');
        const r = data.result;
        const d = r.details;
        let teks = `📚 *${r.title}*\n`;
        if (r.alternative) teks += `Alternatif: ${r.alternative}\n`;
        teks += `Type: ${d['type']}\n`;
        teks += `Status: ${d['status']}\n`;
        teks += `Chapters: ${d['chapters']}\n`;
        teks += `Release: ${d['release']}\n`;
        teks += `Author: ${d['author(s)']}\n`;
        teks += `Artist: ${d['artist(s)']}\n`;
        teks += `Genre: ${r.genres.join(', ')}\n`;
        teks += `Rating: ${d['rating']?.match(/[\d.]+\s*\/\s*5/)?.[0] || '-'}\n\n`;
        teks += `${r.summary}`;
        const thumb = r.thumbnail ? await getBuffer(r.thumbnail) : null;
        const rows = r.chapters.map(ch => ({
            title: ch.title,
            description: ch.releaseDate,
            id: `.toongod download ${encodeURIComponent(ch.url)}`
        }));
        await conn.sendMessage(m.chat, {
            ...(thumb ? {
                image: thumb
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
                        title: 'List Chapter',
                        sections: [{
                            title: 'Chapters',
                            rows
                        }]
                    })
                }
            }]
        }, {
            quoted: m
        });
        return;
    }

    if (sub === 'download') {
        const url = args[1] ? decodeURIComponent(args[1]) : null;
        if (!url) return m.reply('URL tidak valid');
        m.reply('⏳ Membuat PDF, harap tunggu...');
        const data = await apiGet('download', {
            url
        });
        if (!data.status || !data.result?.images?.length) return m.reply('Gagal mengambil halaman');
        const images = data.result.images.map(fixUrl);
        const ts = Date.now();
        const pdfPath = `${TMP_DIR}/${ts}.pdf`;
        const imgPaths = [];
        for (let i = 0; i < images.length; i++) {
            const p = `${TMP_DIR}/${ts}-${i}.jpg`;
            await downloadImage(images[i], p);
            imgPaths.push(p);
        }
        const doc = new PDFDocument({
            autoFirstPage: false,
            margin: 0
        });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);
        for (const img of imgPaths) {
            const meta = await sharp(img).metadata();
            doc.addPage({
                size: [meta.width, meta.height],
                margin: 0
            });
            doc.image(img, 0, 0, {
                width: meta.width,
                height: meta.height
            });
            fs.unlinkSync(img);
        }
        doc.end();
        await finished(stream);
        const title = data.result.title || 'toongod';
        const fileName = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40) + '.pdf';
        await conn.sendMessage(m.chat, {
            document: fs.readFileSync(pdfPath),
            mimetype: 'application/pdf',
            fileName
        }, {
            quoted: m
        });
        fs.unlinkSync(pdfPath);
        return;
    }

    if (sub === 'home') {
        m.reply('🏠 Mengambil daftar home...');
        const data = await apiGet('home');
        if (!data.status || !data.result?.length) return m.reply('Gagal');
        const rows = data.result.filter(v => v.title && v.url).map(v => ({
            title: v.title,
            description: v.latestChapter || '-',
            id: `.toongod detail ${encodeURIComponent(v.url)}`
        }));
        return sendList(conn, m, '🏠 *ToonGod Home*', `Total: ${data.total}`, 'Home', 'Manga', rows);
    }

    if (sub === 'genre') {
        const genre = (args[1] || '').toLowerCase();
        if (!genre) {
            const rows = GENRES.map(g => ({
                title: g.charAt(0).toUpperCase() + g.slice(1),
                description: `Genre ${g}`,
                id: `.toongod genre ${g}`
            }));
            return sendList(conn, m, '📂 *Pilih Genre*', `${GENRES.length} genre tersedia`, 'Genre List', 'Genre', rows);
        }
        if (!GENRES.includes(genre)) return m.reply(`Genre tidak valid.\nGenre: ${GENRES.join(', ')}`);
        m.reply(`📂 Mengambil genre *${genre}*...`);
        const data = await apiGet('genre', {
            genre
        });
        if (!data.status || !data.result?.length) return m.reply('Tidak ada hasil');
        const rows = data.result.map(v => ({
            title: v.title,
            description: v.latestChapter || '-',
            id: `.toongod detail ${encodeURIComponent(v.url)}`
        }));
        return sendList(conn, m, `📂 Genre: *${genre}*`, `Total: ${data.total}`, 'Hasil Genre', 'Manga', rows);
    }

    if (sub === 'list') {
        const orderby = (args[1] || 'latest').toLowerCase();
        if (!ORDER_OPTS.includes(orderby)) {
            const rows = ORDER_OPTS.map(o => ({
                title: o.charAt(0).toUpperCase() + o.slice(1),
                description: `Urut berdasarkan ${o}`,
                id: `.toongod list ${o}`
            }));
            return sendList(conn, m, '📋 *Pilih Urutan*', '', 'Order By', 'Urutan', rows);
        }
        m.reply(`📋 Mengambil list *${orderby}*...`);
        const data = await apiGet('webtoons', {
            orderby
        });
        if (!data.status || !data.result?.length) return m.reply('Tidak ada hasil');
        const rows = data.result.map(v => ({
            title: v.title,
            description: v.latestChapter || '-',
            id: `.toongod detail ${encodeURIComponent(v.url)}`
        }));
        return sendList(conn, m, `📋 List Manga (${orderby})`, `Total: ${data.total}`, 'Daftar Manga', 'Manga', rows);
    }

    m.reply(
        '📚 *ToonGod Manga*\n\n' +
        '.toongod search <judul>\n' +
        '.toongod detail <url>\n' +
        '.toongod download <chapter_url>\n' +
        '.toongod home\n' +
        '.toongod genre [nama_genre]\n' +
        '.toongod list [latest|alphabet|rating|trending|views|new-manga]'
    );
};

handler.command = /^(toongod)$/i;
handler.help = [
    'toongod search <judul>',
    'toongod detail <url>',
    'toongod download <chapter_url>',
    'toongod home',
    'toongod genre [genre]',
    'toongod list [orderby]'
];
handler.tags = ['manga'];
handler.limit = true;

handler.register = true

export default handler;