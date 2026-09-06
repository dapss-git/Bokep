let handler = async (m, {
    conn,
    args,
    command,
    prefix
}) => {
    let id = m.sender;
    let name = await conn.getName(m.sender); // ⬅️ Gunakan await
    let user = global.db.data.users[m.sender];

    if (!args[0]) return m.reply(`Contoh: .wikwik start`);

    const argsLower = args.map(arg => arg.toLowerCase());
    const petarung1 = argsLower[0];
    const petarung2 = argsLower[1] || 'lawan';

    const totalRounds = 8;
    let ronde = 1;
    let nyawaPetarung1 = 200;
    let nyawaPetarung2 = 200;

    let result = `🫶 Wikwik antara ${name} dan ${petarung2} dimulai! 🫦\n\n`;

    while (ronde <= totalRounds && nyawaPetarung1 > 0 && nyawaPetarung2 > 0) {
        const pukulan = ['ajul gedang', 'gaya marmot', 'gaya roket', 'gaya kucing', 'gaya katak'];

        const pilihanPetarung1 = pukulan[Math.floor(Math.random() * pukulan.length)];
        const pilihanPetarung2 = pukulan[Math.floor(Math.random() * pukulan.length)];

        const damagePetarung1 = Math.floor(Math.random() * 50) + 1;
        const damagePetarung2 = Math.floor(Math.random() * 50) + 1;

        result += `🫦💦 Ronde ${ronde}\n`;
        result += `${name} stamina: ${nyawaPetarung1}\n`;
        result += `${petarung2} stamina: ${nyawaPetarung2}\n`; // ⬅️ Perbaikan label stamina
        result += `${name}: ${pilihanPetarung1}\n`;
        result += `${petarung2}: ${pilihanPetarung2}\n\n`;

        if (pilihanPetarung1 === pilihanPetarung2) {
            result += `⚔️ Wikwik sedang berlangsung dengan gaya yang sama! Tidak ada yang keluar sama sekali.\n`;
        } else {
            result += `💦 ${name} melakukan ${pilihanPetarung1} dan ${petarung2} melakukan ${pilihanPetarung2}!\n`;
            nyawaPetarung1 -= pilihanPetarung2 === 'jab' ? damagePetarung1 : damagePetarung1 + 10;
            nyawaPetarung2 -= pilihanPetarung1 === 'jab' ? damagePetarung2 : damagePetarung2 + 10;
            result += `💔 ${name} menerima damage ${damagePetarung1}!\n`;
            result += `💔 ${petarung2} menerima damage ${damagePetarung2}!\n\n--------------------------------------------------\n`;
        }

        ronde++;
    }

    result += `\n⏱️ Wikwik akhirnya berakhir!\n`;
    result += `${name} stamina akhir: ${nyawaPetarung1}\n`;
    result += `${petarung2} stamina akhir: ${nyawaPetarung2}\n`;

    if (nyawaPetarung1 > nyawaPetarung2) {
        result += `👙 ${name} memenangkan pertandingan!\n`;
    } else if (nyawaPetarung2 > nyawaPetarung1) {
        result += `🩲 ${petarung2} memenangkan pertandingan!\n`;
    } else {
        result += `👙💦 Pertandingan berakhir imbang! Kedua petarung memiliki stamina yang sama.\n`;
    }

    let tambahDosa = Math.floor(Math.random() * 50) + 50; // Random 50 - 100 dosa
    user.dosa = (user.dosa || 0) + tambahDosa;
    result += `\n\n😈 Wahahaha! Dosa kamu bertambah ${tambahDosa} karena melakukan wikwik!\nTotal dosa sekarang: ${user.dosa} dosa`;

    await m.reply(result);
};

handler.help = ['wikwik'];
handler.tags = ['rpg'];
handler.command = /^(wikwik)$/i;
handler.register = true;
handler.premium = true;
handler.rpg = true;
handler.nsfw = true
export default handler;