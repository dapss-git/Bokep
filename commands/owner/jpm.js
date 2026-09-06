const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handler = async (m, {
    conn,
    text
}) => {
    if (!text || !text.includes('>')) {
        return conn.reply(
            m.chat,
            'Format salah!\n\nContoh:\n.jpm Halo semuanya!>2000',
            m
        );
    }

    try {
        let [pesan, jeda] = text.split('>');
        pesan = pesan.trim();
        jeda = parseInt(jeda.trim());

        if (!pesan) {
            return conn.reply(m.chat, 'Pesan tidak boleh kosong.', m);
        }

        if (isNaN(jeda) || jeda < 1000) {
            return conn.reply(m.chat, 'Minimal jeda 1000 ms.', m);
        }

        let getGroups = await conn.groupFetchAllParticipating();
        let groups = Object.values(getGroups || {});
        let total = groups.length;

        let estimasi = ((total * jeda) / 1000).toFixed(1);

        await conn.reply(
            m.chat,
            `BROADCAST DIMULAI\n\nTotal Grup: ${total}\nEstimasi: ~${estimasi} detik`,
            m
        );

        for (let group of groups) {
            try {
                await delay(jeda); // fallback aman

                let participants = group.participants || [];

                await conn.sendMessage(
                    group.id, {
                        text: pesan,
                        mentions: participants.map(p => p.id)
                    }, {
                        quoted: m
                    }
                );

            } catch (e) {
                console.error("Error group:", group?.id, e);
                await conn.reply(
                    m.chat,
                    `Gagal kirim ke ${group?.subject || group?.id}`,
                    m
                );
            }
        }

        await conn.reply(m.chat, 'Broadcast selesai.', m);

    } catch (err) {
        console.error('Error utama:', err);
        await conn.reply(m.chat, 'Terjadi kesalahan broadcast.', m);
    }
};

handler.help = ['jpm <pesan>><delay_ms>'];
handler.tags = ['owner'];
handler.command = /^jpm$/i;
handler.owner = true;

handler.register = true

export default handler;