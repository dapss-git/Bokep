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

async function safeLoadImage(url) {
    try {
        const r = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        if (!r.ok) throw new Error('img');
        return await loadImage(Buffer.from(await r.arrayBuffer()));
    } catch {
        const c = createCanvas(100, 100);
        const g = c.getContext('2d');
        g.fillStyle = '#e8d5c4';
        g.beginPath();
        g.arc(50, 50, 50, 0, Math.PI * 2);
        g.fill();
        return await loadImage(c.toBuffer('image/png'));
    }
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

function sakura(ctx, cx, cy, r, color, alpha) {
    if (alpha === undefined) alpha = 1;
    for (let i = 0; i < 5; i++)
        petal(ctx, cx, cy, r, (Math.PI * 2 / 5) * i, color, alpha);
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

const toRupiah = n => parseInt(n).toLocaleString().replace(/,/g, '.');

async function generateBankCard(avatarURL, data) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'NotoEmoji');

    const W = 700,
        H = 420;
    const M = 18;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const bgG = ctx.createLinearGradient(0, 0, W, H);
    bgG.addColorStop(0, '#fdf8f0');
    bgG.addColorStop(0.45, '#fef9f2');
    bgG.addColorStop(1, '#faf3e8');
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 700; i++) {
        ctx.fillStyle = `rgba(180,140,100,${Math.random() * 0.04 + 0.01})`;
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75);
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, 'rgba(160,110,60,0.12)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    rrp(ctx, M, M, W - M * 2, H - M * 2, 12);
    ctx.strokeStyle = '#c9956e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    rrp(ctx, M + 5, M + 5, W - M * 2 - 10, H - M * 2 - 10, 9);
    ctx.strokeStyle = 'rgba(201,149,110,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    cornerFlourish(ctx, M + 3, M + 3, W - M * 2 - 6, H - M * 2 - 6, 20, '#c9956e');

    const sp = '#f8a4c0',
        sl = '#fcc8d8',
        sd = '#e87098';
    sakura(ctx, 44, 44, 26, sl, 0.18);
    sakura(ctx, W - 46, 38, 20, sp, 0.14);
    sakura(ctx, 36, H - 44, 22, sp, 0.16);
    sakura(ctx, W - 44, H - 46, 24, sl, 0.14);
    [
        [W * 0.76, H * 0.10, 7, 0.3, sp],
        [W * 0.12, H * 0.22, 5, 0.8, sl],
        [W * 0.88, H * 0.52, 8, 1.1, sp],
        [W * 0.09, H * 0.70, 6, 0.2, sd],
        [W * 0.70, H * 0.90, 7, 1.5, sl],
        [W * 0.92, H * 0.28, 6, 1.8, sd]
    ].forEach(([px, py, pr, pa, pc]) => petal(ctx, px, py, pr, pa, pc, 0.55));

    diamondRow(ctx, W / 2, M + 20, 11, 24, 5, '#c9956e');

    ctx.font = 'bold 13px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center';
    ctx.fillText('\u2736 BANK INFO \u2736', W / 2, M + 42);

    ctx.strokeStyle = 'rgba(201,149,110,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, M + 50);
    ctx.lineTo(W - M - 24, M + 50);
    ctx.stroke();

    const AX = M + 34 + 58,
        AY = M + 50 + 78,
        AR = 58;

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

    const av = await safeLoadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(AX, AY, AR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(av, AX - AR, AY - AR, AR * 2, AR * 2);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(AX, AY, AR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i + Math.PI / 4;
        sakura(ctx, AX + (AR + 6) * Math.cos(angle), AY + (AR + 6) * Math.sin(angle), 7, sp, 0.9);
    }

    const statusColors = {
        'Owner': '#9a6200',
        'Premium': '#7a3a8a',
        'Elite': '#2a6a4a',
        'Free': '#4a5a6a',
    };
    const sColor = statusColors[data.statusKey] || '#4a5a6a';
    const sBg = sColor + '20';
    const sBdr = sColor + '88';

    const INFO_X = AX + AR + 28;
    const INFO_Y = AY - AR + 10;

    ctx.font = 'bold 26px SFBold';
    ctx.fillStyle = '#4a1e0a';
    ctx.shadowColor = 'rgba(201,149,110,0.3)';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'left';
    ctx.fillText(data.name.slice(0, 20), INFO_X, INFO_Y + 28);
    ctx.shadowBlur = 0;

    const pillTxt = data.status;
    ctx.font = 'bold 11px SFBold';
    const pillW2 = ctx.measureText(pillTxt).width + 24;
    rrp(ctx, INFO_X, INFO_Y + 36, pillW2, 22, 11);
    ctx.fillStyle = sBg;
    ctx.fill();
    ctx.strokeStyle = sBdr;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.fillStyle = sColor;
    ctx.fillText(pillTxt, INFO_X + 12, INFO_Y + 51);

    ctx.font = '10px SFRegular';
    ctx.fillStyle = '#9b6a43';
    ctx.fillText('Registered  :  ' + (data.registered ? 'Ya' : 'Belum'), INFO_X, INFO_Y + 80);
    ctx.fillText('Level  :  ' + (data.level || 0), INFO_X, INFO_Y + 96);

    const divY = AY + AR + 20;
    ctx.strokeStyle = 'rgba(201,149,110,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, divY);
    ctx.lineTo(W - M - 24, divY);
    ctx.stroke();

    diamondRow(ctx, W / 2, divY + 6, 9, 22, 4, '#c9956e');

    const cards = [{
            emoji: '💰',
            label: 'Dompet',
            value: toRupiah(data.money)
        },
        {
            emoji: '🏦',
            label: 'Bank',
            value: toRupiah(data.bank) + ' / ' + toRupiah(data.fullatm)
        },
        {
            emoji: '💳',
            label: 'ATM',
            value: data.atm > 0 ? 'Lv. ' + data.atm : '—'
        },
        {
            emoji: '♋',
            label: 'Chip',
            value: toRupiah(data.chip)
        },
        {
            emoji: '🤖',
            label: 'Robo',
            value: data.robo > 0 ? 'Lv. ' + data.robo : '—'
        },
    ];

    const CARD_Y = divY + 20;
    const CARD_H = 66;
    const COLS = 3;
    const CARD_W = Math.floor((W - (M + 14) * 2 - (COLS - 1) * 8) / COLS);
    const CARD_GAP = 8;

    cards.forEach((card, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const cx = M + 14 + col * (CARD_W + CARD_GAP);
        const cy = CARD_Y + row * (CARD_H + 8);

        rrp(ctx, cx, cy, CARD_W, CARD_H, 10);
        const cg = ctx.createLinearGradient(cx, cy, cx + CARD_W, cy + CARD_H);
        cg.addColorStop(0, 'rgba(201,149,110,0.10)');
        cg.addColorStop(1, 'rgba(201,149,110,0.04)');
        ctx.fillStyle = cg;
        ctx.fill();
        ctx.strokeStyle = 'rgba(201,149,110,0.40)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        rrp(ctx, cx, cy + 12, 3, CARD_H - 24, 2);
        ctx.fillStyle = '#c9956e';
        ctx.fill();

        ctx.font = '20px NotoEmoji';
        ctx.fillStyle = '#3c2818';
        ctx.textAlign = 'left';
        ctx.fillText(card.emoji, cx + 12, cy + 28);

        ctx.font = '9px SFMedium';
        ctx.fillStyle = '#9b6a43';
        ctx.fillText(card.label.toUpperCase(), cx + 12, cy + 44);

        const cardVal = String(card.value)
        const cardMaxW = CARD_W - 24
        ctx.fillStyle = '#3c2818';
        const cardFontSize = ctx.measureText(cardVal).width > cardMaxW ? 10 : 13
        ctx.font = `bold ${cardFontSize}px SFBold`;
        ctx.fillText(cardVal, cx + 12, cy + 58, cardMaxW);
    });

    const footY = CARD_Y + Math.ceil(cards.length / COLS) * (CARD_H + 8) + 6;
    ctx.strokeStyle = 'rgba(201,149,110,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, footY);
    ctx.lineTo(W - M - 24, footY);
    ctx.stroke();

    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(154,100,60,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`${global.botname || 'Bot'}  \u00b7  ${new Date().toLocaleString('id-ID')} WIB`, W / 2, footY + 14);

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    });
}

let handler = async (m, {
    conn
}) => {
    const who = m.mentionedJid?.[0] || (m.fromMe ? conn.user.jid : m.sender);
    const user = global.db.data.users[who];
    if (typeof user === 'undefined') return m.reply('User tidak ada di database');

    const isOwner = m.fromMe || (global.owner || [])
        .map(v => (Array.isArray(v) ? v[0] : v).replace(/[^0-9]/g, '') + '@s.whatsapp.net')
        .includes(who);
    const isPrem = isOwner || new Date() - user.premiumTime < 0;

    const statusKey = isOwner ? 'Owner' : isPrem ? 'Premium' : user.level > 999 ? 'Elite' : 'Free';
    const statusLabel = isOwner ? '\u2605 Owner' : isPrem ? '\u2728 Premium' : user.level > 999 ? '\u26a1 Elite' : '\ud83d\udd30 Free';

    const name = user.registered ? user.name : conn.getName(who);
    const avatarURL = await conn.profilePictureUrl(who, 'image')
        .catch(() => 'src/avatar_contact.png');

    await global.loading(m, conn);
    try {
        const img = await generateBankCard(avatarURL, {
            name,
            status: statusLabel,
            statusKey,
            registered: user.registered,
            level: user.level || 0,
            atm: user.atm || 0,
            bank: user.bank || 0,
            fullatm: user.fullatm || 0,
            money: user.money || 0,
            chip: user.chip || 0,
            robo: user.robo || 0,
        });

        await conn.sendFile(m.chat, img, 'bank.jpg', '', m);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['bank'];
handler.tags = ['rpg'];
handler.command = /^(bank)$/i;
handler.register = true;
handler.group = true;
handler.rpg = true;

export default handler;