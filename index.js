import fs from "fs";
import { parsePhoneNumber } from "awesome-phonenumber";
import {
  makeWASocket,
  useMultiFileAuthState,
  Browsers,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  jidDecode,
  generateWAMessage,
  generateWAMessageFromContent,
  delay,
  DisconnectReason,
  downloadContentFromMessage,
  generateForwardMessageContent,
  areJidsSameUser,
  prepareWAMessageMedia,
  WAMessageStubType,
  extractMessageContent,
  proto,
  MEDIA_PATH_MAP,
  MEDIA_HKDF_KEY_MAPPING,
  MEDIA_KEYS
} from "baileys";
import readline from "node:readline";
import pino from "pino";
import chalk from "chalk"
import moment from "moment-timezone";
import os from "os";
import crypto from "crypto";
import axios from "axios";
import { exec } from 'child_process';
import { tmpdir } from 'os';
import "./settings.js";
import { addExif } from './library/sticker.js';
import setupDailyTasks from "./library/task.js"
import PluginsLoad from "./core/loadPlugins.js";
import Database from "./core/database.js";
import { startJsonWatcher } from "./core/jsonWatcher.js";
import serialize from "./core/serialize.js";
import logger from "./core/logger.js";
import makeHelper from "./core/helper.js";
import { Button, ButtonV2, Carousel, AIRich, Toolkit } from "./core/nixcode.js";
import handler from "./handler.js";
import { fileTypeFromBuffer } from 'file-type';
import { getBuffer, getSizeMedia, cleanJid } from "./core/utils.js";

const patchBaileys = () => {
  try {
    import('baileys').then(m => {
      // 1. Patch Constants
      if (m.MEDIA_PATH_MAP && !m.MEDIA_PATH_MAP['sticker-pack']) {
        m.MEDIA_PATH_MAP['sticker-pack'] = '/mms/sticker';
        m.MEDIA_PATH_MAP['thumbnail-sticker-pack'] = '/mms/sticker';
      }
      if (m.MEDIA_HKDF_KEY_MAPPING && !m.MEDIA_HKDF_KEY_MAPPING['sticker-pack']) {
        m.MEDIA_HKDF_KEY_MAPPING['sticker-pack'] = 'Sticker Pack';
        m.MEDIA_HKDF_KEY_MAPPING['thumbnail-sticker-pack'] = 'Sticker Pack';
      }
    }).catch(() => {});
  } catch (e) {}
};

const Plugins = new PluginsLoad("./commands");
const db = new Database("./database.db");
await db.init();
startJsonWatcher();

global.db = db;
global.Button = Button;
global.Toolkit = Toolkit
global.ButtonV2 = ButtonV2;
global.Carousel = Carousel;
global.AIRich = AIRich;
global.interactiveSessions = new Map();
global.displayedBanner = false;
global.API = (name, path = '/', query = {}, apikeyqueryname) => {
    const baseUrl = name in global.APIs ? global.APIs[name] : name;
    let formattedPath = path.startsWith('/') ? path : '/' + path;
    if (!formattedPath.startsWith('/api/') && formattedPath !== '/api') {
        formattedPath = '/api' + formattedPath;
    }
    const isHeaderOnlyAPI = baseUrl.includes('theresav.eu') || name === 'theresav';
    const queryObj = { ...query };
    if (apikeyqueryname && !isHeaderOnlyAPI) {
        queryObj[apikeyqueryname] = global.APIKeys[baseUrl] || global.APIKeys[name];
    }
    const hasQuery = Object.keys(queryObj).length > 0;
    return baseUrl + formattedPath + (hasQuery ? '?' + new URLSearchParams(Object.entries(queryObj)) : '');
};

global.API.getKey = (name) => {
    const baseUrl = name in global.APIs ? global.APIs[name] : name;
    return global.APIKeys[baseUrl] || global.APIKeys[name] || '';
};

global.API.headers = (name, headerName = 'x-apikey') => {
    const key = global.API.getKey(name);
    return key ? { [headerName]: key } : {};
};

global.fetchAPI = async (name, path = '/', query = {}, headerName = 'x-apikey', fetchOptions = {}) => {
    const url = global.API(name, path, query);
    const headers = {
        ...global.API.headers(name, headerName),
        ...(fetchOptions.headers || {})
    };
    return await fetch(url, { ...fetchOptions, headers });
};

global.urlApi = (name, path = '/', query = {}) => {
  const base = global.APIs[name] || name
  const params = new URLSearchParams(query)
  const queryStr = params.toString()
  return base + path + (queryStr ? '?' + queryStr : '')
}

const isStaticMedia = /\.(mp4|mp3|m4a|wav|ogg|jpg|jpeg|png|webp|gif|pdf|bin|zip)(\?.*)?$/i;

const _originalFetch = global.fetch;
global.fetch = async function (resource, options = {}) {
    try {
        let urlStr = typeof resource === 'string' ? resource : resource?.href || resource?.url || '';
        if (urlStr) {
            for (const [key, host] of Object.entries(global.APIs || {})) {
                if (urlStr.startsWith(host)) {
                    // Strip query apikey for theresav.eu as it requires header authentication only
                    if (host.includes('theresav.eu')) {
                        try {
                            const parsed = new URL(urlStr);
                            if (parsed.searchParams.has('apikey')) {
                                parsed.searchParams.delete('apikey');
                                urlStr = parsed.toString();
                            }
                        } catch {}
                    }

                    const afterHost = urlStr.slice(host.length);
                    if (afterHost && !afterHost.startsWith('/api/') && afterHost !== '/api' && !isStaticMedia.test(afterHost)) {
                        const newPath = '/api' + (afterHost.startsWith('/') ? afterHost : '/' + afterHost);
                        urlStr = host + newPath;
                    }

                    if (typeof resource === 'string') {
                        resource = urlStr;
                    } else if (resource instanceof URL) {
                        resource = new URL(urlStr);
                    } else if (resource?.url) {
                        resource.url = urlStr;
                    }

                    const apiKey = global.APIKeys[host] || global.APIKeys[key];
                    if (apiKey) {
                        options = options || {};
                        if (options.headers instanceof Headers) {
                            if (!options.headers.has('x-apikey')) options.headers.set('x-apikey', apiKey);
                            if (!options.headers.has('apikey')) options.headers.set('apikey', apiKey);
                        } else {
                            options.headers = {
                                'x-apikey': apiKey,
                                'apikey': apiKey,
                                ...(options.headers || {})
                            };
                        }
                    }
                    break;
                }
            }
        }
    } catch (e) {}
    return _originalFetch.call(this, resource, options);
};

axios.interceptors.request.use((config) => {
    try {
        let urlStr = config.url || '';
        for (const [key, host] of Object.entries(global.APIs || {})) {
            if (urlStr.startsWith(host)) {
                const afterHost = urlStr.slice(host.length);
                if (afterHost && !afterHost.startsWith('/api/') && afterHost !== '/api' && !isStaticMedia.test(afterHost)) {
                    config.url = host + '/api' + (afterHost.startsWith('/') ? afterHost : '/' + afterHost);
                }

                const apiKey = global.APIKeys[host] || global.APIKeys[key];
                if (apiKey) {
                    config.headers = config.headers || {};
                    if (!config.headers['x-apikey']) config.headers['x-apikey'] = apiKey;
                    if (!config.headers['apikey']) config.headers['apikey'] = apiKey;
                }
                break;
            }
        }
    } catch (e) {}
    return config;
}, (error) => Promise.reject(error));

// Helper functions for sticker and media processing

const toAudio = (buffer, ext) => {
  return new Promise((resolve, reject) => {
    const tmp = tmpdir();
    const filename = crypto.randomBytes(6).toString('hex');
    const inputPath = `${tmp}/${filename}.${ext}`;
    const outputPath = `${tmp}/${filename}.mp3`;
    
    fs.writeFileSync(inputPath, buffer);
    
    exec(`ffmpeg -hide_banner -loglevel error -y -i "${inputPath}" -vn -ac 2 -b:a 128k -ar 44100 -f mp3 "${outputPath}"`, (err) => {
      fs.unlinkSync(inputPath);
      if (err) {
        reject(err);
      } else {
        const audioBuffer = fs.readFileSync(outputPath);
        fs.unlinkSync(outputPath);
        resolve({ data: audioBuffer, filename: outputPath, ext: 'mp3' });
      }
    });
  });
};

const imageToWebp = (buffer) => {
  return new Promise((resolve, reject) => {
    const tmp = tmpdir();
    const filename = crypto.randomBytes(6).toString('hex');
    const inputPath = `${tmp}/${filename}.png`;
    const outputPath = `${tmp}/${filename}.webp`;
    
    fs.writeFileSync(inputPath, buffer);
    exec(`ffmpeg -hide_banner -loglevel error -y -i "${inputPath}" -vf "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease" "${outputPath}"`, (err) => {
      fs.unlinkSync(inputPath);
      if (err) reject(err);
      else {
        const webpBuffer = fs.readFileSync(outputPath);
        fs.unlinkSync(outputPath);
        resolve(webpBuffer);
      }
    });
  });
};

const videoToWebp = (buffer) => {
  return new Promise((resolve, reject) => {
    const tmp = tmpdir();
    const filename = crypto.randomBytes(6).toString('hex');
    const inputPath = `${tmp}/${filename}.mp4`;
    const outputPath = `${tmp}/${filename}.webp`;
    
    fs.writeFileSync(inputPath, buffer);
    exec(`ffmpeg -hide_banner -loglevel error -y -i "${inputPath}" -vf "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease" -t 6 "${outputPath}"`, (err) => {
      fs.unlinkSync(inputPath);
      if (err) reject(err);
      else {
        const webpBuffer = fs.readFileSync(outputPath);
        fs.unlinkSync(outputPath);
        resolve(webpBuffer);
      }
    });
  });
};

const imageToWebpAvatar = imageToWebp;
const videoToWebpAvatar = videoToWebp;

const writeExifImg = async (buffer, metadata) => {
  const webp = await imageToWebp(buffer);
  return await addExif(webp, metadata.packname || 'Sticker', metadata.author || '', ['🤩', '🔥']);
};

const writeExifVid = async (buffer, metadata) => {
  const webp = await videoToWebp(buffer);
  return await addExif(webp, metadata.packname || 'Sticker', metadata.author || '', ['🤩', '🔥']);
};

const writeExifImgAvatar = writeExifImg;
const writeExifVidAvatar = writeExifVid;

const smsg = (conn, m, store) => {
  if (!m) return m;
  const M = serialize(m, conn, store);
  return M;
};

const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(text, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor(seconds % (3600 * 24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
};

const toSHA256 = (data) => {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
};

const displayBanner = (conn) => {
  if (global.displayedBanner) return;
  global.displayedBanner = true;

  const _botKey = conn?.user?.jid || conn?.user?.id || 'bot';
  const _botSettings = (typeof db.data.settings?.[_botKey] === 'object') ? db.data.settings[_botKey] : db.data.settings;
  const botMode = _botSettings.self ? "Self Mode" : "Public Mode";
  console.log(chalk.yellow(`
# Time WIB: ${chalk.green(moment().tz("Asia/Jakarta").format("HH:mm:ss DD/MM/YYYY"))}
# Platform: ${chalk.green(os.platform())} (${os.arch()})
# Memory: ${chalk.green(((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2))}% used
# Uptime: ${chalk.green(formatUptime(os.uptime()))}
# Node.js: ${chalk.green(process.version)}
# Mode: ${chalk.green(botMode)}
# Creator: ${chalk.green(`${(global.owner?.find(o => Array.isArray(o) ? o[2] !== false : true) || ["?","Owner"])[1]}`)}
`));
};

async function waSocket() {
  displayBanner();
  const {
    state,
    saveCreds
  } = await useMultiFileAuthState("sessions");
  const {
    version
  } = await fetchLatestBaileysVersion();

  const sessionExists = fs.existsSync("./sessions/creds.json");
  const useQR = false;
  const pairing = !sessionExists;
  if (sessionExists) {
    console.log(chalk.green("[AUTH] File sesi ditemukan, login otomatis..."));
  }

  const conn = makeWASocket({
    logger: pino({
      level: "silent"
    }),
    printQRInTerminal: useQR,
    version,
    auth: state,
    browser: Browsers.ubuntu("Chrome"),
    syncFullHistory: false,
    getMessage: async (key) => {
      return undefined;
    }
  });

  makeHelper(conn);

  Object.defineProperties(conn, {
    ...(typeof conn.chatRead !== 'function' ? {
      chatRead: {
        value(jid, participant = conn.user.jid, messageID) {
          return conn.sendReadReceipt(jid, participant, [messageID]);
        },
        enumerable: true
      }
    } : {}),

    ...(typeof conn.setStatus !== 'function' ? {
      setStatus: {
        value(status) {
          return conn.query({
            tag: 'iq',
            attrs: {
              to: '@s.whatsapp.net',
              type: 'set',
              xmlns: 'status',
            },
            content: [{
              tag: 'status',
              attrs: {},
              content: Buffer.from(status, 'utf-8')
            }]
          });
        },
        enumerable: true
      }
    } : {}),

    ...(typeof conn.sendReact !== 'function' ? {
      sendReact: {
        value(jid, text, key) {
          return conn.sendMessage(jid, {
            react: {
              text,
              key
            }
          });
        },
        enumerable: true
      }
    } : {}),

    ...(typeof conn.editMessage !== 'function' ? {
      editMessage: {
        value(jid, message, newText, options = {}) {
          let copy = {
            ...message
          };
          let mtype = Object.keys(copy.message)[0];
          let msgContent = copy.message[mtype];

          if (typeof msgContent === 'string') {
            copy.message[mtype] = newText || msgContent;
          } else if (msgContent.text) {
            msgContent.text = newText || msgContent.text;
          } else if (msgContent.caption) {
            msgContent.caption = newText || msgContent.caption;
          }

          return conn.relayMessage(jid, copy.message, {
            messageId: copy.key.id,
            ...options
          });
        },
        enumerable: true
      }
    } : {})
  });

  if (pairing && !conn.authState.creds.registered) {
    const phone_number = global.botnumber.replace(/[^0-9]/g, "");
    const delay = ms => new Promise(r => setTimeout(r, ms));
    await delay(3000);
    try {
      const code = await conn.requestPairingCode(phone_number, global.custompairing);
      console.log(chalk.green(`\n[✓] Kode Pairing: ${chalk.bold.white(code?.match(/.{1,4}/g)?.join('-') || code)}`));
    } catch (error) {
      console.log(chalk.red(`\n[✗] Gagal meminta kode pairing: ${error.message}`));
      process.exit(1);
    }
  }
  // --- Event Handlers ---
  const forbidden = [
    'porn', 'hentai', 'pornhub', 'xvideos', 'xnxx', 'nekopoi',
    'lewatsana', 'catsex', 'pixhentai', 'mangasusuku',
    'nhentai', 'bokep','furina','rijal', 'catbox.moe'
  ];
  const store = {
    groupMetadata: {},
    contacts: {},
    lidMapping: {},
    messages: {} // Cache pesan untuk fitur reaction
  };

  // Helper to get or set LID mapping from DB (Async version matching serialize.js logic)
  const resolveLid = async (lid) => {
    if (!lid) return lid;
    
    // 1. Ambil Nama dari contact store (priority)
    const contact = store.contacts[lid] || {};
    const name = contact.name || contact.verifiedName || contact.notify;
    if (name) return name;

    if (lid.endsWith('@lid')) {
        // 2. Cek database permanen
        if (global.db.data.lidMapping && global.db.data.lidMapping[lid]) return global.db.data.lidMapping[lid];
        
        // 3. Cek memori store
        if (store.lidMapping[lid]) return store.lidMapping[lid];

        // 4. Gunakan API Native Baileys (Async)
        try {
            if (typeof conn.getPNForLID === "function") {
                const pn = await conn.getPNForLID(lid);
                if (pn) {
                    const cleanPn = cleanJid(pn);
                    if (!global.db.data.lidMapping) global.db.data.lidMapping = {};
                    global.db.data.lidMapping[lid] = cleanPn;
                    return cleanPn;
                }
            }
            const pn = await conn.signalRepository?.lidMapping?.getPNForLID(lid);
            if (pn) {
                const cleanPn = cleanJid(pn);
                if (!global.db.data.lidMapping) global.db.data.lidMapping = {};
                global.db.data.lidMapping[lid] = cleanPn;
                return cleanPn;
            }
        } catch (e) {}
    }

    return lid;
  };

  conn.ev.on("lid-mapping.update", (update) => {
    if (!global.db.data.lidMapping) global.db.data.lidMapping = {};
    for (const { lid, pn } of update) {
      store.lidMapping[lid] = pn;
      global.db.data.lidMapping[lid] = pn;
    }
  });

  conn.ev.on("messaging-history.set", ({ contacts }) => {
    if (!global.db.data.lidMapping) global.db.data.lidMapping = {};
    for (const contact of contacts) {
      if (contact.id.endsWith("@lid") && contact.phoneNumber) {
        const lid = jidNormalizedUser(contact.id);
        const pn = jidNormalizedUser(contact.phoneNumber);
        store.lidMapping[lid] = pn;
        global.db.data.lidMapping[lid] = pn;
      }
    }
  });

  conn.store = store;
  conn.ev.on("creds.update", saveCreds);

  conn.ev.on("presence.update", async (json) => {
    const presences = json.presences || {};
    const translated = {};
    
    const isGroup = json.id.endsWith('@g.us');
    const groupMetadata = isGroup ? (store.groupMetadata[json.id] || {}) : null;
    const participants = groupMetadata?.participants || [];

    for (let jid in presences) {
        let resolved = await resolveLid(jid);
        
        if (resolved.endsWith('@lid') && participants.length > 0) {
            const p = participants.find(p => p.lid === jid || p.id === jid);
            if (p) {
                const realJid = p.id?.endsWith('@s.whatsapp.net') ? p.id : null;
                if (realJid) {
                    resolved = realJid;
                    if (!global.db.data.lidMapping) global.db.data.lidMapping = {};
                    global.db.data.lidMapping[jid] = realJid;
                }
            }
        }
        
        const finalName = await resolveLid(resolved);
        translated[finalName] = presences[jid];
    }

    console.log(chalk.cyan(`[PRESENCE] Update from ${await resolveLid(json.id)}:`), JSON.stringify(translated, null, 2));
  });

  conn.ev.on("call.upsert", async (calls) => {
    const botSettings = global.db.data.settings[jidNormalizedUser(conn.user.id)] || {};
    if (!botSettings.anticall) return;

    for (const call of calls) {
      if (call.status === "offer") {
        console.log(chalk.red(`[ANTICALL] Menolak panggilan dari: ${call.from}`));
        await conn.rejectCall(call.id, call.from);
        await conn.sendMessage(call.from, {
          text: `⚠️ *ANTI CALL*\n\nMaaf, bot tidak dapat menerima panggilan (suara/video). Nomor kamu telah terdeteksi melakukan panggilan ke bot. Silakan chat saja jika ada keperluan.`
        });
      }
    }
  });

  // Fungsi untuk sinkronisasi massal LID -> PN dari seluruh grup
  const syncLidMapping = async () => {
    try {
        console.log(chalk.yellow("[SINKRONISASI] Memulai pemetaan Full JID dari seluruh grup..."));
        const groups = await conn.groupFetchAllParticipating();
        if (!global.db.data.lidMapping) global.db.data.lidMapping = {};
        
        let count = 0;
        for (const id in groups) {
            const participants = groups[id].participants || [];
            for (const p of participants) {
                if (p.lid && p.id && p.id.endsWith('@s.whatsapp.net')) {
                    if (!global.db.data.lidMapping[p.lid]) {
                        global.db.data.lidMapping[p.lid] = p.id;
                        store.lidMapping[p.lid] = p.id;
                        count++;
                    }
                }
            }
        }
        console.log(chalk.green(`[SINKRONISASI] Berhasil memetakan ${count} JID baru ke database.`));
    } catch (e) {
        console.error(chalk.red("[SINKRONISASI] Gagal:"), e.message);
    }
  };

  conn.ev.on("connection.update", async (update) => {
    const {
      connection,
      lastDisconnect
    } = update;
    if (connection === "connecting") {
      console.log(chalk.yellow("[+] Menghubungkan ke WhatsApp..."));
    } else if (connection === "open") {
      console.log(chalk.green("[+] Berhasil terhubung ke WhatsApp"));
      global.displayedBanner = false;
      displayBanner(conn);
      setupDailyTasks({conn, db});
      
      // Jalankan sinkronisasi LID ke Full JID saat bot baru online
      await syncLidMapping();
    } else if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(chalk.red(`\n[✗] Koneksi terputus: ${statusCode}, menyambung ulang: ${shouldReconnect}`));
      if (shouldReconnect) {
        setTimeout(waSocket, 5000);
      } else {
        console.log(chalk.red("[!] Logout terdeteksi, hapus folder 'sessions' dan mulai ulang."));
      }
    }
  });

  conn.ev.on("contacts.upsert", (update) => {
    for (let contact of update) {
      let id = jidNormalizedUser(contact.id);
      if (id.endsWith("@lid") && contact.phoneNumber) {
        let pn = jidNormalizedUser(contact.phoneNumber);
        store.lidMapping[id] = pn;
        id = pn;
      }
      store.contacts[id] = {
        ...(contact || {}),
        isContact: true
      };
    }
  });

  conn.ev.on("groups.update", (updates) => {
    for (const update of updates) {
      const id = cleanJid(update.id);
      if (store.groupMetadata[id]) {
        store.groupMetadata[id] = {
          ...(store.groupMetadata[id] || {}),
          ...(update || {})
        };
      }
    }
  });

  conn.ev.on("messages.upsert", async (update) => {
    if (update.type !== 'notify' || !update.messages[0]) return;
    const raw = update.messages[0];

    if (raw.key.remoteJid === `${global.idch}`) {
      let idPesan = raw.key.id || '-';
      let isiPesan =
        raw.message?.conversation ||
        raw.message?.extendedTextMessage?.text ||
        raw.message?.imageMessage?.caption ||
        raw.message?.videoMessage?.caption ||
        raw.message?.documentMessage?.caption ||
        '[Non-text message]';
      let tipe = '';
      if (raw.message?.imageMessage) {
        tipe = '📷 Gambar';
      } else if (raw.message?.stickerMessage) {
        tipe = '🪄 Stiker';
      } else if (raw.message?.videoMessage) {
        tipe = '🎥 Video';
      } else if (raw.message?.audioMessage) {
        tipe = '🎵 Audio';
      } else if (raw.message?.protocolMessage?.type === 0) {
        tipe = '🚫 Pesan Dihapus';
      } else if (raw.message?.conversation || raw.message?.extendedTextMessage) {
        tipe = '💬 Teks';
      } else {
        tipe = '📌 Lainnya';
      }
      let serverId = raw.newsletter_server_id || '-';
      let link = serverId !== '-' ? `${global.linkch}${serverId}` : 'Link tidak tersedia';

      const waktu = moment().tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm");

      for (const _ow of (global.owner||[]).filter(o=>Array.isArray(o)?o[2]!==false:true)) {
        await conn.sendMessage((_ow[0]||_ow).replace(/[^0-9]/g,"")+"@s.whatsapp.net", {
          text: `⚠️ Pesan baru di channel:
*ID Pesan:*
> ${idPesan}

*Jenis Pesan:*
> ${tipe}

*Link Pesan:*
> ${link}

*Isi Pesan:*
${isiPesan}
`,
          buttons: [
            {
              buttonId: `.delch ${global.idch},${idPesan},${serverId}`,
              buttonText: { displayText: '🗑 Hapus Pesan' },
              type: 1
            }
          ],
          footer: waktu
        });
      }
    }
    if (raw.key.remoteJid.endsWith('@newsletter')) {
      let idPesan = raw.key.id;
      let idChannel = raw.key.remoteJid;

      // Ambil teks/caption
      let isiPesan = raw.message?.conversation ||
        raw.message?.extendedTextMessage?.text ||
        raw.message?.imageMessage?.caption ||
        raw.message?.videoMessage?.caption ||
        raw.message?.documentMessage?.caption ||
        '';

      // Cek kata / link terlarang
      if (forbidden.some(x => isiPesan.toLowerCase().includes(x))) {
        console.log(`⚠️ Pesan terdeteksi mengandung link/kata terlarang: ${isiPesan}`);

        // Edit pesan
        try {
          await conn.sendMessage(idChannel, {
            text: '⚠️ Pesan ini melanggar pedoman dan akan dihapus.',
            edit: raw.key
          });
        } catch (e) {
          console.error('❌ Gagal edit pesan:', e);
        }

        // Delay 5 detik lalu hapus
        setTimeout(async () => {
          try {
            await conn.sendMessage(idChannel, {
              delete: {
                remoteJid: idChannel,
                fromMe: true,
                id: idPesan
              }
            });
            console.log(`✅ Pesan ${idPesan} di ${idChannel} berhasil dihapus.`);
          } catch (e) {
            console.error('❌ Gagal hapus pesan:', e);
          }
        }, 5000);
      }
    }
    if (raw.key.remoteJid === `${global.idch}`) {
      let idPesan = raw.key.id || '-';
      let isiPesan =
        raw.message?.conversation ||
        raw.message?.extendedTextMessage?.text ||
        raw.message?.imageMessage?.caption ||
        raw.message?.videoMessage?.caption ||
        raw.message?.documentMessage?.caption ||
        '[Non-text message]';

      let serverId = raw.newsletter_server_id || '-';
      let link = serverId !== '-' ? `${global.linkch}${serverId}` : 'Link tidak tersedia';

      for (const _ow of (global.owner||[]).filter(o=>Array.isArray(o)?o[2]!==false:true)) {
        await conn.sendMessage((_ow[0]||_ow).replace(/[^0-9]/g,"")+"@s.whatsapp.net", {
          text: `⚠️ Pesan baru di channel:
*ID Pesan:*
> ${idPesan}

*Link Pesan:*
> ${link}

Isi Pesan:
${isiPesan}
`
        });
      }
    }

    if (raw.key.remoteJid === 'status@broadcast') return;
    if (raw.key.id.startsWith('BAE5') && raw.key.id.length === 16) return;

    const m = await serialize(raw, conn, store);
    if (!m) return;

    // --- Message Caching ---
    await conn.pushMessage(raw);

    const sender = m.sender || m.jid;

const owners = (global.owner || [])
      .filter(v => Array.isArray(v) ? v[2] !== false : true)
      .map(v => (Array.isArray(v) ? v[0] : v).replace(/[^0-9]/g, "") + "@s.whatsapp.net");

const dbOwners = db.data.owner.map(v =>
  (v + "").replace(/[^0-9]/g, "") + "@s.whatsapp.net"
);

const botJid = jidNormalizedUser(conn.user.id);

const isOwner = [
  ...owners,
  ...dbOwners,
  botJid
].includes(sender);

const botSettingsKey = jidNormalizedUser(conn.user.id);
const botSettings = (typeof db.data.settings?.[botSettingsKey] === 'object') ? db.data.settings[botSettingsKey] : db.data.settings;

if (botSettings.self && !isOwner) return;

    logger(m);
    handler(m, conn, store, Plugins);
  });

  conn.ev.on("group-participants.update", async (data) => {
    try {
      const participantHandler = (await import("./core/participants.js")).default;
      await participantHandler(data, conn, db);

      const id = cleanJid(data.id);
      // Sync update metadata in store
      if (store.groupMetadata[id]) {
        const metadata = store.groupMetadata[id];
        if (data.action === "add") {
          metadata.participants.push(
            ...data.participants.map((pid) => ({
              id: cleanJid(pid),
              admin: null,
            }))
          );
        } else if (data.action === "remove") {
          const pids = data.participants.map(pid => cleanJid(pid));
          metadata.participants = metadata.participants.filter(
            (p) => !pids.includes(cleanJid(p.id))
          );
        } else if (data.action === "promote") {
          const pids = data.participants.map(pid => cleanJid(pid));
          for (const participant of metadata.participants) {
            if (pids.includes(cleanJid(participant.id)))
              participant.admin = "admin";
          }
        } else if (data.action === "demote") {
          const pids = data.participants.map(pid => cleanJid(pid));
          for (const participant of metadata.participants) {
            if (pids.includes(cleanJid(participant.id)))
              participant.admin = null;
          }
        }
        // Force full refresh in background for consistency
        conn.groupMetadata(id).then((meta) => {
          store.groupMetadata[id] = meta;
        }).catch(() => {});
      }
    } catch (err) {
      console.error(chalk.red("[✗] Gagal menangani pembaruan partisipan:"), err);
    }
  });

  conn.sendTextWithMentions = async (jid, text, quoted, options = {}) =>
    conn.sendMessage(
      jid, {
        text: text,
        contextInfo: {
          mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(
            (v) => v[1] + "@s.whatsapp.net",
          ),
        },
        ...options,
      }, {
        quoted,
      },
    );
  
  conn.decodeJid = (jid) => {
    if (!jid) return jid;
    let decoded = cleanJid(jid);
    if (decoded.endsWith("@lid")) {
      const pn = store.lidMapping[decoded];
      if (pn) decoded = cleanJid(pn);
    }
    if (/:\d+@/gi.test(decoded)) {
      let decode = jidDecode(decoded) || {};
      decoded = (decode.user && decode.server && decode.user + "@" + decode.server) || decoded;
    }
    return decoded;
  };
  
  conn.ev.on("contacts.update", (update) => {
    for (let contact of update) {
      let id = conn.decodeJid(contact.id);
      if (id.endsWith("@lid") && contact.phoneNumber) {
        let pn = jidNormalizedUser(contact.phoneNumber);
        store.lidMapping[id] = pn;
        id = pn;
      }
      if (store && store.contacts)
        store.contacts[id] = {
          ...(store.contacts[id] || {}),
          ...(contact || {}),
          id,
        };
    }
  });
  
  conn.getName = (jid, withoutContact = false) => {
    let id = conn.decodeJid(jid);
    withoutContact = conn.withoutContact || withoutContact;
    let v;
    if (id.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = (await conn.groupMetadata(id).catch(() => ({}))) || {};
        resolve(
          v.name ||
          v.subject ||
          parsePhoneNumber("+" + id.replace("@g.us", ""))?.number?.international,
        );
      });
    else
      v =
      id === "0@s.whatsapp.net" ? {
        id,
        name: "WhatsApp",
      } :
      id === conn.decodeJid(conn.user.id) ?
      conn.user :
      store.contacts[id] || {};
    return (
      (withoutContact ? "" : v.name) ||
      v.subject ||
      v.verifiedName ||
      (id.endsWith("@s.whatsapp.net") ? parsePhoneNumber("+" + id.replace("@s.whatsapp.net", ""))?.number?.international : id)
    );
  };
  
  conn.parseMention = (text = "") => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
      (v) => v[1] + "@s.whatsapp.net",
    );
  };
  
  conn.sendContact = async (jid, kon, quoted = "", opts = {}) => {
    let list = [];
    for (let i of kon) {
      list.push({
        displayName: await conn.getName(i),
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(i)}\nFN:${await conn.getName(i)}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${ytname}\nitem2.X-ABLabel:YouTube\nitem3.URL:${socialm}\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${location};;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
      });
    }
    conn.sendMessage(
      jid, {
        contacts: {
          displayName: `${list.length} Contact`,
          contacts: list,
        },
        ...opts,
      }, {
        quoted,
      },
    );
  };
  
  
   conn.sendImage = async (jid, path, caption = "", quoted = "", options) => {
    let buffer = Buffer.isBuffer(path) ?
      path :
      /^data:.*?\/.*?;base64,/i.test(path) ?
      Buffer.from(path.split `,` [1], "base64") :
      /^https?:\/\//.test(path) ?
      await await getBuffer(path) :
      fs.existsSync(path) ?
      fs.readFileSync(path) :
      Buffer.alloc(0);
    return await conn.sendMessage(
      jid, {
        image: buffer,
        caption: caption,
        ...options,
      }, {
        quoted,
      },
    );
  };
  
  conn.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path) ?
      path :
      /^data:.*?\/.*?;base64,/i.test(path) ?
      Buffer.from(path.split `,` [1], "base64") :
      /^https?:\/\//.test(path) ?
      await await getBuffer(path) :
      fs.existsSync(path) ?
      fs.readFileSync(path) :
      Buffer.alloc(0);
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifImg(buff, options);
    } else {
      buffer = await imageToWebp(buff);
    }
    await conn.sendMessage(
      jid, {
        sticker: {
          url: buffer,
        },
        ...options,
      }, {
        quoted,
      },
    ).then((response) => {
      fs.unlinkSync(buffer);
      return response;
    });
  };
  
  conn.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path) ?
      path :
      /^data:.*?\/.*?;base64,/i.test(path) ?
      Buffer.from(path.split `,` [1], "base64") :
      /^https?:\/\//.test(path) ?
      await await getBuffer(path) :
      fs.existsSync(path) ?
      fs.readFileSync(path) :
      Buffer.alloc(0);
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifVid(buff, options);
    } else {
      buffer = await videoToWebp(buff);
    }
    await conn.sendMessage(
      jid, {
        sticker: {
          url: buffer,
        },
        ...options,
      }, {
        quoted,
      },
    );
    return buffer;
  };
  conn.reply = async (jid, msg, quoted = null, options = {}) => {
    try {
        let message = {};

        if (typeof msg === "string") {
            message.text = msg;
        } 
        
        
        else if (typeof msg === "object") {
            message = { ...msg }; 
        }

        
        if (options.mentions) {
            message.mentions = options.mentions;
        }

      
        Object.assign(message, options);

        return await conn.sendMessage(
            jid,
            message,
            { quoted }
        );

    } catch (e) {
        console.error("conn.reply error:", e);
    }
};

  
  conn.sendImageAsStickerAvatar = async (
    jid,
    path,
    quoted,
    options = {},
  ) => {
    let buff = Buffer.isBuffer(path) ?
      path :
      /^data:.*?\/.*?;base64,/i.test(path) ?
      Buffer.from(path.split `,` [1], "base64") :
      /^https?:\/\//.test(path) ?
      await await getBuffer(path) :
      fs.existsSync(path) ?
      fs.readFileSync(path) :
      Buffer.alloc(0);
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifImgAvatar(buff, options);
    } else {
      buffer = await imageToWebpAvatar(buff);
    }
    await conn.sendMessage(
      jid, {
        sticker: {
          url: buffer,
        },
        ...options,
      }, {
        quoted,
      },
    ).then((response) => {
      fs.unlinkSync(buffer);
      return response;
    });
  };
  conn.sendAlbumMessage = async (jid, array, options = {}) => {
  options = { ...options }

  const delayMs = !isNaN(options.delay) ? options.delay : 500

  const album = generateWAMessageFromContent(jid, {
    messageContextInfo: {
      messageSecret: crypto.randomBytes(32)
    },
    albumMessage: {
      expectedImageCount: array.filter(a => a.hasOwnProperty('image')).length,
      expectedVideoCount: array.filter(a => a.hasOwnProperty('video')).length,
      ...(options.quoted ? {
        contextInfo: {
          remoteJid: options.quoted.key.remoteJid,
          fromMe: options.quoted.key.fromMe,
          stanzaId: options.quoted.key.id,
          participant:
            options.quoted.key.participant ||
            options.quoted.key.remoteJid,
          quotedMessage: options.quoted.message,
          ...(options.mentions
            ? { mentionedJid: options.mentions }
            : {})
        }
      } : {})
    }
  }, {
    userJid: conn.user.jid,
    upload: conn.waUploadToServer
  })

  await conn.relayMessage(album.key.remoteJid, album.message, {
    messageId: album.key.id
  })

  for (const content of array) {
    const msg = await generateWAMessage(album.key.remoteJid, content, {
      ...(options.quoted ? { quoted: options.quoted } : {}),
      ...(options.mentions ? { mentions: options.mentions } : {}),
      upload: conn.waUploadToServer
    })

    msg.message.messageContextInfo = {
      messageSecret: crypto.randomBytes(32),
      messageAssociation: {
        associationType: 1,
        parentMessageKey: album.key
      }
    }

    await conn.relayMessage(msg.key.remoteJid, msg.message, {
      messageId: msg.key.id
    })

    await delay(delayMs)
  }

  return album
}
  
  conn.sendVideoAsStickerAvatar = async (
    jid,
    path,
    quoted,
    options = {},
  ) => {
    let buff = Buffer.isBuffer(path) ?
      path :
      /^data:.*?\/.*?;base64,/i.test(path) ?
      Buffer.from(path.split `,` [1], "base64") :
      /^https?:\/\//.test(path) ?
      await await getBuffer(path) :
      fs.existsSync(path) ?
      fs.readFileSync(path) :
      Buffer.alloc(0);
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifVidAvatar(buff, options);
    } else {
      buffer = await videoToWebpAvatar(buff);
    }
    await conn.sendMessage(
      jid, {
        sticker: {
          url: buffer,
        },
        ...options,
      }, {
        quoted,
      },
    );
    return buffer;
  };
  
  conn.copyNForward = async (
    jid,
    message,
    forceForward = false,
    options = {},
  ) => {
    let vtype;
    if (options.readViewOnce) {
      message.message =
        message.message &&
        message.message.ephemeralMessage &&
        message.message.ephemeralMessage.message ?
        message.message.ephemeralMessage.message :
        message.message || undefined;
      vtype = Object.keys(message.message.viewOnceMessage.message)[0];
      delete(message.message && message.message.ignore ?
        message.message.ignore :
        message.message || undefined);
      delete message.message.viewOnceMessage.message[vtype].viewOnce;
      message.message = {
        ...message.message.viewOnceMessage.message,
      };
    }
    let mtype = Object.keys(message.message)[0];
    let content = await generateForwardMessageContent(message, forceForward);
    let ctype = Object.keys(content)[0];
    let context = {};
    if (mtype != "conversation") context = message.message[mtype].contextInfo;
    content[ctype].contextInfo = {
      ...context,
      ...content[ctype].contextInfo,
    };
    const waMessage = await generateWAMessageFromContent(
      jid,
      content,
      options ? {
        ...content[ctype],
        ...options,
        ...(options.contextInfo ? {
          contextInfo: {
            ...content[ctype].contextInfo,
            ...options.contextInfo,
          },
        } : {}),
      } : {},
    );
    await conn.relayMessage(jid, waMessage.message, {
      messageId: waMessage.key.id,
    });
    return waMessage;
  };
  
  conn.downloadAndSaveMediaMessage = async (
    message,
    filename,
    attachExtension = true,
  ) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || "";
    let messageType = message.mtype ?
      message.mtype.replace(/Message/gi, "") :
      mime.split("/")[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    let type = await fileTypeFromBuffer(buffer);
    let trueFileName;
    if (type.ext == "ogg" || type.ext == "opus") {
      trueFileName = attachExtension ? filename + ".mp3" : filename;
      await fs.writeFileSync(trueFileName, buffer);
    } else {
      trueFileName = attachExtension ? filename + "." + type.ext : filename;
      await fs.writeFileSync(trueFileName, buffer);
    }
    return trueFileName;
  };
  
  conn.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || "";
    let messageType = message.mtype ?
      message.mtype.replace(/Message/gi, "") :
      mime.split("/")[0];
    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  };
  
  conn.getFile = async (PATH, save) => {
    let res;
    let filename;
    let data;

    if (Buffer.isBuffer(PATH)) {
      data = PATH;
    }
    else if (/^data:.*?\/.*?;base64,/i.test(PATH)) {
      data = Buffer.from(PATH.split `,` [1], "base64");
    }
    else if (/^https?:\/\//.test(PATH)) {
      res = await getBuffer(PATH);
      data = res;
    }
    else if (typeof PATH === "string" && fs.existsSync(PATH)) {
      filename = PATH;
      data = await fs.promises.readFile(PATH);
    }
    else {
      data = Buffer.alloc(0);
    }

    let type = (await fileTypeFromBuffer(data)) || {
      mime: "application/octet-stream",
      ext: ".bin",
    };

    if (!filename) {
      filename = `${tmpdir()}/${crypto.randomBytes(6).toString("hex")}.${type.ext}`;
    }

    if (data && save) await fs.promises.writeFile(filename, data);

    return {
      res,
      filename,
      size: await getSizeMedia(data),
      ...type,
      data,
    };
};
  
  conn.sendText = (jid, text, quoted = "", options) =>
    conn.sendMessage(
      jid, {
        text: text,
        ...options,
      }, {
        quoted,
      },
    );
  
  conn.serializeM = (m) => smsg(conn, m, store);
  
  conn.sendFile = async (jid, media, filename = '', caption = '', quoted = null, options = {}) => {
  try {
    let file = await conn.getFile(media);
    let ext = file.ext ? file.ext.toLowerCase() : "";
    let type;
    let mimetype;

    
    switch (ext) {
      case "mp3":
      case "m4a":
      case "wav":
      case "ogg":
      case "opus":
        type = "audio";
        mimetype = ext === "mp3" ? "audio/mpeg" : (ext === "m4a" ? "audio/mp4" : "audio/ogg; codecs=opus");
        break;

      case "jpg":
      case "jpeg":
      case "png":
        type = "image";
        mimetype = "image/jpeg";
        break;

      case "webp":
        type = "sticker";
        mimetype = "image/webp";
        break;

      case "mp4":
        type = "video";
        mimetype = "video/mp4";
        break;

      default:
        type = "document";
        mimetype = file.mime;
        break;
    }

    // Build message
    let message = {
      [type]: file.data,
      mimetype: options.mimetype || mimetype,
      fileName: filename || `file.${ext}`,
      caption: caption || options.caption || ""
    };

    // PTT / VN
    if (type === "audio" && options.ptt) {
      message.ptt = true;
      message.mimetype = 'audio/ogg; codecs=opus';
    }

    // Opsi internal Baileys
    let sendOptions = {
      quoted: quoted || options.quoted || null
    };

    return await conn.sendMessage(jid, message, sendOptions);

  } catch (err) {
    console.error("sendFile error:", err);
    throw err;
  }
};

  conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
    let mime = "";
    let res = await axios.head(url);
    mime = res.headers["content-type"];
    if (mime.split("/")[1] === "gif") {
      return conn.sendMessage(
        jid, {
          video: await getBuffer(url),
          caption: caption,
          gifPlayback: true,
          ...options,
        }, {
          quoted: quoted,
          ...options,
        },
      );
    }
    let type = mime.split("/")[0] + "Message";
    if (mime === "application/pdf") {
      return conn.sendMessage(
        jid, {
          document: await getBuffer(url),
          mimetype: "application/pdf",
          caption: caption,
          ...options,
        }, {
          quoted: quoted,
          ...options,
        },
      );
    }
    if (mime.split("/")[0] === "image") {
      return conn.sendMessage(
        jid, {
          image: await getBuffer(url),
          caption: caption,
          ...options,
        }, {
          quoted: quoted,
          ...options,
        },
      );
    }
    if (mime.split("/")[0] === "video") {
      return conn.sendMessage(
        jid, {
          video: await getBuffer(url),
          caption: caption,
          mimetype: "video/mp4",
          ...options,
        }, {
          quoted: quoted,
          ...options,
        },
      );
    }
    if (mime.split("/")[0] === "audio") {
      return conn.sendMessage(
        jid, {
          audio: await getBuffer(url),
          caption: caption,
          mimetype: "audio/mpeg",
          ...options,
        }, {
          quoted: quoted,
          ...options,
        },
      );
    }
  };

  conn.sendPoll = (jid, name = "", values = [], selectableCount = 1) => {
  return conn.sendMessage(jid, {
  poll: {
  name,
  values,
  selectableCount,
  },
  });
  };
  


  // ── PORTED FROM ELAINA ──────────────────────────────────────────────────────

  // chats store untuk loadMessage, pushMessage, processMessageStubType, insertAllGroup
  if (!conn.chats) conn.chats = {}

  conn.logger = {
    info: (...args) => console.log(chalk.bold.bgRgb(51, 204, 51)('INFO '), chalk.cyan(args.join(' '))),
    error: (...args) => console.log(chalk.bold.bgRgb(247, 38, 33)('ERROR '), chalk.rgb(255, 38, 0)(args.join(' '))),
    warn: (...args) => console.log(chalk.bold.bgRgb(255, 153, 0)('WARNING '), chalk.redBright(args.join(' '))),
    trace: (...args) => console.log(chalk.grey('TRACE '), chalk.white(args.join(' '))),
    debug: (...args) => console.log(chalk.bold.bgRgb(102, 102, 102)('DEBUG '), chalk.white(args.join(' '))),
    fatal: (...args) => console.log(chalk.bold.bgRgb(128, 0, 0)('FATAL '), chalk.rgb(255, 0, 0)(args.join(' '))),
    child: () => conn.logger
  }

  conn.smlcap = function(text, except = []) {
    if (!text) return text
    let regex = /(wa.me|https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi
    let link = text.match(regex)
    let smlcap = res => res.replace(/a|A/g, "ᴀ").replace(/b|B/g, "ʙ").replace(/c|C/g, "ᴄ").replace(/d|D/g, "ᴅ").replace(/e|E/g, "ᴇ").replace(/f|F/g, "ꜰ").replace(/g|G/g, "ɢ").replace(/h|H/g, "ʜ").replace(/i|I/g, "ɪ").replace(/j|J/g, "ᴊ").replace(/k|K/g, "ᴋ").replace(/l|L/g, "ʟ").replace(/m|M/g, "ᴍ").replace(/n|N/g, "ɴ").replace(/o|O/g, "ᴏ").replace(/p|P/g, "ᴘ").replace(/q|Q/g, "ǫ").replace(/r|R/g, "ʀ").replace(/s|S/g, "ꜱ").replace(/t|T/g, "ᴛ").replace(/u|U/g, "ᴜ").replace(/v|V/g, "ᴠ").replace(/w|W/g, "ᴡ").replace(/x|X/g, "x").replace(/y|Y/g, "ʏ").replace(/z|Z/g, "ᴢ")
    let result = smlcap(text)
    if (except && except.length > 0) {
      for (let i = 0; i < except.length; i++) result = result.replace(smlcap(except[i]), except[i])
    }
    if (link) {
      for (let i = 0; i < link.length; i++) result = result.replace(smlcap(link[i]), link[i])
    }
    return result
  }

  conn.adReply = async (jid, text, title = "", body = "", thumbnail, source = "", quoted, large = true, options = {}) => {
    let thumbData
    if (thumbnail) {
      try {
        if (Buffer.isBuffer(thumbnail)) {
          thumbData = thumbnail
        } else if (typeof thumbnail === "string" && /^https?:\/\//.test(thumbnail)) {
          const res = await fetch(thumbnail)
          thumbData = Buffer.from(await res.arrayBuffer())
        } else if (typeof thumbnail === "string" && require("fs").existsSync(thumbnail)) {
          thumbData = require("fs").readFileSync(thumbnail)
        }
      } catch { thumbData = null }
    }
    return conn.sendMessage(jid, {
      text,
      contextInfo: {
        mentionedJid: conn.parseMention(text)
      }
    }, { quoted, ...options })
  }

  conn.resize = (buffer, uk1, uk2) => {
    return new Promise(async (resolve, reject) => {
      try {
        const Jimp = (await import("jimp")).default
        let baper = await Jimp.read(buffer)
        let result = await baper.resize(uk1, uk2).getBufferAsync(Jimp.MIME_JPEG)
        resolve(result)
      } catch (e) { reject(e) }
    })
  }

  conn.downloadM = async (m, type, saveToFile = false) => {
    let filename
    if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
    const stream = await downloadContentFromMessage(m, type)
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (saveToFile) {
      const { data: saved } = await conn.getFile(buffer, true)
      filename = saved
    }
    return saveToFile && filename ? filename : buffer
  }

  conn.loadMessage = (messageID) => {
    return Object.entries(conn.chats || {})
      .filter(([_, { messages }]) => typeof messages === "object")
      .find(([_, { messages }]) => Object.entries(messages)
        .find(([k, v]) => (k === messageID || v.key?.id === messageID)))
      ?.[1].messages?.[messageID]
  }

  conn.fakeReply = (jid, text = "", fakeJid = conn.user.jid, fakeText = "", fakeGroupJid, options) => {
    return conn.reply(jid, text, {
      key: {
        fromMe: areJidsSameUser(fakeJid, conn.user.id),
        participant: fakeJid,
        ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {})
      },
      message: { conversation: fakeText },
      ...options
    })
  }

  conn.cMod = (jid, message, text = "", sender = conn.user.jid, options = {}) => {
    if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions]
    let copy = message.toJSON()
    delete copy.message.messageContextInfo
    delete copy.message.senderKeyDistributionMessage
    let mtype = Object.keys(copy.message)[0]
    let msg = copy.message
    let mcontent = msg[mtype]
    if (typeof mcontent === "string") msg[mtype] = text || mcontent
    else if (mcontent.caption) mcontent.caption = text || mcontent.caption
    else if (mcontent.text) mcontent.text = text || mcontent.text
    if (typeof mcontent !== "string") {
      msg[mtype] = { ...mcontent, ...options }
      msg[mtype].contextInfo = {
        ...(mcontent.contextInfo || {}),
        mentionedJid: options.mentions || mcontent.contextInfo?.mentionedJid || []
      }
    }
    if (copy.participant) sender = copy.participant = sender || copy.participant
    else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
    if (copy.key.remoteJid.includes("@s.whatsapp.net")) sender = sender || copy.key.remoteJid
    else if (copy.key.remoteJid.includes("@broadcast")) sender = sender || copy.key.remoteJid
    copy.key.remoteJid = jid
    copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false
    return proto.WebMessageInfo.fromObject(copy)
  }

  conn.relayWAMessage = async (pesanfull) => {
    if (pesanfull.message.audioMessage) {
      await conn.sendPresenceUpdate("recording", pesanfull.key.remoteJid)
    } else {
      await conn.sendPresenceUpdate("composing", pesanfull.key.remoteJid)
    }
    const mekirim = await conn.relayMessage(pesanfull.key.remoteJid, pesanfull.message, { messageId: pesanfull.key.id })
    conn.ev.emit("messages.upsert", { messages: [pesanfull], type: "append" })
    return mekirim
  }

  conn.processMessageStubType = async (m) => {
    if (!m.messageStubType) return
    const chat = conn.decodeJid(m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || "")
    if (!chat || chat === "status@broadcast") return
    const emitGroupUpdate = (update) => conn.ev.emit("groups.update", [{ id: chat, ...update }])
    switch (m.messageStubType) {
      case WAMessageStubType.REVOKE:
      case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
        emitGroupUpdate({ revoke: m.messageStubParameters?.[0] }); break
      case WAMessageStubType.GROUP_CHANGE_ICON:
        emitGroupUpdate({ icon: m.messageStubParameters?.[0] }); break
    }
    const isGroup = chat.endsWith("@g.us")
    if (!isGroup) return
    let chats = conn.chats[chat]
    if (!chats) chats = conn.chats[chat] = { id: chat }
    chats.isChats = true
    const metadata = await conn.groupMetadata(chat).catch(_ => null)
    if (!metadata) return
    chats.subject = metadata.subject
    chats.metadata = metadata
  }

  conn.insertAllGroup = async () => {
    const groups = await conn.groupFetchAllParticipating().catch(_ => null) || {}
    for (const group in groups) {
      conn.chats[group] = {
        ...(conn.chats[group] || {}),
        id: group,
        subject: groups[group].subject,
        isChats: true,
        metadata: groups[group]
      }
    }
    return conn.chats
  }

  conn.pushMessage = async (m) => {
    if (!m) return
    if (!Array.isArray(m)) m = [m]
    for (const message of m) {
      try {
        if (!message) continue
        if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT)
          conn.processMessageStubType(message).catch(console.error)
        const _mtype = Object.keys(message.message || {})
        const mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(_mtype[0]) && _mtype[0]) ||
          (_mtype.length >= 3 && _mtype[1] !== 'messageContextInfo' && _mtype[1]) ||
          _mtype[_mtype.length - 1]
        const chat = conn.decodeJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '')
        if (!chat || chat === 'status@broadcast') continue
        const isGroup = chat.endsWith('@g.us')
        let chats = conn.chats[chat]
        if (!chats) {
          if (isGroup) await conn.insertAllGroup().catch(console.error)
          chats = conn.chats[chat] = { id: chat, isChats: true, ...(conn.chats[chat] || {}) }
        }
        let metadata, sender
        if (isGroup) {
          if (!chats.subject || !chats.metadata) {
            metadata = await conn.groupMetadata(chat).catch(_ => ({})) || {}
            if (!chats.subject) chats.subject = metadata.subject || '' 
            if (!chats.metadata) chats.metadata = metadata
          }
          sender = conn.decodeJid(message.key?.fromMe && conn.user.id || message.participant || message.key?.participant || chat || '')
          if (sender !== chat) {
            let senderChat = conn.chats[sender]
            if (!senderChat) senderChat = conn.chats[sender] = { id: sender }
            if (!senderChat.name) senderChat.name = message.pushName || senderChat.name || '' 
          }
        } else if (!chats.name) chats.name = message.pushName || chats.name || '' 
        if (['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype)) continue
        chats.isChats = true
        if (!chats.messages) chats.messages = {}
        const fromMe = message.key.fromMe || areJidsSameUser(sender || chat, conn.user.id)
        if (!['protocolMessage'].includes(mtype) && !fromMe && message.messageStubType != WAMessageStubType.CIPHERTEXT && message.message) {
          delete message.message.messageContextInfo
          delete message.message.senderKeyDistributionMessage
          chats.messages[message.key.id] = JSON.parse(JSON.stringify(message, null, 2))
          let chatsMessages
          if ((chatsMessages = Object.entries(chats.messages)).length > 40)
            chats.messages = Object.fromEntries(chatsMessages.slice(30, chatsMessages.length))
        }
      } catch (e) {
        // Error handling
      }
    }
  }

  conn.preSudo = async (text, who, m, chatupdate) => {
    let messages = await generateWAMessage(m.chat, { text, mentions: conn.parseMention(text) }, {
      userJid: who,
      quoted: m.quoted && m.quoted.fakeObj
    })
    messages.key.fromMe = areJidsSameUser(who, conn.user.id)
    messages.key.id = m.key.id
    messages.pushName = m.name
    if (m.isGroup) messages.key.participant = messages.participant = who
    return {
      ...chatupdate,
      messages: [proto.WebMessageInfo.fromObject(messages)],
      type: "append"
    }
  }

  conn.textList = async (jid, text, image, list = [], m, options = {}) => {
    if (!Array.isArray(list)) list = []
    const listStr = list.map(item => {
      const [, number, title] = item
      return ('*' + number + '.* ' + title).trim()
    }).join('\n')
    let caption = (text + '\n\nSilahkan Reply/Balas pesan ini dengan Angka ' + (list[0]?.[1] ?? 1) + ' - ' + list.length + (list.length === 0 ? '' : '\n' + listStr)).trim()
    if (image) {
      await conn.sendFile(jid, image, null, caption, m, false, options)
    } else {
      await conn.reply(jid, caption, m, options)
    }
  }

  conn.textOptions = async (jid, text, image, list = [], m, options = {}) => {
    if (!Array.isArray(list)) list = []
    let caption = `${text}

Silahkan Reply/Balas pesan ini dengan *${list.length > 0 ? list[0][1] : ""}`
    if (list.length > 1) caption += ` atau *${list[1][1]}*`
    caption = caption.trim()
    if (image) {
      await conn.sendFile(jid, image, null, caption, m, false, options)
    } else {
      await conn.reply(jid, caption, m, options)
    }
  }

  conn.textInput = async (jid, text, image, input, m, options = {}) => {
    let caption = text.trim()
    if (image) {
      await conn.sendFile(jid, image, null, caption, m, false, options)
    } else {
      await conn.reply(jid, caption, m, options)
    }
  }



  return conn;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const runBot = async () => {
  try {
    console.log(chalk.cyan("\n[+] Memuat plugins..."));
    await Plugins.load();
    console.log(chalk.green(`[✓] ${Object.keys(Plugins.plugins).length} plugin berhasil dimuat.`));

    await waSocket();

    setTimeout(() => {
      console.log(chalk.green(`\n[✓] ${global.botname} siap digunakan!`));
    }, 3000);

  } catch (e) {
    console.error(chalk.bgRed("[!] Gagal memulai bot:"), e);
  }
};

const startBot = async () => {
  patchBaileys();
  await runBot();
};

startBot();