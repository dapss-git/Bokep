import moment from "moment-timezone";
import fs from "fs";
import {
    prepareWAMessageMedia
} from "baileys";

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, "0")).join(":");
}

function toRupiah(number) {
    return new Intl.NumberFormat("id-ID").format(number);
}

const rData = {
    penumpang: ["mas mas", "bapak bapak", "cewe sma", "bocil epep", "emak emak"],
    progTask: ["Fixing Bug", "Deploy Server", "Frontend UI", "Backend Logic", "Database Migration"],
    boClient: ["Om-om Girang", "Sugar Daddy", "Tante Muda", "Pengusaha Muda", "Wibu Elite"],
    judiLawan: ["Bandar Internasional", "Sultan Kasino", "Mafia Judi", "Dewa Judi"]
};

async function makeFakeQuote(conn, pushName) {
    try {
        const thumbBuffer = fs.readFileSync('./media/menu.jpg');

        const {
            imageMessage
        } = await prepareWAMessageMedia({
            image: thumbBuffer
        }, {
            upload: conn.waUploadToServer,
            mediaTypeOverride: "thumbnail-link"
        });
        imageMessage.width = 720;
        imageMessage.height = 720;

        return {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast",
            },
            message: {
                imageMessage: {
                    ...imageMessage,
                    caption: `✦ ${global.botname} Work System\nHalo ${pushName || "User"} 👋`,
                    forwardingScore: 999,
                    isForwarded: true,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: global.idch || "120363000000000000@newsletter",
                            newsletterName: global.botname,
                            serverMessageId: -1
                        }
                    }
                }
            }
        };
    } catch (e) {
        console.warn("Gagal build fakequote:", e.message);
        return {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast",
            },
            message: {
                extendedTextMessage: {
                    text: `✦ ${global.botname} Work System`
                }
            }
        };
    }
}

async function buildLinkPreview(conn, url) {
    try {
        const thumbBuffer = fs.readFileSync('./media/menu.jpg');

        const {
            imageMessage: hqImage
        } = await prepareWAMessageMedia({
            image: thumbBuffer
        }, {
            upload: conn.waUploadToServer,
            mediaTypeOverride: "thumbnail-link"
        });
        hqImage.width = 1280;
        hqImage.height = 720;

        return {
            "matched-text": url,
            title: `${global.botname} Work System`,
            description: `Sistem kerja RPG ${global.botname}`,
            previewType: 0,
            jpegThumbnail: thumbBuffer,
            highQualityThumbnail: hqImage,
            linkMediaDuration: 0,
            socialMediaPostType: 4
        };
    } catch (e) {
        console.warn("Gagal build linkPreview:", e.message);
        return null;
    }
}

async function animasiKerja(conn, m, {
    title,
    steps,
    uang,
    users,
    linkPreview,
    url
}) {
    const fakeQ = await makeFakeQuote(conn, m.pushName);

    let msg = await conn.sendMessage(
        m.chat, {
            text: `乂 WORK SYSTEM\n\n◦ 𖥔 Job : ${title}\n◦ 𖥔 Status : Processing...\n◦ 𖥔 User : @${m.sender.split("@")[0]}\n\n> ${global.wm || "Bot System"}`,
            mentions: [m.sender],
        }, {
            quoted: fakeQ
        }
    );

    const loader = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let out = [];

    for (let i = 0; i < steps.length; i++) {
        await new Promise(r => setTimeout(r, 1200));
        out.push(`◦ 𖥔 ${steps[i].text}`);

        let teks = `乂 WORKING\n\n◦ 𖥔 Job : ${title}\n◦ 𖥔 Progress : ${Math.floor(((i + 1) / steps.length) * 100)}%\n◦ 𖥔 Status : ${loader[i % loader.length]}\n\n${out.join("\n")}\n\n> ${global.wm || "Bot System"}`;

        await conn.sendMessage(m.chat, {
            text: teks,
            edit: msg.key
        });
    }

    await new Promise(r => setTimeout(r, 800));

    users.money += uang;
    users.lastkerja = Date.now();

    let timeWib = moment.tz("Asia/Jakarta").format("HH:mm");

    let caption = `乂 JOB COMPLETED\n\n◦ 𖥔 Job : ${title}\n◦ 𖥔 Reward : Rp ${toRupiah(uang)}\n◦ 𖥔 Time : ${timeWib} WIB\n◦ 𖥔 User : @${m.sender.split("@")[0]}\n\n> ${global.wm || `${global.botname} System`}`;

    const msgPayload = linkPreview ? {
        text: `${url}\n\n${caption}`,
        mentions: [m.sender],
        linkPreview: {
            ...linkPreview,
            title: `${global.botname} Work System`,
            description: `Job: ${title} | Reward: Rp ${toRupiah(uang)}`
        }
    } : {
        text: caption,
        mentions: [m.sender],
        contextInfo: {
            forwardedNewsletterMessageInfo: {
                newsletterJid: global.idch || "120363000000000000@newsletter",
                newsletterName: global.botname,
                serverMessageId: -1
            }
        }
    };

    await conn.sendMessage(m.chat, msgPayload, {
        quoted: fakeQ
    });
}

const jobList = `乂 DAFTAR KERJA\n\n◦ 𖥔 UMUM\n- ojek\n- pedagang\n- petani\n- montir\n- kuli\n- security\n- barista\n- fotografer\n- nelayan\n- dokter\n\n◦ 𖥔 TEKNOLOGI\n- programmer\n\n◦ 𖥔 ENTERTAINMENT\n- cosplayer\n\n◦ 𖥔 RESOURCE\n- tambang\n- nyawit\n\n◦ 𖥔 HIGH RISK\n- bo (lvl 20)\n- judi (lvl 50)\n\n> .kerja <job>`;

let handler = async (m, {
    conn,
    args
}) => {
    let type = (args[0] || "").toLowerCase();
    let users = global.db.data.users[m.sender];
    let cooldown = 300000;

    if (Date.now() < users.lastkerja + cooldown) {
        return m.reply(`Cooldown: ${clockString(users.lastkerja + cooldown - Date.now())}`);
    }

    const url = global.website || `https://github.com/Blckrose2`;
    const linkPreview = await buildLinkPreview(conn, url);
    const fakeQ = await makeFakeQuote(conn, m.pushName);

    let min = 300000;
    let max = 1500000;
    let hasil = Math.floor(Math.random() * (max - min + 1)) + min;

    const job = (title, steps) => animasiKerja(conn, m, {
        title,
        steps,
        uang: hasil,
        users,
        linkPreview,
        url
    });

    switch (type) {
        case "ojek":
            return job("OJEK", [{
                text: "Mencari penumpang..."
            }, {
                text: `Mengantar ${pickRandom(rData.penumpang)}...`
            }, {
                text: "Menerima pembayaran..."
            }]);
        case "pedagang":
            return job("PEDAGANG", [{
                text: "Menata barang..."
            }, {
                text: "Menunggu pembeli..."
            }, {
                text: "Penjualan meningkat..."
            }]);
        case "petani":
            return job("PETANI", [{
                text: "Mengolah lahan..."
            }, {
                text: "Menanam bibit..."
            }, {
                text: "Panen hasil..."
            }]);
        case "montir":
            return job("MONTIR", [{
                text: "Mengecek mesin..."
            }, {
                text: "Memperbaiki kendaraan..."
            }, {
                text: "Test drive..."
            }]);
        case "kuli":
            return job("KULI", [{
                text: "Mengangkat material..."
            }, {
                text: "Membangun..."
            }, {
                text: "Selesai kerja..."
            }]);
        case "security":
            return job("SECURITY", [{
                text: "Patroli..."
            }, {
                text: "Menjaga area..."
            }, {
                text: "Aman..."
            }]);
        case "barista":
            return job("BARISTA", [{
                text: "Meracik kopi..."
            }, {
                text: "Melayani..."
            }, {
                text: "Selesai..."
            }]);
        case "fotografer":
            return job("FOTOGRAFER", [{
                text: "Mengambil foto..."
            }, {
                text: "Setting angle..."
            }, {
                text: "Editing..."
            }]);
        case "nelayan":
            return job("NELAYAN", [{
                text: "Ke laut..."
            }, {
                text: "Menangkap ikan..."
            }, {
                text: "Bawa hasil..."
            }]);
        case "dokter":
            return job("DOKTER", [{
                text: "Periksa pasien..."
            }, {
                text: "Beri obat..."
            }, {
                text: "Sembuh..."
            }]);
        case "programmer":
            return job("PROGRAMMER", [{
                text: "Ngoding..."
            }, {
                text: "Fix bug..."
            }, {
                text: pickRandom(rData.progTask)
            }]);
        case "cosplayer":
            return job("COSPLAYER", [{
                text: "Pakai kostum..."
            }, {
                text: "Photoshoot..."
            }, {
                text: "Event..."
            }]);
        case "tambang":
            return job("TAMBANG", [{
                text: "Menggali..."
            }, {
                text: "Cari mineral..."
            }, {
                text: "Ambil hasil..."
            }]);
        case "nyawit":
            return job("NYAWIT", [{
                text: "Panen sawit..."
            }, {
                text: "Potong tandan..."
            }, {
                text: "Kirim hasil..."
            }]);
        case "bo":
            if (users.level < 20) return m.reply("Level 20 required");
            return job("BO", [{
                text: "Cari client..."
            }, {
                text: `Melayani ${pickRandom(rData.boClient)}...`
            }, {
                text: "Selesai..."
            }]);
        case "judi":
            if (users.level < 50) return m.reply("Level 50 required");
            return job("JUDI", [{
                text: "Spin..."
            }, {
                text: `VS ${pickRandom(rData.judiLawan)}...`
            }, {
                text: "Hitung hasil..."
            }]);

        default:
            return conn.sendMessage(
                m.chat, {
                    text: linkPreview ? `${url}\n\n${jobList}` : jobList,
                    ...(linkPreview ? {
                        linkPreview: {
                            ...linkPreview,
                            title: `${global.botname} System`,
                            description: "Pilih pekerjaan"
                        }
                    } : {
                        contextInfo: {
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: global.idch || "120363000000000000@newsletter",
                                newsletterName: global.botname,
                                serverMessageId: -1
                            }
                        }
                    })
                }, {
                    quoted: fakeQ
                }
            );
    }
};

handler.help = ["kerja"];
handler.tags = ["rpg"];
handler.command = /^(kerja|work)$/i;
handler.register = true;
handler.group = true;

export default handler;