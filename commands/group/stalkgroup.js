import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`📌 *Contoh penggunaan:*\n${usedPrefix}${command} <link_group atau ID_group>\n\nContoh:\n${usedPrefix}${command} https://chat.whatsapp.com/ABC123xyz\n${usedPrefix}${command} 123456789@g.us`);
    }

    let groupId = '';
    
    // Cek apakah input adalah link invite
    const inviteRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
    const inviteMatch = text.match(inviteRegex);
    
    if (inviteMatch) {
        // Ini adalah link invite
        const inviteCode = inviteMatch[1];
        
        try {
            if (!conn.groupGetInviteInfo) {
                return m.reply('❌ Bot tidak mendukung method groupGetInviteInfo.');
            }
            
            const groupInfo = await conn.groupGetInviteInfo(inviteCode);
            
            if (!groupInfo) {
                return m.reply('❌ Tidak dapat mengambil info grup. Mungkin link tidak valid atau sudah kadaluarsa.');
            }
            
            groupId = groupInfo.id;
            
            // Tampilkan info dari invite link
            await displayGroupInfo(m, conn, groupInfo, `https://chat.whatsapp.com/${inviteCode}`);
            return;
        } catch (error) {
            console.error('Error fetching invite info:', error);
            return m.reply('❌ Gagal mengambil info grup dari link invite.');
        }
    }
    
    // Cek apakah input adalah ID grup (format: xxxxx@g.us atau hanya angka)
    if (text.includes('@g.us')) {
        groupId = text;
    } else if (text.match(/^[0-9]+$/)) {
        groupId = text + '@g.us';
    } else {
        return m.reply('❌ Format tidak valid. Gunakan link group (chat.whatsapp.com/xxx) atau ID group (contoh: 123456789 @g.us)');
    }

    try {
        // Coba ambil metadata grup
        const groupMetadata = await conn.groupMetadata(groupId).catch(() => null);
        
        if (!groupMetadata) {
            return m.reply('❌ Gagal mengambil info grup. Pastikan ID valid dan bot memiliki akses.');
        }
        
        // Ambil info tambahan dari groupMetadata
        const inviteCode = await conn.groupInviteCode(groupId).catch(() => null);
        const inviteLink = inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : 'Tidak tersedia';
        
        await displayGroupInfo(m, conn, groupMetadata, inviteLink);
        
    } catch (error) {
        console.error('Error fetching group metadata:', error);
        return m.reply('❌ Gagal mengambil info grup. Pastikan ID valid dan bot memiliki akses.');
    }
};

async function displayGroupInfo(m, conn, groupInfo, inviteLink) {
    const {
        subject = 'Tidak diketahui',
        owner,
        participants = [],
        creation,
        desc,
        subjectOwner,
        subjectTime,
        restrict = false,
        announce = false,
        isCommunity = false,
        isCommunityAnnounce = false
    } = groupInfo;

    const size = participants.length;
    
    // Hitung jumlah admin, member biasa, dan bot
    const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
    const superAdmin = participants.filter(p => p.admin === 'superadmin');
    const members = participants.filter(p => !p.admin);
    const botJid = conn.user?.jid || conn.user?.id;
    const isBotMember = participants.some(p => p.id === botJid);
    const isBotAdmin = admins.some(p => p.id === botJid);

    let teks = `🔍 *STALK GROUP INFO*\n\n`;
    teks += `📛 *Nama Group:* ${subject}\n`;
    teks += `🆔 *ID:* ${groupInfo.id}\n`;
    
    if (owner) {
        teks += `🧑‍💼 *Owner:* @${(owner || '').split('@')[0]}\n`;
    }
    
    if (subjectOwner) {
        teks += `✏️ *Pengubah Nama:* @${(subjectOwner || '').split('@')[0]}\n`;
    }
    
    teks += `👥 *Total Member:* ${size}\n`;
    teks += `   • Admin: ${admins.length}\n`;
    teks += `   • Member: ${members.length}\n`;
    
    if (creation) {
        const createdDate = new Date(creation * 1000);
        teks += `⏱️ *Dibuat:* ${createdDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
    }
    
    if (subjectTime) {
        const nameChangeTime = new Date(subjectTime * 1000);
        teks += `🔄 *Nama diubah:* ${nameChangeTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
    }
    
    teks += `🔒 *Settings:*\n`;
    teks += `   • Kirim Pesan: ${restrict ? '❌ Hanya Admin' : '✅ Semua Member'}\n`;
    teks += `   • Edit Info: ${announce ? '❌ Hanya Admin' : '✅ Semua Member'}\n`;
    teks += `   • Community: ${isCommunity ? '✅ Ya' : '❌ Tidak'}\n`;
    if (isCommunityAnnounce) {
        teks += `   • Community Announce: ✅ Ya\n`;
    }
    
    teks += `🤖 *Status Bot:* ${isBotMember ? (isBotAdmin ? '✅ Admin' : '✅ Member') : '❌ Tidak Ada'}\n`;
    
    if (desc) {
        teks += `\n📝 *Deskripsi:*\n${desc}\n`;
    }
    
    teks += `\n🔗 *Link Invite:* ${inviteLink}\n`;
    
    // Coba ambil foto profil group
    try {
        const pp = await conn.profilePictureUrl(groupInfo.id, 'image').catch(() => 'src/avatar_contact.png');
        
        if (pp) {
            await conn.sendMessage(m.chat, {
                image: { url: pp },
                caption: teks,
                mentions: [owner, subjectOwner].filter(Boolean)
            }, { quoted: m });
            return;
        }
    } catch (e) {
        console.error('Error getting group PP:', e);
    }
    
    // Jika tidak ada foto profil, kirim teks saja
    await conn.sendMessage(m.chat, {
        text: teks,
        mentions: [owner, subjectOwner].filter(Boolean)
    }, { quoted: m });
}

handler.help = ['stalkgroup <link|id>', 'stalkgc <link|id>'];
handler.tags = ['group', 'stalk'];
handler.command = /^(stalkgroup|stalkgc)$/i;
handler.description = 'Stalk info group menggunakan link atau ID group';
handler.register = true;
handler.limit = 1;

export default handler;
