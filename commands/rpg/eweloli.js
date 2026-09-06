let handler = async (m, {
    conn
}) => {
    let user = global.db.data.users[m.sender];

    let lastngojek = user.lastngojek || 0;
    let __timers = new Date().getTime() - lastngojek;
    let _timers = Math.max(0, 300000 - __timers); // 300000 ms = 5 menit
    let Nyulikloli = user.ojekk || 0;
    let timers = clockString(_timers);
    let name = user.name || m.sender.split('@')[0];

    if (__timers > 300000) {
        let randomaku1 = Math.floor(Math.random() * 10);
        let randomaku2 = Math.floor(Math.random() * 10);
        let randomaku3 = Math.floor(Math.random() * 10);
        let randomaku4 = Math.floor(Math.random() * 5);
        let randomaku5 = Math.floor(Math.random() * 10);

        let rbrb1 = randomaku1 * 2;
        let rbrb2 = randomaku2 * 10;
        let rbrb3 = randomaku3 * 1;
        let rbrb4 = randomaku4 * 15729;
        let rbrb5 = randomaku5 * 20000;

        let hsl = `
*—[ Hasil Ngewe loli ${name} ]—*
 ➕ 💹 Uang = [ ${rbrb4} ]
 ➕ ✨ Exp = [ ${rbrb5} ]
 ➕ 📛 Warn = +1		 
 ➕ 😍 Nyulik loli Selesai = +1
 ➕ 📥 Total loli Sebelumnya : ${Nyulikloli}
 ➕ 📥 Dosa Bertambah = +1
 ➕ 📥 Total Dosa = ${user.dosa + 1}
${global.wm || ''}
`.trim();

        user.warn += 1;
        user.money += rbrb4;
        user.exp += rbrb5;
        user.ojekk += 1;
        user.dosa = (user.dosa || 0) + 1;

        let initialMessage = await conn.sendMessage(m.chat, { text: '🔍 Mencari loli.....' }, { quoted: m });

        let messages = [
            '✔️ Mendapatkan loli....',
            '🥵 Mulai ewe loli.....',
            'Korban: 🥵Ahhhh, Sakitttt!! >////<\nPelaku: 💦Crotttt.....',
            '🥵💦💦Ahhhhhh😫',
            hsl
        ];

        for (let i = 0; i < messages.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            await conn.sendMessage(m.chat, {
                text: messages[i],
                edit: initialMessage.key
            });
        }

        user.lastngojek = new Date().getTime();
    } else {
        conn.reply(m.chat, `Sepertinya Anda Sudah Kecapekan Silahkan Istirahat Dulu sekitar\n🕔 *${timers}*`, m);
    }
}

handler.help = ['eweloli'];
handler.tags = ['rpg'];
handler.command = /^(eweloli)$/i;
handler.register = true;
handler.premium = true;
handler.nsfw = true
export default handler;

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}