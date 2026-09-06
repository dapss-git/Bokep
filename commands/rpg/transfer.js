import {
    createCanvas,
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

function drawBase(ctx, W, H) {
    const bgG = ctx.createLinearGradient(0, 0, W, H);
    bgG.addColorStop(0, '#fdf8f0');
    bgG.addColorStop(0.45, '#fef9f2');
    bgG.addColorStop(1, '#faf3e8');
    ctx.fillStyle = bgG;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 600; i++) {
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

    const M = 18;
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
        [W * 0.88, H * 0.55, 8, 1.1, sp],
        [W * 0.08, H * 0.70, 6, 0.2, sd],
        [W * 0.68, H * 0.90, 7, 1.5, sl],
        [W * 0.92, H * 0.28, 6, 1.8, sd]
    ].forEach(([px, py, pr, pa, pc]) => petal(ctx, px, py, pr, pa, pc, 0.55));
}

async function canvasHelp(usedPrefix, command, items, toName) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'NotoEmoji');

    const COLS = 3;
    const ITEM_H = 30,
        ITEM_GAP = 6;
    const rows = Math.ceil(items.length / COLS);
    const W = 680;
    const HEADER_H = 130;
    const EXAMPLE_H = 68;
    const GRID_H = rows * (ITEM_H + ITEM_GAP) + 10;
    const FOOTER_H = 36;
    const H = HEADER_H + EXAMPLE_H + GRID_H + FOOTER_H + 10;
    const M = 18;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    drawBase(ctx, W, H);

    diamondRow(ctx, W / 2, M + 20, 11, 24, 5, '#c9956e');

    ctx.font = 'bold 14px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center';
    ctx.fillText('\u2736 TRANSFER ITEM \u2736', W / 2, M + 42);

    ctx.strokeStyle = 'rgba(201,149,110,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, M + 50);
    ctx.lineTo(W - M - 24, M + 50);
    ctx.stroke();

    ctx.font = 'bold 22px SFBold';
    ctx.fillStyle = '#4a1e0a';
    ctx.shadowColor = 'rgba(201,149,110,0.3)';
    ctx.shadowBlur = 6;
    ctx.fillText(global.botname || 'Bot', W / 2, M + 75);
    ctx.shadowBlur = 0;

    diamondRow(ctx, W / 2, M + 86, 7, 20, 4, '#c9956e');

    const EX_BOX_H = 58;
    const EX_Y = HEADER_H;
    rrp(ctx, M + 10, EX_Y, W - (M + 10) * 2, EX_BOX_H, 10);
    ctx.fillStyle = 'rgba(201,149,110,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,149,110,0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = '9px SFMedium';
    ctx.fillStyle = '#9b6a43';
    ctx.textAlign = 'left';
    ctx.fillText('FORMAT', M + 22, EX_Y + 14);
    ctx.font = 'bold 12px SFBold';
    ctx.fillStyle = '#3c2818';
    ctx.fillText(`${usedPrefix}${command} [type] [jumlah] @user`, M + 22, EX_Y + 30);

    ctx.font = '10px SFRegular';
    ctx.fillStyle = '#b08060';
    ctx.fillText(`contoh: ${usedPrefix}${command} money 9999 @${toName}`, M + 22, EX_Y + 48);

    const GRID_Y = EX_Y + EXAMPLE_H + 8;

    ctx.font = '10px SFMedium';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center';
    ctx.fillText('\u2731 Item yang bisa ditransfer', W / 2, GRID_Y);

    ctx.strokeStyle = 'rgba(201,149,110,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, GRID_Y + 6);
    ctx.lineTo(W - M - 24, GRID_Y + 6);
    ctx.stroke();

    const colW = Math.floor((W - (M + 14) * 2 - 10) / COLS);
    items.forEach((item, idx) => {
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        const ix = M + 14 + col * (colW + 5);
        const iy = GRID_Y + 14 + row * (ITEM_H + ITEM_GAP);

        rrp(ctx, ix, iy, colW, ITEM_H, 7);
        ctx.fillStyle = row % 2 === 0 ? 'rgba(201,149,110,0.07)' : 'rgba(201,149,110,0.04)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(201,149,110,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const emot = global.rpg ? global.rpg.emoticon(item) : '';
        ctx.font = '15px NotoEmoji';
        ctx.fillStyle = '#3c2818';
        ctx.textAlign = 'left';
        ctx.fillText(emot, ix + 8, iy + ITEM_H / 2 + 6);

        ctx.font = '11px SFBold';
        ctx.fillStyle = '#4a1e0a';
        ctx.fillText(item, ix + 30, iy + ITEM_H / 2 + 5);
    });

    const footY = GRID_Y + 14 + rows * (ITEM_H + ITEM_GAP) + 8;
    ctx.strokeStyle = 'rgba(201,149,110,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, footY);
    ctx.lineTo(W - M - 24, footY);
    ctx.stroke();

    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(154,100,60,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`${global.botname || 'Bot'}  \u00b7  ${new Date().toLocaleString('id-ID')} WIB`, W / 2, footY + 16);

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    });
}

async function canvasResult(success, type, emot, count, toName, fromName) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'NotoEmoji');

    const W = 580,
        H = 340;
    const M = 18;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    drawBase(ctx, W, H);

    diamondRow(ctx, W / 2, M + 20, 9, 22, 5, '#c9956e');

    ctx.font = 'bold 13px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center';
    ctx.fillText('\u2736 TRANSFER \u2736', W / 2, M + 42);

    ctx.strokeStyle = 'rgba(201,149,110,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, M + 50);
    ctx.lineTo(W - M - 24, M + 50);
    ctx.stroke();

    const statusColor = success ? '#2a8a2a' : '#c03030';
    const statusBg = success ? '#d8f0d8' : '#fcd8d8';
    const statusBdr = success ? '#60c060' : '#e06060';
    const statusLabel = success ? '\u2705 SUCCESS' : '\u274c FAILED';

    rrp(ctx, W / 2 - 72, M + 58, 144, 36, 18);
    ctx.fillStyle = statusBg;
    ctx.fill();
    ctx.strokeStyle = statusBdr;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = statusColor + '66';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = 'bold 14px NotoEmoji, SFBold';
    ctx.fillStyle = statusColor;
    ctx.textAlign = 'center';
    ctx.fillText(statusLabel, W / 2, M + 82);

    diamondRow(ctx, W / 2, M + 100, 5, 18, 3, '#c9956e');

    const rows = [
        ['\ud83d\uddc2\ufe0f', 'Tipe', `${type}${(['common','uncommon','mythic','legendary','pet'].includes(type) ? ' Crate' : '')} ${emot}`],
        ['\ud83e\uddee', 'Jumlah', parseInt(count).toLocaleString().replace(/,/g, '.')],
        ['\ud83d\udce8', 'Dari', fromName],
        ['\ud83d\udce9', 'Kepada', toName],
    ];

    const ROW_H = 40,
        ROW_GAP = 6;
    const rowX = M + 16,
        rowW = W - (M + 16) * 2;
    let ry = M + 112;

    rows.forEach(([icon, label, value], i) => {
        rrp(ctx, rowX, ry, rowW, ROW_H, 8);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(201,149,110,0.09)' : 'rgba(201,149,110,0.04)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(201,149,110,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '15px NotoEmoji';
        ctx.fillStyle = '#9b6a43';
        ctx.textAlign = 'left';
        ctx.fillText(icon, rowX + 10, ry + ROW_H / 2 + 6);

        ctx.font = '10px SFMedium';
        ctx.fillStyle = '#9b6a43';
        ctx.fillText(label, rowX + 34, ry + ROW_H / 2 - 4);

        ctx.font = 'bold 12px NotoEmoji, SFBold';
        ctx.fillStyle = '#3c2818';
        ctx.fillText(String(value).slice(0, 32), rowX + 34, ry + ROW_H / 2 + 10);

        ry += ROW_H + ROW_GAP;
    });

    ry += 4;
    ctx.strokeStyle = 'rgba(201,149,110,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, ry);
    ctx.lineTo(W - M - 24, ry);
    ctx.stroke();

    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(154,100,60,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`${global.botname || 'Bot'}  \u00b7  ${new Date().toLocaleString('id-ID')} WIB`, W / 2, ry + 16);

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    });
}

const items = [
    'money', 'bank', 'potion', 'trash', 'wood',
    'rock', 'string', 'petfood', 'emerald',
    'diamond', 'gold', 'iron', 'common',
    'uncommon', 'mythic', 'legendary', 'pet', 'chip',
    'anggur', 'apel', 'jeruk', 'mangga', 'pisang',
    'bibitanggur', 'bibitapel', 'bibitjeruk', 'bibitmangga', 'bibitpisang',
];

const toRupiah = n => parseInt(n).toLocaleString().replace(/,/g, '.');

function special(type) {
    return ['common', 'uncommon', 'mythic', 'legendary', 'pet'].includes(type.toLowerCase()) ? ' Crate' : '';
}

function isNumber(x) {
    return !isNaN(x);
}

let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    const user = global.db.data.users[m.sender];
    const item = items.filter(v => v in user && typeof user[v] === 'number');

    const type = (args[0] || '').toLowerCase();
    const toName = m.sender.split('@')[0];

    if (!item.includes(type)) {
        const img = await canvasHelp(usedPrefix, command, item, toName);
        return conn.sendMessage(m.chat, {
            image: img,
            caption: `Gunakan format: *${usedPrefix}${command} [type] [jumlah] @user*`,
            mentions: [m.sender]
        }, {
            quoted: m
        });
    }

    const count = Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, isNumber(args[1]) ? parseInt(args[1]) : 1));
    const who = m.mentionedJid && m.mentionedJid[0] ?
        m.mentionedJid[0] :
        args[2] ? (args[2].replace(/[@ .+-]/g, '') + '@s.whatsapp.net') : '';

    if (!who) return m.reply('Tag salah satu, atau ketik nomernya!!');

    const _user = global.db.data.users[who];
    if (!(who in global.db.data.users)) return m.reply(`User ${who} tidak ada di database`);
    if (user[type] * 1 < count) return m.reply(`*${type + special(type)} ${global.rpg.emoticon(type)}* kamu kurang *${toRupiah(count - user[type])}*`);
    if (/money/i.test(type) && _user[type] * 1 > 99999998)
        return m.reply(`${type}${global.rpg.emoticon(type)} @${who.split('@')[0]} sudah limit`, false, {
            mentions: [who]
        });

    const emot = global.rpg ? global.rpg.emoticon(type) : '';
    const fromName = user.name || m.sender.split('@')[0];
    const recipientName = _user.name || who.split('@')[0];

    const previous = user[type] * 1;
    const _previous = _user[type] * 1;
    user[type] -= count;
    _user[type] += count;

    const success = previous > user[type] * 1 && _previous < _user[type] * 1;

    if (!success) {
        user[type] = previous;
        _user[type] = _previous;
    }

    const img = await canvasResult(success, type, emot, count, recipientName, fromName);
    await conn.sendMessage(m.chat, {
        image: img,
        caption: success ?
            `\u2705 Transfer *${toRupiah(count)} ${type + special(type)} ${emot}* ke @${who.split('@')[0]} berhasil!` :
            `\u274c Transfer gagal.`,
        mentions: [who]
    }, {
        quoted: m
    });
};

handler.help = ['transfer'];
handler.tags = ['rpg'];
handler.command = /^(transfer|tf)$/i;
handler.register = true;
handler.group = true;
handler.rpg = true;

export default handler;