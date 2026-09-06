import fs from 'fs';

let timeout = 3600000 // 1 jam

let handler = async (m, {
    conn,
    args,
    usedPrefix,
    DevMode
}) => {

    let u = global.db.data.users[m.sender];
    let time = u.lastclaim + 3600000;

    if (new Date() - u.lastclaim < 3600000) {
        return m.reply(`Sudah Melakukan Pencarian Airdrop! 🪙
Harus menunggu selama ${clockString(time - new Date())}`);
    }

    let Aku = Math.floor(Math.random() * 101);
    let Kamu = Math.floor(Math.random() * 81);
    let A = Aku + 1;
    let K = Kamu + 1;

    if (A > K) {
        let _sampah = Array.from({
            length: 50
        }, (_, i) => (i + 1).toString());
        let sampah = _sampah[Math.floor(Math.random() * _sampah.length)];
        let kayu = _sampah[Math.floor(Math.random() * _sampah.length)];
        let batu = _sampah[Math.floor(Math.random() * _sampah.length)];

        await conn.sendFile(m.chat, 'https://telegra.ph/file/60437ce6d807b605adf5e.jpg', 'zonk.jpg',
            `Airdrop Ampas! Ternyata isinya tidak sesuai ekspektasi

Rewards
• Sampah: ${sampah}
• Kayu: ${kayu}
• Batu: ${batu}`, m);

        u.sampah += parseInt(sampah);
        u.kayu += parseInt(kayu);
        u.batu += parseInt(batu);
        u.lastclaim = new Date();
    } else if (A < K) {
        let _limit = ['10', '20', '30'];
        let limit = _limit[Math.floor(Math.random() * _limit.length)];

        let _money = ['10000', '100000', '500000'];
        let money = _money[Math.floor(Math.random() * _money.length)];

        let _point = ['10000', '100000', '500000'];
        let point = _point[Math.floor(Math.random() * _point.length)];

        await conn.sendFile(m.chat, 'https://telegra.ph/file/d3bc1d7a97c62d3baaf73.jpg', 'rare.jpg',
            `Airdrop Rare!, Kamu mendapatkan Kotak Airdrop Rare

Selamat kamu mendapatkan Rewards
• Limit: ${limit}
• Money: ${money}
• Point: ${point}`, m);

        u.limit += parseInt(limit);
        u.money += parseInt(money);
        u.poin += parseInt(point);
        u.lastclaim = new Date();
    } else {
        await conn.sendFile(m.chat, 'https://telegra.ph/file/5d71027ecbcf771b299fb.jpg', 'zonk.jpg',
            `Airdrop Zonks!, Kamu mendapatkan Kotak Airdrop Zonk (Kosong)

Selamat kamu mendapatkan Rewards
• Money: -1.000.000
• Isi: Angin`, m);

        u.money -= 1000000;
        u.lastclaim = new Date();
    }

    // Optional reminder
    /*
    setTimeout(() => {
      conn.reply(m.chat, `Waktunya berburu Airdrop!`, m);
    }, timeout);
    */
};

handler.help = ['airdrop'];
handler.tags = ['rpg'];
handler.command = /^(airdrop)$/i;
handler.group = true;
handler.rpg = true;

handler.register = true

export default handler;

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function clockString(ms) {
    let d = isNaN(ms) ? '--' : Math.floor(ms / 86400000);
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24;
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return ['\n' + d + ' Hari ☀️\n ', h + ' Jam 🕐\n ', m + ' Menit ⏰\n ', s + ' Detik ⏱️']
        .map(v => v.toString().padStart(2, 0))
        .join('');
}