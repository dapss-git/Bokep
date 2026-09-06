import axios from 'axios';
import fs from 'fs';
import path from 'path';

let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    let targetJid;

    if (m.quoted) {
        targetJid = m.quoted.sender;
    } else if (m.mentionedJid && m.mentionedJid[0]) {
        targetJid = m.mentionedJid[0];
    } else if (text) {
        const number = text.replace(/[^0-9]/g, '');

        if (number.length < 10 || number.length > 15) {
            return m.reply(
                `Nomor tidak valid!\n\nFormat: ${usedPrefix + command} <nomor>\nContoh: ${usedPrefix + command} 6281234567890`
            );
        }

        targetJid = `${number}@s.whatsapp.net`;
    } else {
        return m.reply(
            `Cara penggunaan:\n\n` +
            `1. Reply/tag pesan:\n${usedPrefix + command}\n\n` +
            `2. Input nomor langsung:\n${usedPrefix + command} 6281234567890\n\n` +
            `3. Tag user:\n${usedPrefix + command} @user`
        );
    }

    try {
        await global.loading(m, conn);

        const number = targetJid.split('@')[0];

        const onWhatsapp = await conn.onWhatsApp(number);
        const isRegistered = onWhatsapp.length > 0 && onWhatsapp[0].exists;

        if (!isRegistered) {
            global.loading(m, conn, true);
            return m.reply(`❌ Nomor ${number} tidak terdaftar di WhatsApp!`);
        }

        const userInfo = onWhatsapp[0];

        let profilePic;

        try {
            profilePic = await conn.profilePictureUrl(targetJid, 'image');
        } catch {
            profilePic = fs.readFileSync(path.join(process.cwd(), 'src/avatar_contact.png'));
        }

        let about;

        try {
            const statusData = await conn.fetchStatus(targetJid);
            about = statusData?.status || 'Tidak ada info status';
        } catch {
            about = 'Privasi status disembunyikan';
        }

        const isBusiness = await conn.getBusinessProfile(targetJid).catch(() => null);

        global.loading(m, conn, true);

        let caption = `WHATSAPP STALKER\n\n`;
        caption += `📱 Nomor: ${number}\n`;
        caption += `🔗 JID: ${targetJid}\n`;
        caption += `✅ Terdaftar: ${isRegistered ? 'Ya' : 'Tidak'}\n`;
        caption += `💼 Akun Bisnis: ${isBusiness ? 'Ya' : 'Tidak'}\n`;
        caption += `📝 Status: ${about}\n`;

        if (isBusiness) {
            caption += `\nINFO BISNIS:\n`;
            caption += `• Nama: ${isBusiness.business_owner || '-'}\n`;
            caption += `• Kategori: ${isBusiness.category || '-'}\n`;
            caption += `• Deskripsi: ${isBusiness.description || '-'}\n`;

            if (isBusiness.address) {
                caption += `• Alamat: ${isBusiness.address}\n`;
            }

            if (isBusiness.email) {
                caption += `• Email: ${isBusiness.email}\n`;
            }

            if (isBusiness.websites && isBusiness.websites.length > 0) {
                caption += `• Website: ${isBusiness.websites.join(', ')}\n`;
            }

            if (isBusiness.business_hours) {
                const hours = isBusiness.business_hours;

                caption += `• Jam Buka:\n`;

                for (const day of Object.keys(hours)) {
                    const time = hours[day];

                    caption += `  ${day}: ${time.open || 'Tutup'} - ${time.close || ''}\n`;
                }
            }
        }

        await conn.sendMessage(
            m.chat, {
                image: typeof profilePic === 'string' ?
                    {
                        url: profilePic
                    } :
                    profilePic,
                caption
            }, {
                quoted: m
            }
        );

    } catch (error) {
        global.loading(m, conn, true);

        console.error(error);

        m.reply(`❌ Terjadi kesalahan: ${error.message || error}`);
    }
};

handler.help = ['wastalk <nomor|@tag|reply>'];
handler.tags = ['stalk'];
handler.command = /^(wastalk|stalkwa|stalkwa2)$/i;
handler.description = 'Stalk informasi WhatsApp berdasarkan nomor, tag, atau reply pesan.';
handler.register = true;
handler.limit = 1;

export default handler;