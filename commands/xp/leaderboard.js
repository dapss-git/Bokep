import fs from 'fs';
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

async function safeAvatar(url) {
    try {
        const r = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        if (!r.ok) throw new Error();
        return await loadImage(Buffer.from(await r.arrayBuffer()));
    } catch {
        try {
            return await loadImage(fs.readFileSync('./src/avatar_contact.png'));
        } catch {
            const c = createCanvas(80, 80);
            const g = c.getContext('2d');
            g.fillStyle = '#e8d5c4';
            g.beginPath();
            g.arc(40, 40, 40, 0, Math.PI * 2);
            g.fill();
            g.fillStyle = '#c9956e';
            g.font = 'bold 28px sans-serif';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText('?', 40, 40);
            return await loadImage(c.toBuffer('image/png'));
        }
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

function drawBase(ctx, W, H) {
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
    sakura(ctx, 44, 44, 24, sl, 0.18);
    sakura(ctx, W - 46, 38, 18, sp, 0.14);
    sakura(ctx, 36, H - 44, 20, sp, 0.16);
    sakura(ctx, W - 44, H - 46, 22, sl, 0.14);
    [
        [W * 0.76, H * 0.10, 7, 0.3, sp],
        [W * 0.12, H * 0.22, 5, 0.8, sl],
        [W * 0.88, H * 0.55, 8, 1.1, sp],
        [W * 0.08, H * 0.72, 6, 0.2, sd],
        [W * 0.70, H * 0.90, 7, 1.5, sl],
        [W * 0.92, H * 0.28, 6, 1.8, sd]
    ].forEach(([px, py, pr, pa, pc]) => petal(ctx, px, py, pr, pa, pc, 0.55));
}

async function canvasHelp(usedPrefix, command, leaderboards) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'NotoEmoji');

    const COLS = 3;
    const ITEM_H = 30,
        ITEM_GAP = 6;
    const rows = Math.ceil(leaderboards.length / COLS);
    const W = 680;
    const M = 18;
    const HEADER_H = 120;
    const GRID_H = rows * (ITEM_H + ITEM_GAP) + 24;
    const FOOTER_H = 34;
    const H = HEADER_H + GRID_H + FOOTER_H;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    drawBase(ctx, W, H);

    diamondRow(ctx, W / 2, M + 20, 11, 24, 5, '#c9956e');

    ctx.font = 'bold 13px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center';
    ctx.fillText('\u2736 LEADERBOARD \u2736', W / 2, M + 42);

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
    ctx.fillText(global.botname || 'Bot', W / 2, M + 78);
    ctx.shadowBlur = 0;

    const TIP_Y = M + 88;
    ctx.font = '10px SFRegular';
    ctx.fillStyle = '#9b6a43';
    ctx.fillText(`${usedPrefix}${command} [type]  \u00b7  contoh: ${usedPrefix}${command} legendary`, W / 2, TIP_Y);

    diamondRow(ctx, W / 2, TIP_Y + 10, 7, 20, 3, '#c9956e');

    const GRID_Y = HEADER_H;
    const colW = Math.floor((W - (M + 14) * 2 - (COLS - 1) * 8) / COLS);

    leaderboards.forEach((item, idx) => {
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        const ix = M + 14 + col * (colW + 8);
        const iy = GRID_Y + 14 + row * (ITEM_H + ITEM_GAP);

        rrp(ctx, ix, iy, colW, ITEM_H, 7);
        ctx.fillStyle = row % 2 === 0 ? 'rgba(201,149,110,0.08)' : 'rgba(201,149,110,0.04)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(201,149,110,0.30)';
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

    const footY = GRID_Y + 14 + rows * (ITEM_H + ITEM_GAP) + 6;
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

async function canvasLeaderboard(type, emot, entries, myRank, myTotal) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'NotoEmoji');

    const W = 680;
    const M = 18;
    const HEADER_H = 130;
    const ROW_H = 72,
        ROW_GAP = 8;
    const FOOTER_H = 52;
    const H = HEADER_H + entries.length * (ROW_H + ROW_GAP) + FOOTER_H;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    drawBase(ctx, W, H);

    diamondRow(ctx, W / 2, M + 20, 11, 24, 5, '#c9956e');

    ctx.font = 'bold 13px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center';
    ctx.fillText('\u2736 LEADERBOARD \u2736', W / 2, M + 42);

    ctx.strokeStyle = 'rgba(201,149,110,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, M + 50);
    ctx.lineTo(W - M - 24, M + 50);
    ctx.stroke();

    const BADGE_Y = M + 57;
    ctx.font = '20px NotoEmoji';
    ctx.fillText(emot, W / 2 - ctx.measureText(emot).width / 2 - 40, BADGE_Y + 24);

    ctx.font = 'bold 26px SFBold';
    ctx.fillStyle = '#4a1e0a';
    ctx.shadowColor = 'rgba(201,149,110,0.3)';
    ctx.shadowBlur = 6;
    ctx.fillText(type.toUpperCase(), W / 2 + 10, BADGE_Y + 28);
    ctx.shadowBlur = 0;

    rrp(ctx, M + 14, BADGE_Y + 36, W - (M + 14) * 2, 22, 11);
    ctx.fillStyle = 'rgba(201,149,110,0.10)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,149,110,0.40)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '10px SFMedium';
    ctx.fillStyle = '#7a3e1a';
    ctx.fillText(`Rank kamu: #${toRupiah(myRank)} dari ${toRupiah(myTotal)} pengguna`, W / 2, BADGE_Y + 51);

    diamondRow(ctx, W / 2, BADGE_Y + 64, 7, 20, 3, '#c9956e');

    const rankColors = ['#b07820', '#8a8a8a', '#7a3a0a', '#4a5a6a', '#4a5a6a'];
    const rankBg = ['rgba(176,120,32,0.12)', 'rgba(138,138,138,0.10)', 'rgba(122,58,10,0.10)',
        'rgba(74,90,106,0.07)', 'rgba(74,90,106,0.07)'
    ];
    const rankLabels = ['🥇', '🥈', '🥉', '#4', '#5'];

    let rowY = HEADER_H;
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const rc = rankColors[i] || '#4a5a6a';
        const rb = rankBg[i] || 'rgba(74,90,106,0.07)';

        rrp(ctx, M + 14, rowY, W - (M + 14) * 2, ROW_H, 12);
        ctx.fillStyle = rb;
        ctx.fill();
        ctx.strokeStyle = rc + '66';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        rrp(ctx, M + 14, rowY + 10, 4, ROW_H - 20, 2);
        ctx.fillStyle = rc;
        ctx.fill();

        const isEmoji = i < 3;
        ctx.font = isEmoji ? '20px NotoEmoji' : 'bold 13px SFBold';
        ctx.textAlign = 'left';
        ctx.fillStyle = rc;
        ctx.fillText(rankLabels[i] || (i + 1) + '.', M + 24, rowY + ROW_H / 2 + (isEmoji ? 8 : 5));

        const AV_R = 24;
        const AV_X = M + 72;
        const AV_Y = rowY + ROW_H / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(AV_X, AV_Y, AV_R + 2, 0, Math.PI * 2);
        ctx.strokeStyle = rc + 'aa';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(AV_X, AV_Y, AV_R, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(e.avatar, AV_X - AV_R, AV_Y - AV_R, AV_R * 2, AV_R * 2);
        ctx.restore();

        const TEXT_X = AV_X + AV_R + 16;

        ctx.font = 'bold 14px SFBold';
        ctx.fillStyle = '#3c2818';
        ctx.textAlign = 'left';
        ctx.fillText(String(e.name).slice(0, 24), TEXT_X, rowY + ROW_H / 2 - 4);

        ctx.font = '10px SFMedium';
        ctx.fillStyle = '#9b6a43';
        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + ':';
        ctx.fillText(typeLabel, TEXT_X, rowY + ROW_H / 2 + 13);

        ctx.save();
        ctx.font = 'bold 15px SFBold';
        ctx.fillStyle = rc;
        ctx.shadowColor = rc + '88';
        ctx.shadowBlur = 6;
        ctx.fillText(toRupiah(e.score), TEXT_X + 70, rowY + ROW_H / 2 + 13);
        ctx.restore();

        const sameGroup = e.inGroup ? '\u2022 Grup ini' : '\u2022 Grup lain';
        ctx.font = '9px SFRegular';
        ctx.fillStyle = e.inGroup ? '#2a8a2a' : '#aaaaaa';
        ctx.fillText(sameGroup, W - M - 14 - ctx.measureText(sameGroup).width - 10, rowY + ROW_H / 2 + 13);

        rowY += ROW_H + ROW_GAP;
    }

    const footY = rowY + 6;
    ctx.strokeStyle = 'rgba(201,149,110,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, footY);
    ctx.lineTo(W - M - 24, footY);
    ctx.stroke();

    diamondRow(ctx, W / 2, footY + 8, 7, 20, 3, '#c9956e');

    ctx.font = '9px SFRegular';
    ctx.fillStyle = 'rgba(154,100,60,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`${global.botname || 'Bot'}  \u00b7  ${new Date().toLocaleString('id-ID')} WIB`, W / 2, footY + 26);

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    });
}

const leaderboards = [
    'atm', 'level', 'exp', 'money', 'iron', 'gold', 'diamond', 'emerald',
    'trash', 'potion', 'wood', 'rock', 'string', 'umpan', 'petfood',
    'common', 'uncommon', 'mythic', 'legendary', 'pet', 'bank', 'chip',
    'skata', 'donasi', 'deposit', 'garam', 'minyak', 'gandum', 'steak',
    'ayam_goreng', 'ribs', 'roti', 'udang_goreng', 'bacon'
];
leaderboards.sort((a, b) => a.localeCompare(b));

const toRupiah = n => parseInt(n).toLocaleString().replace(/,/g, '.');

function sort(property) {
    return (...args) => args[1][property] - args[0][property];
}

function isNumber(x) {
    if (!x) return false;
    x = parseInt(x);
    return typeof x === 'number' && !isNaN(x);
}

function isInGroup(jid, metadata) {
    if (!metadata || !metadata.participants) return false;
    const num = jid.replace(/@.+/, '').replace(/:\d+$/, '');
    return metadata.participants.some(p => {
        const pNum = (p.id || '').replace(/@.+/, '').replace(/:\d+$/, '');
        return pNum === num;
    });
}

let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    const users = Object.entries(global.db.data.users).map(([jid, v]) => ({
        ...v,
        jid
    }));
    const leaderboard = leaderboards.filter(v => v && users.some(u => u && u[v]));
    const type = (args[0] || '').toLowerCase();

    if (!leaderboard.includes(type)) {
        const img = await canvasHelp(usedPrefix, command, leaderboard);
        return conn.sendMessage(m.chat, {
            image: img,
            caption: `Gunakan: *${usedPrefix}${command} [type]*\nContoh: *${usedPrefix}${command} legendary*`
        }, {
            quoted: m
        });
    }

    const emot = global.rpg ? global.rpg.emoticon(type) : '';
    const sorted = [...users]
        .map(u => ({
            ...u,
            [type]: u[type] === undefined ? 0 : u[type]
        }))
        .sort(sort(type));

    const myRank = sorted.findIndex(u => u.jid === m.sender) + 1;
    const myTotal = sorted.filter(u => u[type] > 0).length;

    const metadata = m.isGroup ? (m.metadata || await conn.groupMetadata(m.chat).catch(() => null)) : null;

    const pp = who => conn.profilePictureUrl(who, 'image').catch(() => 'src/avatar_contact.png');

    const top5 = await Promise.all(sorted.slice(0, 5).map(async (user, i) => ({
        rank: i + 1,
        name: user.registered ? user.name : conn.getName(user.jid),
        score: parseInt(user[type]) || 0,
        avatar: await safeAvatar(await pp(user.jid)),
        jid: user.jid,
        inGroup: isInGroup(user.jid, metadata),
    })));

    const img = await canvasLeaderboard(type, emot, top5, myRank || myTotal + 1, myTotal);

    const text = sortedText(type, top5, myRank || myTotal + 1, myTotal, toRupiah);
    await conn.sendFile(m.chat, img, 'leaderboard.jpg', text, m, false, {
        contextInfo: {
            mentionedJid: conn.parseMention(text)
        }
    });
};

function sortedText(type, top5, myRank, myTotal, toRupiah) {
    return [
        `\u{1F3C6} Rank: *#${toRupiah(myRank)}* dari ${toRupiah(myTotal)} pengguna`,
        ``,
        `*\u2022 ${global.rpg ? global.rpg.emoticon(type) : ''} ${type} \u2022*`,
        ``,
        ...top5.map((u, i) =>
            `${i + 1}. *${toRupiah(u.score)}* - ${u.name} ${u.inGroup ? '' : '_(luar grup)_'}\nwa.me/${u.jid.split('@')[0]}`
        )
    ].join('\n');
}

handler.help = ['leaderboard'];
handler.tags = ['xp'];
handler.command = /^(leaderboard|lb)$/i;
handler.register = true;
handler.group = true;
handler.rpg = true;

export default handler;