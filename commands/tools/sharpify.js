global.sharpifySession = global.sharpifySession || {}

let handler = async (m, {
    conn,
    args
}) => {
    try {
        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || ''
        const model = args[0]?.toLowerCase()

        if (!model) {
            if (!mime.startsWith('image/')) {
                return m.reply('Reply foto dengan perintah .sharpify')
            }

            const img = await q.download()
            if (!img) return m.reply('❌ Gagal download gambar')

            global.sharpifySession[m.sender] = {
                img,
                mime,
                time: Date.now()
            }



            return await new Button(conn)
                .setTitle('乂 S H A R P I F Y')
                .setBody('Pilih model untuk memproses gambar')
                .setFooter(m.name || m.pushName || 'User')
                .addSelection('Pilih Model')
                .makeSection('Daftar Model')
                .makeRow('', 'Upscale', 'Tingkatkan resolusi gambar', '.sharpify upscale')
                .makeRow('', 'Enhance', 'Tingkatkan kualitas gambar', '.sharpify enhance')
                .makeRow('', 'Remove BG', 'Hapus latar belakang gambar', '.sharpify removebg')
                .send(m.chat, {
                    quoted: m
                })
        }

        const validModels = ['upscale', 'enhance', 'removebg']
        if (!validModels.includes(model)) {
            return m.reply('Model tidak valid. Pilih antara upscale, enhance, atau removebg')
        }

        const session = global.sharpifySession[m.sender]

        if (!session) {
            return m.reply('Session habis, kirim ulang gambar lalu ketik .sharpify')
        }

        const {
            img,
            mime: sessionMime
        } = session

        await m.reply(`⏳ Memproses gambar dengan model *${model}*...`)

        const headers = {
            'User-Agent': 'okhttp/4.9.2',
            'Accept-Encoding': 'gzip'
        };

        const listmodel = {
            enhance: 'https://sharpify-api.vercel.app/api/enhance/auto_enhance',
            upscale: 'https://sharpify-api.vercel.app/api/enhance/upscale',
            removebg: 'https://sharpify-api.vercel.app/api/enhance/bgrem'
        };

        const apiUrl = listmodel[model] || listmodel.enhance;

        const form = new FormData();
        form.append('file', new Blob([img], { type: sessionMime }), 'source.jpg');

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: form
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Sharpify API Error: ${res.status} - ${errorText}`);
        }

        const data = await res.json();

        if (!data.url) {
            throw new Error('Gagal mendapatkan URL gambar dari Sharpify API.');
        }

        await conn.sendMessage(
            m.chat, {
                image: { url: data.url },
                caption: `✅ Berhasil diproses menggunakan model *${model}*`
            }, {
                quoted: m
            }
        )



    } catch (e) {
        console.error(e)
        await m.reply('❌ Error: ' + e.message)
    }
}

handler.help = ['sharpify']
handler.command = ['sharpify']
handler.tags = ['tools']
handler.limit = true
handler.register = true

export default handler
