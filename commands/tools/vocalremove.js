import axios from 'axios';

const handler = async (m, {
    conn
}) => {
    const mime = m.quoted?.mimetype || m.quoted?.msg?.mimetype || '';

    if (!m.quoted || !/audio|video/.test(mime)) {
        return m.reply('✦ Balas pesan audio/video dengan perintah ini.');
    }

    m.reply('⏳ Sedang menghapus vocal...');

    try {
        const buffer = await m.quoted.download();
        if (!buffer) throw new Error('Gagal download media');

        const blob = new Blob([buffer], {
            type: mime || 'audio/mpeg'
        });

        const res = await axios.post(
            global.APIs['theresav'] + '/tools/vocalremove',
            blob, {
                headers: {
                    'Content-Type': blob.type,
                    'apikey': global.APIKeys[global.APIs['theresav']]
                },
                maxBodyLength: Infinity,
                timeout: 60000
            }
        );

        if (!res.data || !res.data.status) {
            throw new Error(res.data?.message || 'Gagal memproses audio');
        }

        const {
            vocal,
            instrumental
        } = res.data.result;

        await conn.sendMessage(
            m.chat, {
                audio: {
                    url: vocal
                },
                mimetype: 'audio/mp4'
            }, {
                quoted: m
            }
        );

        await conn.sendMessage(
            m.chat, {
                audio: {
                    url: instrumental
                },
                mimetype: 'audio/mp4'
            }, {
                quoted: m
            }
        );

    } catch (err) {
        console.error(err);
        m.reply('❌ Gagal memproses audio:\n' + err.message);
    }
};

handler.help = ['vocalremove'];
handler.tags = ['tools'];
handler.command = /^(vocalrem|remvocal|vocalremove|removevocal)$/i;
handler.limit = true;
handler.register = true;

export default handler;