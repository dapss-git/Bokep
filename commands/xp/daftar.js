import {
    createHash
} from 'crypto';
import moment from 'moment-timezone';
import {
    createCanvas,
    loadImage,
    GlobalFonts
} from '@napi-rs/canvas';

const _fc = new Set();
const _fb = 'https://raw.githubusercontent.com/Blckrose2/font2/main/';
async function lf(file, alias) {
    if (_fc.has(alias)) return;
    const r = await fetch(_fb + encodeURIComponent(file));
    if (!r.ok) throw new Error('Font: ' + file);
    GlobalFonts.register(Buffer.from(await r.arrayBuffer()), alias);
    _fc.add(alias);
}

function rrp(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function petal(ctx, cx, cy, r, angle, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-r * 0.5, -r * 0.8, -r * 0.3, -r * 1.5, 0, -r * 1.6);
    ctx.bezierCurveTo(r * 0.3, -r * 1.5, r * 0.5, -r * 0.8, 0, 0);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function sakura(ctx, cx, cy, r, color, alpha = 1) {
    for (let i = 0; i < 5; i++) {
        petal(ctx, cx, cy, r, (Math.PI * 2 / 5) * i, color, alpha);
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#fff8f0';
    ctx.fill();
    ctx.restore();
}

function cornerFlourish(ctx, x, y, w, h, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w - size, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + h - size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w - size, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - size);
    ctx.stroke();
}

function diamondRow(ctx, cx, y, count, spacing, size, color) {
    const total = (count - 1) * spacing;
    const startX = cx - total / 2;
    for (let i = 0; i < count; i++) {
        const dx = startX + i * spacing;
        ctx.save();
        ctx.translate(dx, y);
        ctx.rotate(Math.PI / 4);
        rrp(ctx, -size / 2, -size / 2, size, size, 1);
        if (i === Math.floor(count / 2)) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    }
}

async function generateRegistrationCard(name, age, sn, pp, timestamp) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'Emoji');

    const W = 680,
        H = 420;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const bgG = ctx.createLinearGradient(0, 0, W, H);
    bgG.addColorStop(0, '#fdf8f0');
    bgG.addColorStop(0.4, '#fef9f2');
    bgG.addColorStop(1, '#faf3e8');
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 600; i++) {
        const nx = Math.random() * W,
            ny = Math.random() * H;
        ctx.fillStyle = `rgba(180,140,100,${Math.random()*0.04+0.01})`;
        ctx.beginPath();
        ctx.arc(nx, ny, Math.random() * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    const vign = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75);
    vign.addColorStop(0, 'transparent');
    vign.addColorStop(1, 'rgba(160,110,60,0.12)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, W, H);

    const MARGIN = 18;
    rrp(ctx, MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2, 12);
    ctx.strokeStyle = '#c9956e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    rrp(ctx, MARGIN + 5, MARGIN + 5, W - MARGIN * 2 - 10, H - MARGIN * 2 - 10, 9);
    ctx.strokeStyle = 'rgba(201,149,110,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    cornerFlourish(ctx, MARGIN + 3, MARGIN + 3, W - MARGIN * 2 - 6, H - MARGIN * 2 - 6, 20, '#c9956e');

    const sakuraPink = '#f8a4c0';
    const sakuraLight = '#fcc8d8';
    const sakuraDark = '#e87098';

    sakura(ctx, 48, 50, 28, sakuraLight, 0.18);
    sakura(ctx, W - 52, 38, 22, sakuraPink, 0.14);
    sakura(ctx, 36, H - 48, 24, sakuraPink, 0.16);
    sakura(ctx, W - 44, H - 52, 26, sakuraLight, 0.14);
    sakura(ctx, W / 2 + 160, 30, 18, sakuraDark, 0.10);
    sakura(ctx, 120, H - 30, 14, sakuraPink, 0.12);

    const petalPositions = [
        [W * 0.78, H * 0.12, 8, 0.3, sakuraPink],
        [W * 0.15, H * 0.22, 6, 0.8, sakuraLight],
        [W * 0.88, H * 0.55, 9, 1.1, sakuraPink],
        [W * 0.10, H * 0.68, 7, 0.2, sakuraDark],
        [W * 0.72, H * 0.88, 8, 1.5, sakuraLight],
        [W * 0.35, H * 0.92, 6, 0.6, sakuraPink],
        [W * 0.92, H * 0.28, 7, 1.8, sakuraDark],
        [W * 0.55, H * 0.08, 5, 0.9, sakuraPink],
    ];
    petalPositions.forEach(([px, py, pr, pa, pc]) => {
        petal(ctx, px, py, pr, pa, pc, 0.55);
    });

    const AX = 106,
        AY = H / 2,
        AR = 60;

    ctx.save();
    ctx.strokeStyle = '#d4936b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#c9956e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (pp) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(AX, AY, AR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(await loadImage(pp), AX - AR, AY - AR, AR * 2, AR * 2);
        ctx.restore();
    }

    for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i + Math.PI / 4;
        const sx = AX + (AR + 6) * Math.cos(angle);
        const sy = AY + (AR + 6) * Math.sin(angle);
        sakura(ctx, sx, sy, 7, sakuraPink, 0.9);
    }

    const CX = W / 2 + 30;

    diamondRow(ctx, CX, 58, 9, 26, 5, '#c9956e');

    ctx.font = 'bold 13px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center';
    ctx.fillText('✦ REGISTRASI BERHASIL ✦', CX, 82);

    ctx.strokeStyle = 'rgba(201,149,110,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CX - 160, 90);
    ctx.lineTo(CX + 160, 90);
    ctx.stroke();

    ctx.font = 'bold 32px SFBold';
    ctx.fillStyle = '#4a1e0a';
    ctx.shadowColor = 'rgba(201,149,110,0.3)';
    ctx.shadowBlur = 8;
    ctx.fillText(name.slice(0, 18), CX, 128);
    ctx.shadowBlur = 0;

    ctx.font = '13px SFMedium';
    ctx.fillStyle = '#8b5e3c';
    ctx.fillText(`${age} Tahun`, CX, 150);

    diamondRow(ctx, CX, 165, 5, 20, 4, '#c9956e');

    const rows = [
        ['Status', '✅ Terdaftar'],
        ['Nama', name],
        ['Umur', age + ' Tahun'],
        ['SN', sn],
        ['Tanggal', timestamp],
    ];

    const rowY = 190;
    const colL = CX - 140,
        colR = CX + 10;
    const rowH = 28;

    rows.forEach(([k, v], i) => {
        const y = rowY + i * rowH;

        if (i % 2 === 0) {
            rrp(ctx, colL - 8, y - 14, 310, 22, 4);
            ctx.fillStyle = 'rgba(201,149,110,0.07)';
            ctx.fill();
        }

        ctx.font = '11px SFRegular';
        ctx.fillStyle = '#9b6a43';
        ctx.textAlign = 'left';
        ctx.fillText(k, colL, y);

        ctx.save();
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = 'rgba(180,130,80,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const keyW = ctx.measureText(k).width;
        ctx.moveTo(colL + keyW + 4, y - 2);
        ctx.lineTo(colR - 4, y - 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.font = 'bold 12px SFBold';
        ctx.fillStyle = '#3d1a06';
        ctx.fillText(String(v), colR, y);
    });

    diamondRow(ctx, CX, rowY + rows.length * rowH + 8, 7, 22, 4, '#c9956e');

    const SX = CX + 160,
        SY = H / 2 + 60;
    ctx.save();
    ctx.strokeStyle = '#c9956e';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.arc(SX, SY, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#c9956e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(SX, SY, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    sakura(ctx, SX, SY, 14, sakuraDark, 0.8);
    ctx.font = 'bold 7px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center';
    ctx.fillText('VERIFIED', SX, SY + 26);

    ctx.strokeStyle = 'rgba(201,149,110,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN + 24, H - 38);
    ctx.lineTo(W - MARGIN - 24, H - 38);
    ctx.stroke();

    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(154,100,60,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('Data tersimpan aman · Jangan lupa baca rules', W / 2, H - 24);
    ctx.fillText('ᴊᴀɴɢᴀɴ ʟᴜᴘᴀ ʙᴀᴄᴀ ʀᴜʟᴇs  ·  ᴅᴀᴛᴀ ᴅɪᴊᴀᴍɪɴ ᴀᴍᴀɴ 📁', W / 2, H - 12);

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    });
}

let Reg = /\|?(.*)([.|] *?)([0-9]*)$/i;

let handler = async function(m, {
    conn,
    text,
    usedPrefix,
    command
}) {
    try {
        let user = global.db.data.users[m.sender];
        if (user.registered === true) return m.reply(`[💬] Kamu sudah terdaftar\nMau daftar ulang? *${usedPrefix}unreg*`);

        const uname = m.name || "User";

        let list = [];
        for (let i = 6; i < 71; i++) {
            list.push([`${usedPrefix+command} ${uname}.${i}`, i.toString(), 'Umur ' + i]);
        }

        if (!Reg.test(text)) {
            if (text && !text.includes('.') && !text.includes('|')) {
                const name = text.trim();
                const sessionKey = `${m.chat}:${m.sender}`;
                
                global.interactiveSessions.set(sessionKey, {
                    handler: 'daftar',
                    name: name,
                    step: 'age',
                    callback: async (nextMsg) => {
                        const age = parseInt(nextMsg.text.trim());
                        if (isNaN(age) || age < 5 || age > 70) {
                            return nextMsg.reply('❌ Umur tidak valid! Masukkan angka antara 5 - 70.');
                        }
                        // Re-run the main handler logic with full info
                        m.text = `${usedPrefix}${command} ${name}.${age}`;
                        return handler(m, { conn, text: `${name}.${age}`, usedPrefix, command });
                    }
                });

                return m.reply(`*⚠️ Format Kurang Lengkap!*\n\nAnda sudah memasukkan nama: *${name}*\nSekarang silakan ketik **umur** Anda saja (contoh: *18*).`);
            }
            const ageList = Array.from({
                length: 65
            }, (_, i) => `${i+6}`).join('\n')
            return m.reply(
                `*[ 📋 REGISTRASI BOT ]*\n\n` +
                `Nama kamu : *${uname}*\n` +
                `Silahkan pilih umur kamu dengan format:\n` +
                `*${usedPrefix}${command} ${uname}.<umur>*\n\n` +
                `Contoh: *${usedPrefix}${command} ${uname}.18*\n\n` +
                `Range umur: 5 - 70 tahun`, {
                    contextInfo: {
                        externalAdReply: {
                            showAdAttribution: false,
                            mediaType: 1,
                            title: 'Hallo ' + uname,
                            body: global.wm,
                            renderLargerThumbnail: false,
                            sourceUrl: global.website
                        }
                    }
                }
            );
        }

        let [_, name, splitter, age] = text.match(Reg);
        if (!name) return m.reply('Nama tidak boleh kosong (Alphanumeric)');
        if (!age) return m.reply('Umur tidak boleh kosong (Angka)');
        age = parseInt(age);
        if (age > 70) return m.reply('WOI TUA (。-`ω´-)');
        if (age < 5) return m.reply('Halah dasar bocil');
        if (name.split('').length > 30) return m.reply('Nama Maksimal 30 Karakter');

        await global.loading(m, conn);

        user.name = name.trim();
        user.age = age;
        user.regTime = +new Date;
        global.db.data.users[m.sender].limit = (global.db.data.users[m.sender].limit || 0) + 50;
        user.registered = true;

        const sn = createHash('md5').update(m.sender).digest('hex').slice(0, 12).toUpperCase();
        user.sn = sn;
        const ts = moment.tz('Asia/Jakarta').format('DD MMM YYYY · HH:mm');
        const pp = await conn.profilePictureUrl(m.sender, 'image')
            .then(url => fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 Chrome/124'
                    }
                })
                .then(r => r.arrayBuffer()).then(b => Buffer.from(b)))
            .catch(() => 'src/avatar_contact.png');

        const card = await generateRegistrationCard(name.trim(), age, sn, pp, ts);

        await conn.sendFile(m.chat, card, 'welcome.jpg', '', m);
        await global.db.save();

    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['daftar'];
handler.tags = ['xp'];
handler.command = /^(daftar|reg|register)$/i;

handler.before = async function (m, { conn, usedPrefix, command }) {
    const sessionKey = `${m.chat}:${m.sender}`;
    const session = global.interactiveSessions.get(sessionKey);
    
    if (session && session.handler === 'daftar' && session.step === 'age') {
        // Jika pesan adalah angka (umur)
        if (/^\d+$/.test(m.text.trim())) {
            global.interactiveSessions.delete(sessionKey); // Hapus session agar tidak loop
            const age = parseInt(m.text.trim());
            const name = session.name;
            
            // Re-run the main logic
            m.text = `${usedPrefix}${command} ${name}.${age}`;
            return handler(m, { conn, text: `${name}.${age}`, usedPrefix, command });
        }
    }
}


export default handler;