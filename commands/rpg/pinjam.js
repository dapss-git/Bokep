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

// ─── Loan Card Canvas ───────────────────────────────────────────
async function canvasLoan(type, data) {
    await lf('SFPRODISPLAYBOLD.OTF', 'SFBold');
    await lf('SFPRODISPLAYMEDIUM.OTF', 'SFMedium');
    await lf('SFPRODISPLAYREGULAR.OTF', 'SFRegular');
    await lf('NotoColorEmoji-Regular.ttf', 'NotoEmoji');

    const W = 620,
        H = 380;
    const M = 18;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    drawBase(ctx, W, H);

    // Header
    diamondRow(ctx, W / 2, M + 20, 11, 24, 5, '#c9956e');
    ctx.font = 'bold 14px SFBold';
    ctx.fillStyle = '#7a3e1a';
    ctx.textAlign = 'center';

    const titles = {
        pinjam: '💸 PINJAMAN BARU 💸',
        bayar: '✅ BAYAR PINJAMAN ✅',
        status: '📋 STATUS PINJAMAN 📋',
        lunas: '🎉 PINJAMAN LUNAS 🎉',
    };
    ctx.fillText(titles[type] || '📄 PINJAMAN 📄', W / 2, M + 42);

    ctx.strokeStyle = 'rgba(201,149,110,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 24, M + 50);
    ctx.lineTo(W - M - 24, M + 50);
    ctx.stroke();

    // Progress bar (for status/bayar)
    let startY = M + 64;

    if (type === 'status' || type === 'bayar' || type === 'lunas') {
        const pct = Math.min(1, data.sudahBayar / data.totalTagihan);
        const barW = W - (M + 24) * 2;
        const barH = 14;
        const barX = M + 24;
        const barY = startY;

        rrp(ctx, barX, barY, barW, barH, 7);
        ctx.fillStyle = 'rgba(201,149,110,0.18)';
        ctx.fill();

        if (pct > 0) {
            rrp(ctx, barX, barY, barW * pct, barH, 7);
            const pg = ctx.createLinearGradient(barX, barY, barX + barW, barY);
            pg.addColorStop(0, '#e87050');
            pg.addColorStop(1, '#c9956e');
            ctx.fillStyle = pg;
            ctx.fill();
        }

        ctx.font = 'bold 9px SFBold';
        ctx.fillStyle = '#7a3e1a';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(pct * 100)}% Terbayar`, W / 2, barY + barH + 12);
        startY = barY + barH + 24;
    }

    // Info rows
    const rows = data.rows || [];
    const ROW_H = 38,
        ROW_GAP = 6;
    const rowX = M + 12,
        rowW = W - (M + 12) * 2;
    let ry = startY;

    rows.forEach(([icon, label, value, highlight], i) => {
        rrp(ctx, rowX, ry, rowW, ROW_H, 8);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(201,149,110,0.09)' : 'rgba(201,149,110,0.04)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(201,149,110,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // accent bar
        rrp(ctx, rowX, ry + 8, 3, ROW_H - 16, 2);
        ctx.fillStyle = highlight ? '#e87050' : '#c9956e';
        ctx.fill();

        ctx.font = '16px NotoEmoji';
        ctx.fillStyle = '#3c2818';
        ctx.textAlign = 'left';
        ctx.fillText(icon, rowX + 10, ry + ROW_H / 2 + 6);

        ctx.font = '9px SFMedium';
        ctx.fillStyle = '#9b6a43';
        ctx.fillText(label.toUpperCase(), rowX + 34, ry + ROW_H / 2 - 4);

        ctx.font = `bold 12px SFBold`;
        ctx.fillStyle = highlight ? '#c03030' : '#3c2818';
        ctx.fillText(String(value).slice(0, 38), rowX + 34, ry + ROW_H / 2 + 10);

        ry += ROW_H + ROW_GAP;
    });

    // Footer
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
    ctx.fillText(`${global.botname || 'Bot'}  ·  ${new Date().toLocaleString('id-ID')} WIB`, W / 2, ry + 14);

    return canvas.toBuffer('image/jpeg', {
        quality: 95
    });
}

// ─── Constants ─────────────────────────────────────────────────
const BUNGA = 0.05; // 5% bunga per pinjaman
const MAX_PINJAM_LEVEL = [ // [level_min, max_pinjaman]
    [0, 500_000],
    [10, 2_000_000],
    [25, 5_000_000],
    [50, 10_000_000],
    [100, 25_000_000],
    [200, 50_000_000],
    [500, 100_000_000],
];
const COOLDOWN_PINJAM = 24 * 60 * 60 * 1000; // 24 jam setelah lunas

const toRupiah = n => parseInt(n).toLocaleString().replace(/,/g, '.');

function getMaxPinjam(level) {
    let max = MAX_PINJAM_LEVEL[0][1];
    for (const [lv, amt] of MAX_PINJAM_LEVEL) {
        if (level >= lv) max = amt;
        else break;
    }
    return max;
}

function initLoan(user) {
    if (!user.loan) user.loan = {
        active: false,
        jumlah: 0,
        totalTagihan: 0,
        sudahBayar: 0,
        sisaTagihan: 0,
        tanggalPinjam: 0,
        deadlineBayar: 0,
        lastLunas: 0,
        riwayat: []
    };
    return user.loan;
}


let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    const user = global.db.data.users[m.sender];
    const loan = initLoan(user);

    // Cek apakah ada pinjaman aktif yang sudah lewat deadline (denda)
    if (loan.active && loan.deadlineBayar && Date.now() > loan.deadlineBayar) {
        const telat = Math.floor((Date.now() - loan.deadlineBayar) / (24 * 60 * 60 * 1000));
        const denda = Math.floor(loan.sisaTagihan * 0.02 * Math.min(telat, 30)); // max 60% denda
        if (denda > 0 && !loan.dendaDitambah) {
            loan.sisaTagihan += denda;
            loan.totalTagihan += denda;
            loan.dendaDitambah = true;
        }
    }

    if (/^pinjam$/i.test(command)) {

        // Deteksi apakah ada tag/nomor → mode REQUEST pinjam ke user lain (borrower minta ke lender)
        const tagWho = m.mentionedJid?.[0] ||
            (args.find(a => /^[0-9]{5,15}$/.test(a.replace(/[@ +-]/g, ''))) ?
                args.find(a => /^[0-9]{5,15}$/.test(a.replace(/[@ +-]/g, ''))).replace(/[@ +-]/g, '') + '@s.whatsapp.net' :
                null);


        if (tagWho) {
            // Mode: borrower langsung pinjam dari lender (pull — inisiasi dari borrower)
            if (tagWho === m.sender) return m.reply('❌ Tidak bisa pinjam dari diri sendiri!');

            const lenderUser = global.db.data.users[tagWho];
            if (!lenderUser) return m.reply('❌ User tersebut tidak ada di database.');

            // jumlah bisa di arg pertama atau kedua (setelah @mention) — exclude nomor HP target
            const lenderNum = tagWho.replace('@s.whatsapp.net', '');
            const jumlahArg = args.find(a => /^[0-9]+$/.test(a) && a.replace(/[@ +-]/g, '') !== lenderNum);
            const jumlah = jumlahArg ? parseInt(jumlahArg) : 0;

            if (!jumlah || jumlah < 1000)
                return m.reply(
                    `╭─❁ 💸 ᴘɪɴᴊᴀᴍ ᴅᴀʀɪ ᴜꜱᴇʀ ❁\n` +
                    `◦❒ Format: *${usedPrefix}pinjam @lender [jumlah]*\n` +
                    `◦❒ Contoh: *${usedPrefix}pinjam @Andi 500000*\n` +
                    `◦❒ Atau: *${usedPrefix}pinjam 628xxxx 500000*\n` +
                    `╰─❁`,
                    false, {
                        contextInfo: {
                            mentionedJid: [tagWho]
                        }
                    }
                );

            if (loan.active)
                return m.reply(`❌ Kamu masih punya pinjaman aktif! Lunasi dulu sebelum pinjam lagi.`);

            if ((lenderUser.money || 0) < jumlah)
                return m.reply(
                    `❌ Dompet @${tagWho.split('@')[0]} tidak cukup untuk meminjamkan *Rp ${toRupiah(jumlah)}*!`,
                    false, {
                        contextInfo: {
                            mentionedJid: [tagWho]
                        }
                    }
                );

            const bunga = Math.floor(jumlah * BUNGA);
            const totalTagihan = jumlah + bunga;
            const deadline = Date.now() + 7 * 24 * 60 * 60 * 1000;
            const borrowerName = user.name || m.sender.split('@')[0];
            const lenderName = lenderUser.name || tagWho.split('@')[0];

            // Potong dompet lender
            lenderUser.money -= jumlah;

            // Catat pinjaman di borrower
            loan.active = true;
            loan.jumlah = jumlah;
            loan.totalTagihan = totalTagihan;
            loan.sudahBayar = 0;
            loan.sisaTagihan = totalTagihan;
            loan.tanggalPinjam = Date.now();
            loan.deadlineBayar = deadline;
            loan.dendaDitambah = false;
            loan.lender = tagWho;
            loan.lenderName = lenderName;

            // Uang masuk ke dompet borrower
            user.money = (user.money || 0) + jumlah;

            await global.loading(m, conn);
            try {
                const img = await canvasLoan('pinjam', {
                    sudahBayar: 0,
                    totalTagihan,
                    rows: [
                        ['👤', 'Peminjam', borrowerName.slice(0, 20)],
                        ['💸', 'Dari (Lender)', lenderName.slice(0, 20)],
                        ['💰', 'Jumlah Diterima', `Rp ${toRupiah(jumlah)}`],
                        ['📊', 'Bunga (5%)', `Rp ${toRupiah(bunga)}`],
                        ['💳', 'Total Tagihan', `Rp ${toRupiah(totalTagihan)}`],
                        ['📅', 'Deadline Bayar', new Date(deadline).toLocaleDateString('id-ID')],
                    ]
                });
                await conn.sendMessage(m.chat, {
                    image: img,
                    caption: `✅ *${borrowerName}* berhasil meminjam *Rp ${toRupiah(jumlah)}* dari @${tagWho.split('@')[0]}!\n\n` +
                        `Gunakan *${usedPrefix}bayarpinjam [jumlah/all]* untuk membayar.`,
                    mentions: [tagWho]
                }, {
                    quoted: m
                });
            } finally {
                await global.loading(m, conn, true);
            }
            return;
        }


        if (loan.active) {
            const img = await canvasLoan('status', {
                sudahBayar: loan.sudahBayar,
                totalTagihan: loan.totalTagihan,
                rows: [
                    ['💰', 'Jumlah Pinjaman', `Rp ${toRupiah(loan.jumlah)}`],
                    ['📊', 'Total Tagihan (+bunga)', `Rp ${toRupiah(loan.totalTagihan)}`],
                    ['✅', 'Sudah Dibayar', `Rp ${toRupiah(loan.sudahBayar)}`],
                    ['⚠️', 'Sisa Tagihan', `Rp ${toRupiah(loan.sisaTagihan)}`, true],
                    ['📅', 'Deadline', new Date(loan.deadlineBayar).toLocaleDateString('id-ID')],
                ]
            });
            return conn.sendMessage(m.chat, {
                image: img,
                caption: `❌ Kamu masih punya pinjaman aktif!\n\nGunakan *${usedPrefix}bayarpinjam [jumlah/all]* untuk membayar.`
            }, {
                quoted: m
            });
        }

        const now = Date.now();
        if (loan.lastLunas && now - loan.lastLunas < COOLDOWN_PINJAM) {
            const sisa = COOLDOWN_PINJAM - (now - loan.lastLunas);
            const jam = Math.ceil(sisa / 3600000);
            return m.reply(`⏳ Kamu baru saja melunasi pinjaman.\nTunggu *${jam} jam* lagi sebelum bisa pinjam kembali.`);
        }

        const jumlah = parseInt(args[0]);
        if (!jumlah || jumlah < 1000) {
            const maxPinjam = getMaxPinjam(user.level || 0);
            const table = MAX_PINJAM_LEVEL.map(([lv, amt]) =>
                `◦❒ Level ${lv}+ → Rp ${toRupiah(amt)}`
            ).join('\n');
            return m.reply(
                `╭─❁ 💸 ꜱɪꜱᴛᴇᴍ ᴘɪɴᴊᴀᴍᴀɴ ❁\n` +
                `◦❒ Format: *${usedPrefix}pinjam [jumlah]*\n` +
                `◦❒ Contoh: *${usedPrefix}pinjam 1000000*\n` +
                `◦❒ Pinjam ke user: *${usedPrefix}pinjam @user [jumlah]*\n` +
                `╰─❁\n\n` +
                `╭─❁ 📊 ʙᴀᴛᴀꜱ ᴘɪɴᴊᴀᴍᴀɴ ᴘᴇʀ ʟᴇᴠᴇʟ ❁\n` +
                `${table}\n` +
                `╰─❁\n\n` +
                `╭─❁ ℹ️ ɪɴꜰᴏ ❁\n` +
                `◦❒ Bunga: *5%* dari jumlah pinjaman\n` +
                `◦❒ Deadline: *7 hari* setelah pinjam\n` +
                `◦❒ Denda: *2%/hari* jika telat\n` +
                `╰─❁\n\n` +
                `╭─❁ 👤 ᴀᴋᴜɴ ᴋᴀᴍᴜ ❁\n` +
                `◦❒ Level: *${user.level || 0}*\n` +
                `◦❒ Batas: *Rp ${toRupiah(maxPinjam)}*\n` +
                `╰─❁`
            );
        }

        const maxPinjam = getMaxPinjam(user.level || 0);
        if (jumlah > maxPinjam)
            return m.reply(`❌ Maksimal pinjaman untuk level kamu (${user.level || 0}) adalah *Rp ${toRupiah(maxPinjam)}*`);

        const bunga = Math.floor(jumlah * BUNGA);
        const totalTagihan = jumlah + bunga;
        const deadline = now + 7 * 24 * 60 * 60 * 1000;

        loan.active = true;
        loan.jumlah = jumlah;
        loan.totalTagihan = totalTagihan;
        loan.sudahBayar = 0;
        loan.sisaTagihan = totalTagihan;
        loan.tanggalPinjam = now;
        loan.deadlineBayar = deadline;
        loan.dendaDitambah = false;
        loan.lender = null;
        loan.lenderName = null;
        user.money += jumlah;

        await global.loading(m, conn);
        try {
            const img = await canvasLoan('pinjam', {
                sudahBayar: 0,
                totalTagihan,
                rows: [
                    ['💰', 'Jumlah Diterima', `Rp ${toRupiah(jumlah)}`],
                    ['📊', 'Bunga (5%)', `Rp ${toRupiah(bunga)}`],
                    ['💳', 'Total Tagihan', `Rp ${toRupiah(totalTagihan)}`],
                    ['📅', 'Deadline Bayar', new Date(deadline).toLocaleDateString('id-ID')],
                    ['👛', 'Dompet Sekarang', `Rp ${toRupiah(user.money)}`],
                ]
            });
            await conn.sendMessage(m.chat, {
                image: img,
                caption: `✅ Berhasil meminjam *Rp ${toRupiah(jumlah)}*!\n\nGunakan *${usedPrefix}bayarpinjam [jumlah/all]* untuk membayar.`
            }, {
                quoted: m
            });
        } finally {
            await global.loading(m, conn, true);
        }
    }


    // ── kasihpinjam ──────────────────────────────────────────────
    // Lender aktif meminjamkan uang ke borrower via @tag atau nomor + nominal
    else if (/^kasihpinjam$/i.test(command)) {
        const targetJid = m.mentionedJid?.[0] ||
            (args.find(a => /^[0-9]{5,15}$/.test(a.replace(/[@ +-]/g, ''))) ?
                args.find(a => /^[0-9]{5,15}$/.test(a.replace(/[@ +-]/g, ''))).replace(/[@ +-]/g, '') + '@s.whatsapp.net' :
                null);

        if (!targetJid)
            return m.reply(
                `╭─❁ 💸 ᴋᴀꜱɪʜ ᴘɪɴᴊᴀᴍ ❁\n` +
                `◦❒ Format: *${usedPrefix}kasihpinjam @user [jumlah]*\n` +
                `◦❒ Contoh: *${usedPrefix}kasihpinjam @user 500000*\n` +
                `◦❒ Atau: *${usedPrefix}kasihpinjam 628xxxx 500000*\n` +
                `╰─❁`
            );

        if (targetJid === m.sender) return m.reply('❌ Tidak bisa meminjamkan uang ke diri sendiri!');

        const targetUser = global.db.data.users[targetJid];
        if (!targetUser) return m.reply('❌ User tersebut tidak ada di database.');

        const targetLoan = initLoan(targetUser);

        // Ekstrak nomor HP target (jika input pakai nomor, bukan @mention) untuk di-exclude dari parsing jumlah
        const targetNum = targetJid.replace('@s.whatsapp.net', '');
        const jumlahArg = args.find(a => /^[0-9]+$/.test(a) && a.replace(/[@ +-]/g, '') !== targetNum);
        const jumlah = jumlahArg ? parseInt(jumlahArg) : 0;

        if (!jumlah || jumlah < 1000)
            return m.reply(
                `╭─❁ 💸 ᴋᴀꜱɪʜ ᴘɪɴᴊᴀᴍ ❁\n` +
                `◦❒ Format: *${usedPrefix}kasihpinjam @user [jumlah]*\n` +
                `◦❒ Nominal minimal: *Rp 1.000*\n` +
                `╰─❁`,
                false, {
                    contextInfo: {
                        mentionedJid: [targetJid]
                    }
                }
            );

        if ((user.money || 0) < jumlah)
            return m.reply(`❌ Dompet kamu tidak cukup!\nDiperlukan: *Rp ${toRupiah(jumlah)}*\nDompet kamu: *Rp ${toRupiah(user.money || 0)}*`);

        if (targetLoan.active)
            return m.reply(
                `❌ @${targetJid.split('@')[0]} masih punya pinjaman aktif!\nSisa tagihan: *Rp ${toRupiah(targetLoan.sisaTagihan)}*`,
                false, {
                    contextInfo: {
                        mentionedJid: [targetJid]
                    }
                }
            );

        const bunga = Math.floor(jumlah * BUNGA);
        const totalTagihan = jumlah + bunga;
        const deadline = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const lenderName = user.name || m.sender.split('@')[0];
        const targetName = targetUser.name || targetJid.split('@')[0];

        // Potong dompet lender
        user.money -= jumlah;

        // Catat pinjaman di borrower
        targetLoan.active = true;
        targetLoan.jumlah = jumlah;
        targetLoan.totalTagihan = totalTagihan;
        targetLoan.sudahBayar = 0;
        targetLoan.sisaTagihan = totalTagihan;
        targetLoan.tanggalPinjam = Date.now();
        targetLoan.deadlineBayar = deadline;
        targetLoan.dendaDitambah = false;
        targetLoan.lender = m.sender;
        targetLoan.lenderName = lenderName;

        // Uang masuk ke dompet borrower
        targetUser.money = (targetUser.money || 0) + jumlah;

        await global.loading(m, conn);
        try {
            const img = await canvasLoan('pinjam', {
                sudahBayar: 0,
                totalTagihan,
                rows: [
                    ['👤', 'Peminjam', targetName.slice(0, 20)],
                    ['💸', 'Pemberi Pinjaman', lenderName.slice(0, 20)],
                    ['💰', 'Jumlah Dipinjamkan', `Rp ${toRupiah(jumlah)}`],
                    ['📊', 'Bunga (5%)', `Rp ${toRupiah(bunga)}`],
                    ['💳', 'Total Tagihan', `Rp ${toRupiah(totalTagihan)}`],
                    ['📅', 'Deadline Bayar', new Date(deadline).toLocaleDateString('id-ID')],
                ]
            });
            await conn.sendMessage(m.chat, {
                image: img,
                caption: `✅ *${lenderName}* berhasil meminjamkan *Rp ${toRupiah(jumlah)}* ke @${targetJid.split('@')[0]}!\n\n` +
                    `@${targetJid.split('@')[0]} gunakan *${usedPrefix}bayarpinjam [jumlah/all]* untuk membayar.`,
                mentions: [targetJid]
            }, {
                quoted: m
            });
        } finally {
            await global.loading(m, conn, true);
        }
    } else if (/^bayarpinjam$/i.test(command)) {
        if (!loan.active) return m.reply('✅ Kamu tidak punya pinjaman aktif saat ini.');

        const isAll = /^all$/i.test(args[0]);
        let bayar = isAll ? loan.sisaTagihan : parseInt(args[0]);

        if (!bayar || bayar < 1)
            return m.reply(
                `╭─❁ 💳 ʙᴀʏᴀʀ ᴘɪɴᴊᴀᴍᴀɴ ❁\n` +
                `◦❒ Format: *${usedPrefix}bayarpinjam [jumlah/all]*\n` +
                `◦❒ Contoh: *${usedPrefix}bayarpinjam 500000*\n` +
                `◦❒ Contoh: *${usedPrefix}bayarpinjam all*\n` +
                `╰─❁\n\n` +
                `╭─❁ 📊 ᴛᴀɢɪʜᴀɴ ❁\n` +
                `◦❒ Sisa: *Rp ${toRupiah(loan.sisaTagihan)}*\n` +
                `╰─❁`
            );

        bayar = Math.min(bayar, loan.sisaTagihan);

        if ((user.money || 0) < bayar)
            return m.reply(`❌ Dompet kamu tidak cukup!\nDibutuhkan: *Rp ${toRupiah(bayar)}*\nDompet: *Rp ${toRupiah(user.money || 0)}*`);

        user.money -= bayar;
        loan.sudahBayar += bayar;
        loan.sisaTagihan -= bayar;

        // Transfer ke lender jika pinjaman dari user (bukan dari bot)
        if (loan.lender) {
            const lenderUser = global.db.data.users[loan.lender];
            if (lenderUser) {
                lenderUser.money = (lenderUser.money || 0) + bayar;
            }
        }

        const lunas = loan.sisaTagihan <= 0;
        if (lunas) {
            loan.active = false;
            loan.lastLunas = Date.now();
            loan.riwayat.push({
                jumlah: loan.jumlah,
                totalTagihan: loan.totalTagihan,
                tanggalPinjam: loan.tanggalPinjam,
                tanggalLunas: Date.now()
            });
            if (loan.riwayat.length > 10) loan.riwayat.shift();
            if (!user.totalLunas) user.totalLunas = 0;
            user.totalLunas++;
        }

        await global.loading(m, conn);
        try {
            const type = lunas ? 'lunas' : 'bayar';
            const img = await canvasLoan(type, {
                sudahBayar: loan.sudahBayar,
                totalTagihan: loan.totalTagihan,
                rows: lunas ? [
                    ['🎉', 'Status', 'LUNAS!'],
                    ['💰', 'Total Dibayar', `Rp ${toRupiah(loan.totalTagihan)}`],
                    ['👛', 'Dompet Sekarang', `Rp ${toRupiah(user.money)}`],
                    ['🏅', 'Total Pinjaman Lunas', `${user.totalLunas}x`],
                ] : [
                    ['💳', 'Dibayar Sekarang', `Rp ${toRupiah(bayar)}`],
                    ['✅', 'Total Terbayar', `Rp ${toRupiah(loan.sudahBayar)}`],
                    ['⚠️', 'Sisa Tagihan', `Rp ${toRupiah(loan.sisaTagihan)}`, true],
                    ['👛', 'Dompet Sekarang', `Rp ${toRupiah(user.money)}`],
                ]
            });
            const borrowerName = user.name || m.sender.split('@')[0];
            await conn.sendMessage(m.chat, {
                image: img,
                caption: lunas ?
                    `🎉 Pinjaman kamu sudah *LUNAS*!${loan.lender ? `\n\n💸 Uang telah dikembalikan ke *${loan.lenderName || loan.lender.split('@')[0]}*` : ''}\n\nKamu bisa pinjam lagi setelah *24 jam*.` : `✅ Berhasil membayar *Rp ${toRupiah(bayar)}*\nSisa tagihan: *Rp ${toRupiah(loan.sisaTagihan)}*${loan.lender ? `\n\n💸 Uang diteruskan ke *${loan.lenderName || loan.lender.split('@')[0]}*` : ''}`
            }, {
                quoted: m
            });

            // Kirim notif ke lender jika pinjaman antar user — dikirim di group (m.chat)
            if (loan.lender && loan.lender !== m.sender) {
                const lenderUser = global.db.data.users[loan.lender];
                const lenderMoney = lenderUser ? toRupiah(lenderUser.money || 0) : '?';
                const lenderTag = `@${loan.lender.split('@')[0]}`;
                await conn.sendMessage(m.chat, {
                    text: lunas ?
                        `🎉 ${lenderTag} — *${borrowerName}* telah melunasi pinjamannya!\n\n` +
                        `💰 Dikembalikan: *Rp ${toRupiah(bayar)}*\n` +
                        `👛 Dompet kamu sekarang: *Rp ${lenderMoney}*` : `💳 ${lenderTag} — *${borrowerName}* membayar sebagian pinjaman!\n\n` +
                        `💰 Diterima: *Rp ${toRupiah(bayar)}*\n` +
                        `⏳ Sisa tagihan mereka: *Rp ${toRupiah(loan.sisaTagihan)}*\n` +
                        `👛 Dompet kamu sekarang: *Rp ${lenderMoney}*`,
                    mentions: [loan.lender]
                });
            }
        } finally {
            await global.loading(m, conn, true);
        }
    } else if (/^statuspinjam$/i.test(command)) {
        // bisa cek orang lain dengan tag
        const who = m.mentionedJid?.[0] || m.sender;
        const targetUser = global.db.data.users[who];
        if (!targetUser) return m.reply('User tidak ditemukan di database.');

        const targetLoan = initLoan(targetUser);
        const isSelf = who === m.sender;
        const nama = targetUser.name || who.split('@')[0];

        if (!targetLoan.active) {
            return m.reply(
                `╭─❁ 📋 ꜱᴛᴀᴛᴜꜱ ᴘɪɴᴊᴀᴍᴀɴ ❁\n` +
                `◦❒ ${isSelf ? 'Kamu' : `@${who.split('@')[0]}`} tidak punya pinjaman aktif\n` +
                `◦❒ Total lunas: *${targetUser.totalLunas || 0}x*\n` +
                `╰─❁`,
                false, {
                    contextInfo: {
                        mentionedJid: [who]
                    }
                }
            );
        }

        const telat = targetLoan.deadlineBayar && Date.now() > targetLoan.deadlineBayar;
        const sisaHari = telat ? 0 : Math.ceil((targetLoan.deadlineBayar - Date.now()) / (24 * 60 * 60 * 1000));

        await global.loading(m, conn);
        try {
            const img = await canvasLoan('status', {
                sudahBayar: targetLoan.sudahBayar,
                totalTagihan: targetLoan.totalTagihan,
                rows: [
                    ['👤', 'Peminjam', nama.slice(0, 20)],
                    ['💰', 'Jumlah Pinjaman', `Rp ${toRupiah(targetLoan.jumlah)}`],
                    ['📊', 'Total Tagihan', `Rp ${toRupiah(targetLoan.totalTagihan)}`],
                    ['✅', 'Sudah Dibayar', `Rp ${toRupiah(targetLoan.sudahBayar)}`],
                    ['⚠️', 'Sisa Tagihan', `Rp ${toRupiah(targetLoan.sisaTagihan)}`, true],
                    ['📅', telat ? '🔴 TELAT!' : '📅 Deadline', telat ? `Terlambat! Denda 2%/hari` : `${sisaHari} hari lagi`, telat],
                ]
            });
            await conn.sendMessage(m.chat, {
                image: img,
                caption: `📋 Status pinjaman *${isSelf ? 'kamu' : `@${who.split('@')[0]}`}*${telat ? '\n\n⚠️ *PINJAMAN SUDAH LEWAT DEADLINE!* Denda 2%/hari terus berjalan.' : ''}`,
                mentions: isSelf ? [] : [who]
            }, {
                quoted: m
            });
        } finally {
            await global.loading(m, conn, true);
        }
    }

    // ── riwayatpinjam ────────────────────────────────────────────
    else if (/^riwayatpinjam$/i.test(command)) {
        const who = m.mentionedJid?.[0] || m.sender;
        const targetUser = global.db.data.users[who];
        if (!targetUser) return m.reply('User tidak ditemukan di database.');

        const targetLoan = initLoan(targetUser);
        const riwayat = targetLoan.riwayat || [];
        const isSelf = who === m.sender;

        if (riwayat.length === 0)
            return m.reply(`Tidak ada riwayat pinjaman${isSelf ? '' : ` untuk @${who.split('@')[0]}`}.`, false, {
                contextInfo: {
                    mentionedJid: isSelf ? [] : [who]
                }
            });

        let teks = `╭─❁ 📜 ʀɪᴡᴀʏᴀᴛ ᴘɪɴᴊᴀᴍᴀɴ ❁\n`;
        riwayat.slice().reverse().forEach((r, i) => {
            teks += `◦❒ *${i + 1}.* Rp ${toRupiah(r.jumlah)}\n`;
            teks += `   Total: Rp ${toRupiah(r.totalTagihan)}\n`;
            teks += `   Lunas: ${new Date(r.tanggalLunas).toLocaleDateString('id-ID')}\n`;
        });
        teks += `╰─❁`;

        m.reply(teks, false, isSelf ? {} : {
            contextInfo: {
                mentionedJid: [who]
            }
        });
    }
};

handler.help = ['pinjam', 'kasihpinjam', 'bayarpinjam', 'statuspinjam', 'riwayatpinjam'];
handler.tags = ['rpg'];
handler.command = /^(pinjam|kasihpinjam|bayarpinjam|statuspinjam|riwayatpinjam)$/i;
handler.register = true;
handler.group = true;
handler.rpg = true;

export default handler;