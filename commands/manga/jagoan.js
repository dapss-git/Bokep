import fs from 'fs';
import PDFDocument from 'pdfkit';
import {
    finished
} from 'stream/promises';
import sharp from 'sharp';

const TMP_DIR = './tmp';
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    const subcommand = (args[0] || '').toLowerCase();

    switch (subcommand) {
        case 'search': {
            const keyword = args.slice(1).join(' ');
            if (!keyword) return m.reply('Masukkan judul manga\nContoh: .jagoan search circles');

            await m.reply("⏳ Mencari...");

            try {
                const url = global.API('theresav', '/manga/jagoanmanga/search', {
                    q: keyword
                }, 'apikey');
                const res = await fetch(url);
                const data = await res.json();

                if (!data.status || !data.result.length) return m.reply('Tidak ditemukan.');

                let rows = data.result.slice(0, 20).map(manga => ({
                    header: manga.chapter || 'Latest Chapter',
                    title: manga.title,
                    description: manga.link,
                    id: `.jagoan detail ${encodeURIComponent(manga.link)}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Hasil pencarian untuk *${keyword}*`,
                    footer: `Total: ${data.result.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: {
                            displayText: 'Pilih Manga'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Hasil Pencarian',
                                sections: [{
                                    title: 'Daftar Manga',
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
                console.error(e);
                m.reply('Gagal mengambil data dari API 😢');
            }
            break;
        }

        case 'detail': {
            let url = args[1];
            if (!url) return m.reply('Link komik tidak valid!');
            url = decodeURIComponent(url);

            await m.reply("⏳ Mengambil detail dan daftar chapter...");

            try {
                const apiUrl = global.API('theresav', '/manga/jagoanmanga/detail', {
                    url: url
                }, 'apikey');
                const res = await fetch(apiUrl);
                const data = await res.json();

                if (!data.status) return m.reply('Gagal mendapatkan detail komik.');

                const result = data.result;

                let teks = `*${result.title}*\n\n`;
                teks += `*Sinopsis:*\n${result.synopsis}\n\n`;
                teks += `*Total Chapter:* ${result.totalChapter}\n`;

                let chapterRows = result.chapters.map(ch => ({
                    id: `.jagoan download ${encodeURIComponent(ch.url)}`,
                    title: ch.chapter,
                    description: ch.title
                }));

                await conn.sendMessage(m.chat, {
                    image: {
                        url: result.cover
                    },
                    caption: teks,
                    footer: `Menampilkan ${result.chapters.length} chapter`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: {
                            displayText: 'Pilih Chapter'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Daftar Chapter',
                                sections: [{
                                    title: 'Chapter Tersedia',
                                    rows: chapterRows
                                }]
                            })
                        }
                    }]
                }, {
                    quoted: m
                });

            } catch (e) {
                console.error(e);
                m.reply('Terjadi kesalahan saat mengambil detail.');
            }
            break;
        }

        case 'download': {
            let url = args[1];
            if (!url) return m.reply('Link tidak valid!');
            url = decodeURIComponent(url);

            if (!url.startsWith('http'))
                return m.reply('Link tidak valid!\nContoh:\n.jagoan download https://jagoanmanga.com/xxxx.html');

            const isAll = args[2] === 'all';

            try {
                let chaptersToDownload = [];
                let mangaTitle = '';

                if (isAll) {
                    await m.reply("⏳ Mengambil daftar semua chapter...");
                    const detailApi = global.API('theresav', '/manga/jagoanmanga/detail', {
                        url
                    }, 'apikey');
                    const detailRes = await fetch(detailApi);
                    const detailData = await detailRes.json();

                    if (!detailData.status || !detailData.result.chapters.length)
                        return m.reply('Gagal mengambil daftar chapter!');

                    mangaTitle = detailData.result.title;
                    chaptersToDownload = detailData.result.chapters.reverse(); // Download from oldest to newest
                } else {
                    chaptersToDownload = [{
                        url
                    }];
                }

                await m.reply(`⏳ Sedang memproses ${chaptersToDownload.length} chapter... Mohon tunggu, ini mungkin memakan waktu lama.`);

                const pdfPath = `${TMP_DIR}/${Date.now()}.pdf`;
                const doc = new PDFDocument({
                    autoFirstPage: false,
                    margin: 0
                });
                const stream = fs.createWriteStream(pdfPath);
                doc.pipe(stream);

                let totalDownloadedPages = 0;
                let successChapters = 0;
                let failedChapters = 0;

                for (let i = 0; i < chaptersToDownload.length; i++) {
                    const chapter = chaptersToDownload[i];
                    try {
                        if (isAll && i > 0 && i % 10 === 0) {
                            await m.reply(`⏳ Progress: ${i}/${chaptersToDownload.length} chapter terproses...`);
                        }

                        const apiUrl = global.API('theresav', '/manga/jagoanmanga/download', {
                            url: chapter.url
                        }, 'apikey');
                        const res = await fetch(apiUrl);
                        const data = await res.json();

                        if (!data.status || !data.result?.images?.length) {
                            failedChapters++;
                            continue;
                        }

                        const result = data.result;
                        if (!mangaTitle) mangaTitle = result.manga;
                        const images = result.images;

                        const batchSize = 10;
                        for (let j = 0; j < images.length; j += batchSize) {
                            const batch = images.slice(j, j + batchSize);
                            const imgBuffers = await Promise.all(batch.map(async (imgUrl) => {
                                try {
                                    const response = await fetch(imgUrl);
                                    if (!response.ok) return null;
                                    return Buffer.from(await response.arrayBuffer());
                                } catch {
                                    return null;
                                }
                            }));

                            for (const buffer of imgBuffers) {
                                if (!buffer) continue;
                                try {
                                    const metadata = await sharp(buffer).metadata();
                                    doc.addPage({
                                        size: [metadata.width, metadata.height],
                                        margin: 0
                                    });
                                    doc.image(buffer, 0, 0, {
                                        width: metadata.width,
                                        height: metadata.height
                                    });
                                    totalDownloadedPages++;
                                } catch {}
                            }
                        }
                        successChapters++;
                    } catch (err) {
                        failedChapters++;
                    }
                }

                if (totalDownloadedPages === 0) {
                    doc.end();
                    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
                    return m.reply('Gagal mengunduh gambar apa pun. Kemungkinan API sedang bermasalah.');
                }

                doc.end();
                await finished(stream);

                const cleanName = mangaTitle
                    .replace(/[^\w\s]/gi, '')
                    .replace(/\s+/g, '-');

                let caption = `📖 *${mangaTitle}*\n`;
                caption += `Total: ${totalDownloadedPages} halaman\n`;
                caption += `Status: ${successChapters} chapter berhasil`;
                if (failedChapters > 0) caption += `, ${failedChapters} chapter gagal`;

                await conn.sendMessage(m.chat, {
                    document: fs.readFileSync(pdfPath),
                    mimetype: 'application/pdf',
                    fileName: `${cleanName}${isAll ? '-Full' : ''}.pdf`,
                    caption: caption
                }, {
                    quoted: m
                });

                fs.unlinkSync(pdfPath);

            } catch (e) {
                console.error(e);
                m.reply('Gagal memproses download! 😢');
            }
            break;
        }

        default:
            m.reply(
                'Gunakan:\n' +
                '.jagoan search <keyword>\n' +
                '.jagoan detail <url>\n' +
                '.jagoan download <url chapter>\n' +
                '.jagoan download <url detail manga> all'
            );
    }
};

handler.command = /^(jagoan)$/i;
handler.help = [
    'jagoan search <keyword>',
    'jagoan detail <url>',
    'jagoan download <url chapter>',
    'jagoan download <url detail manga> all'
];
handler.tags = ['manga'];
handler.limit = true;
handler.register = true;
handler.description = "Search, view details, and download manga from Jagoan Manga.";

export default handler;