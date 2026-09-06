import {
    createHash
} from 'crypto';
import moment from 'moment-timezone';

let handler = async function(m, {
    conn,
    usedPrefix,
    command
}) {
    let user = global.db.data.users[m.sender];
    if (user.registered === true) return m.reply(`[💬] Kamu sudah terdaftar.`);

    const name = m.name || conn.getName(m.sender);
    const age = Math.floor(Math.random() * 10) + 15;
    const sn = createHash('md5').update(m.sender).digest('hex').slice(0, 12).toUpperCase();

    await global.loading(m, conn);

    user.name = name.trim();
    user.age = age;
    user.regTime = +new Date();
    user.registered = true;
    user.sn = sn;
    user.limit = (user.limit || 0) + 50;

    let p = `*Selamat Kamu sudah Mendaftar ✅*\n`
    p += `•Nama: *${name}*\n`
    p += `•Umur: *${age} Tahun*\n`
    p += `•Bonus Limit: *50*\n`
    p += `•Ketik *.menu* Untuk Melanjutkan\n\n`
    p += `•SN Kamu: *${sn}*`

    const arr = [{
            text: `*[ V ]*\n\n${p}`,
            timeout: 100
        },
        {
            text: `*[ V E ]*\n\n${p}`,
            timeout: 100
        },
        {
            text: `*[ V E R ]*\n\n${p}`,
            timeout: 100
        },
        {
            text: `*[ V E R I ]*\n\n${p}`,
            timeout: 100
        },
        {
            text: `*[ V E R I F ]*\n\n${p}`,
            timeout: 100
        },
        {
            text: `*[ V E R I F Y ]*\n\n${p}`,
            timeout: 100
        },
        {
            text: `*[ V E R I F Y   S ]*\n\n${p}`,
            timeout: 100
        },
        {
            text: `*[ V E R I F Y   S U ]*\n\n${p}`,
            timeout: 100
        },
        {
            text: `*[ V E R I F Y   S U C ]*\n\n${p}`,
            timeout: 100
        },
        {
            text: `*[ V E R I F Y   S U C C ]*\n\n${p}`,
            timeout: 100
        },
        {
            text: `*[ V E R I F Y   S U C C E ]*\n\n${p}`,
            timeout: 100
        },
        {
            text: `*[ V E R I F Y   S U C C E S ]*\n\n${p}`,
            timeout: 100
        },
        {
            text: `*[ V E R I F Y   S U C C E S S ]*\n\n${p}`,
            timeout: 100
        },
    ];

    const lll = await conn.sendMessage(
        m.chat, {
            text: 'Sedang memverifikasi akun kamu....'
        }, {
            quoted: m
        }
    );

    for (let i = 0; i < arr.length; i++) {
        await new Promise(resolve => setTimeout(resolve, arr[i].timeout));

        await conn.relayMessage(m.chat, {
            protocolMessage: {
                key: lll.key,
                type: 14,
                editedMessage: {
                    conversation: arr[i].text
                }
            }
        }, {});
    }

    await global.db.save();
    await global.loading(m, conn, true);
};

handler.help = ['verify'];
handler.tags = ['xp'];
handler.command = /^(verify)$/i;


export default handler;