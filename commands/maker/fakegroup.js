/**
  ╔══════════════════════
         ⧉  [fakegroup] — [maker]
 ╚══════════════════════

  ✺ Type     : Plugin ESM
  ✺ Command : falegroup | fakegroupv2
  ✺ Source   : https://whatsapp.com/channel/0029VbAXhS26WaKugBLx4E05
  ✺ Creator  : SXZnightmare
  ✺ API      : [ https://api.zenzxz.my.id ]
*/

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    try {
        const cmd = command.toLowerCase();
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        if (!text && !mime) {
            const example = cmd === 'fakegroupv2' ?
                `*Fake WhatsApp Group Generator*

*Example:*

➜ Reply gambar dengan caption:
${usedPrefix + command} Synthesis R | 400 | no rules | SXZnightmare | 07/03/26 00:30

➜ Atau gunakan URL:
${usedPrefix + command} https://example.com/image.jpg Synthesis R | 400 | no rules | SXZnightmare | 07/03/26 00:30

*Format:*
${usedPrefix + command} name | members | desc | author | date

*Perbedaan versi:*
• *fakegroup* ➜ Tampilan profil grup *style iOS*
• *fakegroupv2* ➜ Tampilan info grup *WhatsApp Android*` :
                `*Fake WhatsApp Group Generator*

*Example:*

➜ Reply gambar dengan caption:
${usedPrefix + command} Synthesis | 628123456789 | 10:20

➜ Atau gunakan URL:
${usedPrefix + command} https://example.com/image.jpg Synthesis | 628123456789 | 10:20

*Format:*
${usedPrefix + command} title | number | time

*Perbedaan versi:*
• *fakegroup* ➜ Tampilan profil grup *style iOS*
• *fakegroupv2* ➜ Tampilan info grup *WhatsApp Android*`;

            return m.reply(example);
        }

        await conn.sendMessage(m.chat, {
            react: {
                text: '⏳',
                key: m.key
            }
        });

        let url;
        let args;

        const parts = text ? text.split(/\s+/) : [];

        if (parts.length && /^https?:\/\//i.test(parts[0])) {
            url = parts.shift();
            text = parts.join(' ');
        }

        args = text.split('|').map(v => v.trim());

        if (!url) {
            if (!mime) throw 'no image';

            const buffer = await q.download();

            const form = new FormData();
            form.append('files[]', new Blob([buffer]), 'image.jpg');

            const upload = await fetch('https://uguu.se/upload.php', {
                method: 'POST',
                body: form
            });

            const json = await upload.json();
            url = json.files[0].url;
        }

        let endpoint;

        if (cmd === 'fakegroup') {
            const [title, number, time] = args;

            if (!title || !number || !time) {
                return m.reply(`🍂 *Format salah!*\n\n*Contoh:*\n${usedPrefix + command} Synthesis | 628123456789 | 10:20`);
            }

            endpoint = `https://api.zenzxz.my.id/maker/fakegroup?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&number=${encodeURIComponent(number)}&time=${encodeURIComponent(time)}`;
        }

        if (cmd === 'fakegroupv2') {
            const [name, members, desc, author, date] = args;

            if (!name || !members || !desc || !author || !date) {
                return m.reply(`🍂 *Format salah!*\n\n*Contoh:*\n${usedPrefix + command} Synthesis R | 400 | no rules | SXZnightmare | 07/03/26 00:30`);
            }

            endpoint = `https://api.zenzxz.my.id/maker/fakegroupv2?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}&members=${encodeURIComponent(members)}&desc=${encodeURIComponent(desc)}&author=${encodeURIComponent(author)}&date=${encodeURIComponent(date)}`;
        }

        const res = await fetch(endpoint);

        if (!res.ok) throw new Error('Request failed');

        const buffer = Buffer.from(await res.arrayBuffer());

        await conn.sendMessage(m.chat, {
            image: buffer
        }, {
            quoted: m
        });

    } catch (e) {
        console.log(e);
        m.reply(`🍂 *Gagal membuat tampilan Fake Group.*\n\n*Kemungkinan penyebab:*\n• Format input tidak valid\n• Gambar tidak terbaca\n• API sedang bermasalah`);
    } finally {
        await conn.sendMessage(m.chat, {
            react: {
                text: '',
                key: m.key
            }
        });
    }
};

handler.help = ['fakegroup'];
handler.tags = ['maker'];
handler.command = /^(fakegroup|fakegroupv2)$/i;
handler.limit = false;
handler.register = true; // Ubah ke true jika bot kamu memiliki sistem registrasi/daftar

export default handler;