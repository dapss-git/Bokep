import {
    createCanvas,
    loadImage,
    GlobalFonts
} from '@napi-rs/canvas';
import moment from 'moment-timezone';

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
    for (let i = 0; i < 5; i++) petal(ctx, cx, cy, r, (Math.PI * 2 / 5) * i, color, alpha);
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
    [
        [x, y, 1, 1],
        [x + w, y, -1, 1],
        [x, y + h, 1, -1],
        [x + w, y + h, -1, -1]
    ].forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * size, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * size);
        ctx.stroke();
    });
}

function diamondRow(ctx, cx, y, count, spacing, size, color) {
    const startX = cx - (count - 1) * spacing / 2;
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

async function generateCekSNCard(user, pp) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'Emoji');

    const W = 680,
        H = 400;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const bgG = ctx.createLinearGradient(0, 0, W, H);
    bgG.addColorStop(0, '#fdf8f0');
    bgG.addColorStop(0.4, '#fef9f2');
    bgG.addColorStop(1, '#faf3e8');
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 600; i++) {
        ctx.fillStyle = `rgba(180,140,100,${Math.random()*0.04+0.01})`;
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 0.8, 0, Math.PI * 2);
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

    const sp = '#f8a4c0',
        sl = '#fcc8d8',
        sd = '#e87098';

    sakura(ctx, 44, 42, 26, sl, 0.18);
    sakura(ctx, W - 48, 36, 20, sp, 0.14);
    sakura(ctx, 34, H - 44, 22, sp, 0.16);
    sakura(ctx, W - 44, H - 48, 24, sl, 0.14);
    sakura(ctx, 118, H - 28, 13, sp, 0.12);

    [
        [W * 0.78, H * 0.10, 8, 0.3, sp],
        [W * 0.14, H * 0.22, 6, 0.8, sl],
        [W * 0.88, H * 0.55, 9, 1.1, sp],
        [W * 0.10, H * 0.68, 7, 0.2, sd],
        [W * 0.72, H * 0.90, 8, 1.5, sl],
        [W * 0.35, H * 0.94, 6, 0.6, sp],
        [W * 0.92, H * 0.26, 7, 1.8, sd],
    ].forEach(([px, py, pr, pa, pc]) => petal(ctx, px, py, pr, pa, pc, 0.55));

    const AX = 106,
        AY = H / 2,
        AR = 56;

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
        sakura(ctx, sx, sy, 7, sp, 0.9);
    }

    const CX = W / 2 + 30;

    diamondRow(ctx, CX, 52, 9, 26, 5, '#c9956e');

    ctx.font = 'bold 12px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center';
    ctx.fillText('✦ SERIAL NUMBER ✦', CX, 74);

    ctx.strokeStyle = 'rgba(201,149,110,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CX - 155, 82);
    ctx.lineTo(CX + 155, 82);
    ctx.stroke();

    ctx.font = 'bold 28px SFBold';
    ctx.fillStyle = '#4a1e0a';
    ctx.shadowColor = 'rgba(201,149,110,0.3)';
    ctx.shadowBlur = 8;
    ctx.fillText((user.name || 'User').slice(0, 18), CX, 116);
    ctx.shadowBlur = 0;

    const premStatus = user.premium?.status;
    const statusLabel = premStatus ? '✨ Premium' : '🔰 Free';
    const statusColor = premStatus ? '#9b59b6' : '#7a3e1a';
    ctx.font = '12px SFMedium';
    ctx.fillStyle = statusColor;
    ctx.fillText(statusLabel, CX, 135);

    diamondRow(ctx, CX, 148, 5, 20, 4, '#c9956e');

    const SN = user.sn || '-';
    const snChunks = SN.match(/.{1,4}/g) || [SN];
    const snDisplay = snChunks.join(' - ');

    rrp(ctx, CX - 145, 158, 290, 46, 10);
    const snBg = ctx.createLinearGradient(CX - 145, 158, CX + 145, 204);
    snBg.addColorStop(0, 'rgba(201,149,110,0.12)');
    snBg.addColorStop(1, 'rgba(201,149,110,0.05)');
    ctx.fillStyle = snBg;
    ctx.fill();
    ctx.strokeStyle = '#c9956e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 22px SFBold';
    ctx.fillStyle = '#3d1a06';
    ctx.fillText(snDisplay, CX, 188);

    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(155,106,67,0.6)';
    ctx.fillText('KODE SERIAL NUMBER', CX, 212);

    const colL = CX - 148,
        colR = CX + 10;
    const rows = [
        ['Umur', (user.age || '-') + ' tahun'],
        ['Limit', (user.limit || 0) + ' cmd'],
        ['Daftar', user.regTime ? new Date(user.regTime).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }) : '-'],
        ['Verifikasi', user.verif ? '✅ Ya' : '❌ Belum'],
    ];

    rows.forEach(([k, v], i) => {
        const y = 234 + i * 28;
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
        ctx.moveTo(colL + ctx.measureText(k).width + 4, y - 2);
        ctx.lineTo(colR - 4, y - 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.font = 'bold 12px SFBold';
        ctx.fillStyle = '#3d1a06';
        ctx.fillText(String(v), colR, y);
    });

    diamondRow(ctx, CX, 350, 7, 22, 4, '#c9956e');

    ctx.strokeStyle = 'rgba(201,149,110,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN + 24, H - 32);
    ctx.lineTo(W - MARGIN - 24, H - 32);
    ctx.stroke();

    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(154,100,60,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('Jaga kerahasiaan SN kamu · Digunakan untuk unregister', W / 2, H - 18);
    ctx.fillText(`${global.botname||'Bot'}  ·  ${moment.tz('Asia/Jakarta').format('DD MMM YYYY, HH:mm')} WIB`, W / 2, H - 6);

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    });
}

let handler = async (m, {
    conn
}) => {
    const user = global.db.data.users[m.sender];

    if (!user || !user.registered) {
        return m.reply('❌ Kamu belum terdaftar.\nSilakan daftar dengan mengetik: .daftar');
    }

    await global.loading(m, conn);

    try {
        const pp = await conn.profilePictureUrl(m.sender, 'image')
            .then(url => fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 Chrome/124'
                    }
                })
                .then(r => r.arrayBuffer()).then(b => Buffer.from(b)))
            .catch(() => 'src/avatar_contact.png');

        const card = await generateCekSNCard(user, pp);

        await conn.sendMessage(
            m.chat, {
                image: card,
                caption: `🔐 *Serial Number*\n\n• Nama : ${user.name}\n• SN : ${user.sn}`,
                footer: `꒰ © 2025 ${global.botname} ꒱`,
                interactiveButtons: [{
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📋 Salin SN',
                        copy_code: user.sn,
                    }),
                }],
            }, {
                quoted: m
            }
        );
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.command = ['ceksn'];
handler.register = true;
handler.tags = ['xp'];
export default handler;