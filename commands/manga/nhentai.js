import fs from 'fs';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import {
    finished
} from 'stream/promises';
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
            .jpeg({
                quality: 85,
                progressive: true
            })
            .toFile(destPath);
    } catch (e) {
        throw e;
    }
};

let handler = async (m, {
    args,
    conn,
    usedPrefix,
    command
}) => {
    const subcommand = (args[0] || '').toLowerCase();

    switch (subcommand) {
        case 'search': {
            const keyword = args.slice(1).join(' ');
            if (!keyword) return m.reply(`Masukkan judul doujin yang ingin dicari\nContoh: ${usedPrefix + command} search paimon`);

            await m.reply('Mencari...');
            try {
                const url = global.API('theresav', '/manga/nhentai/search', {
                    q: keyword
                }, 'apikey');
                const {
                    data
                } = await axios.get(url);

                if (!data?.status || !data?.results?.length)
                    return m.reply('Tidak ditemukan hasil untuk ' + keyword);

                let rows = data.results.slice(0, 50).map(v => ({
                    header: v.category || 'Doujin',
                    title: (v.title || 'No title').substring(0, 50),
                    description: 'Lihat Detail',
                    id: `.${command} detail ${v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `Hasil pencarian nHentai: ${keyword}`,
                    footer: `Total (Ditampilkan): ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: {
                            displayText: 'Pilih Doujin'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'List Doujin',
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
                console.error('NHENTAI SEARCH ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mencari');
            }
            break;
        }

        case 'latest':
        case 'home': {
            const path = subcommand === 'home' ? '/manga/nhentai/home' : '/manga/nhentai/latest';
            await m.reply('Mengambil update terbaru dari nHentai...');
            try {
                const url = global.API('theresav', path, {}, 'apikey');
                const {
                    data
                } = await axios.get(url);

                if (!data?.status || !data?.results?.length)
                    return m.reply('Tidak ada update terbaru');

                let rows = data.results.slice(0, 50).map(v => ({
                    header: v.category || 'Doujin',
                    title: (v.title || 'No title').substring(0, 50),
                    description: 'Lihat Detail',
                    id: `.${command} detail ${v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `nHentai Update Terbaru 🆕`,
                    footer: `Total Update: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: {
                            displayText: 'Pilih Doujin'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Update Terbaru',
                                sections: [{
                                    title: 'List Update',
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
                console.error('NHENTAI LATEST ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil update terbaru');
            }
            break;
        }

        case 'popular': {
            await m.reply('Mengambil doujin populer dari nHentai...');
            try {
                const url = global.API('theresav', '/manga/nhentai/popular', {}, 'apikey');
                const {
                    data
                } = await axios.get(url);

                if (!data?.status || !data?.results?.length)
                    return m.reply('Gagal mengambil data populer');

                let rows = data.results.slice(0, 50).map(v => ({
                    header: v.category || 'Doujin',
                    title: (v.title || 'No title').substring(0, 50),
                    description: 'Lihat Detail',
                    id: `.${command} detail ${v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `nHentai Populer 🔥`,
                    footer: `Total: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: {
                            displayText: 'Pilih Doujin'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'Populer',
                                sections: [{
                                    title: 'List Populer',
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
                console.error('NHENTAI POPULAR ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mengambil data populer');
            }
            break;
        }

        case 'genre': {
            const genre = args[1];
            const genres = ['Big Breasts', 'Sole Female', 'Sole Male', 'Stockings', 'Schoolgirl Uniform', 'Nakadashi', 'Blowjob', 'Defloration', 'Loli', 'Anal', 'Glasses', 'Incest', 'Ahegao', 'Paizuri', 'Impregnation', 'X-ray', 'Milf', 'Femdom', 'Group', 'Yaoi', 'Yuri'];

            if (!genre) {
                let text = `Pilih genre nHentai:\n\n` + genres.map(v => `• ${v}`).join('\n');
                return m.reply(text + `\n\nContoh: ${usedPrefix + command} genre Loli`);
            }

            await m.reply(`Mencari doujin dengan genre: ${genre}...`);
            try {
                const url = global.API('theresav', '/manga/nhentai/genres', {
                    genre
                }, 'apikey');
                const {
                    data
                } = await axios.get(url);

                if (!data?.status || !data?.results?.length)
                    return m.reply('Tidak ditemukan hasil untuk genre ' + genre);

                let rows = data.results.slice(0, 50).map(v => ({
                    header: v.category || 'Doujin',
                    title: (v.title || 'No title').substring(0, 50),
                    description: 'Lihat Detail',
                    id: `.${command} detail ${v.url}`
                }));

                await conn.sendMessage(m.chat, {
                    text: `nHentai Genre: ${genre}`,
                    footer: `Total: ${rows.length}`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: {
                            displayText: 'Pilih Doujin'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'List Genre',
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
                console.error('NHENTAI GENRE ERROR:', e?.response?.data || e.message);
                m.reply('Error API saat mencari genre');
            }
            break;
        }

        case 'detail': {
            let detailUrl = args[1];
            if (!detailUrl) return m.reply('URL tidak valid');
            detailUrl = decodeURIComponent(detailUrl);

            await m.reply('Mengambil detail doujin...');
            try {
                const apiUrl = global.API('theresav', '/manga/nhentai/detail', {
                    url: detailUrl
                }, 'apikey');
                const {
                    data
                } = await axios.get(apiUrl);

                if (!data?.status || !data?.result)
                    return m.reply('Gagal mengambil detail doujin');

                const r = data.result;

                let teks = `${r.title || '-'}\n\n`;
                if (r.nativeTitle) teks += `Native: ${r.nativeTitle}\n`;
                if (r.id) teks += `ID: ${r.id}\n`;
                if (r.pages) teks += `Total Pages: ${r.pages}\n`;
                if (r.uploaded) teks += `Uploaded: ${r.uploaded}\n\n`;

                if (r.tags?.length) teks += `Tags: ${r.tags.join(', ')}\n\n`;

                const thumbBuffer = await getBuffer(r.thumbnail);

                await conn.sendMessage(m.chat, {
                    ...(thumbBuffer ? {
                        image: thumbBuffer
                    } : {}),
                    caption: teks,
                    footer: `Apocalypse nHentai Downloader`,
                    buttons: [{
                        buttonId: 'action',
                        buttonText: {
                            displayText: 'Download PDF'
                        },
                        type: 1,
                        id: `.${command} download ${detailUrl}`
                    }]
                }, {
                    quoted: m
                });
            } catch (e) {
                console.error('NHENTAI DETAIL ERROR:', e?.response?.data || e.message);
                m.reply('Error saat mengambil detail');
            }
            break;
        }

        case 'download': {
            let readUrl = args[1];
            if (!readUrl) return m.reply('URL tidak valid');
            readUrl = decodeURIComponent(readUrl);

            await m.reply('Sedang mendownload gambar & membuat PDF (ini mungkin memakan waktu)...');
            try {
                const apiUrl = global.API('theresav', '/manga/nhentai/detail', {
                    url: readUrl
                }, 'apikey');
                const {
                    data
                } = await axios.get(apiUrl);

                if (!data?.status || !data?.result?.images?.length)
                    return m.reply('Gagal mengambil data gambar dari doujin ini.');

                const images = data.result.images;
                const title = data.result.title || 'nhentai';
                const cleanName = `nHentai_${data.result.id || Date.now()}`.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-');

                const pdfPath = `${TMP_DIR}/${Date.now()}_nhentai.pdf`;
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
                        else console.error('[DL nHentai] Failed:', r.reason?.message);
                    });
                }

                if (!imgPaths.length) return m.reply('Semua gambar gagal didownload');

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
                    caption: `🔞 ${title}\nTotal: ${imgPaths.length} halaman`
                }, {
                    quoted: m
                });

                fs.unlinkSync(pdfPath);
            } catch (e) {
                console.error('NHENTAI DOWNLOAD ERROR:', e?.response?.data || e.message);
                m.reply('Error saat membuat PDF');
            }
            break;
        }

        default:
            m.reply(
                'nHentai (NSFW) 🔞\n\n' +
                `.${command} search <judul>\n` +
                `.${command} latest\n` +
                `.${command} home\n` +
                `.${command} popular\n` +
                `.${command} genre <nama_genre>\n` +
                `.${command} detail <url>\n` +
                `.${command} download <url>`
            );
    }
};

handler.command = /^(nhentai)$/i;
handler.help = [
    'nhentai search <judul>',
    'nhentai latest',
    'nhentai home',
    'nhentai popular',
    'nhentai genre <nama_genre>',
    'nhentai detail <url>',
    'nhentai download <url>'
];
handler.tags = ['manga'];
handler.limit = true;
handler.register = true;

export default handler;