import { jidDecode, jidNormalizedUser, generateWAMessageFromContent } from "baileys";
import "./settings.js";
import util from "util";
import fs from "fs";
import Func from "./core/function.js";
import { all as buttonHandler } from './commands/_/_templateResponse.js';
import { canLevelUp } from './library/levelling.js';
import { delay } from 'baileys';
import { downloadContentFromMessage } from "baileys";

function escapeRegExp(string) {
  return string.replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, "\\$&");
}

export default async function handler(m, conn, store, cmd) {
  const fixJid = (jid) => jidNormalizedUser(jid);
  const normalize = jid => (conn.decodeJid(jid) || "").split("@")[0];

  if (!m || !m.sender) return;

  if (global.db.data == null) await global.loadDatabase();

  if (!global.db.data.users) global.db.data.users = {};

  let jid = conn.decodeJid(m.sender || m.key?.participant || m.chat);
  if (!jid) return;

  if (jid.endsWith('@lid') && m.sender && !m.sender.endsWith('@lid')) {
    jid = conn.decodeJid(m.sender);
  }

  if (!global.db.data.users[jid]) {
    global.db.data.users[jid] = {
      totalChat: 0,
      chatToday: 0,
      lastChat: 0,
      lastChatDay: new Date().toDateString()
    };
  }

  let user = global.db.data.users[jid];

  if (typeof user.totalChat !== 'number') user.totalChat = 0;
  if (typeof user.chatToday !== 'number') user.chatToday = 0;
  if (typeof user.lastChat !== 'number') user.lastChat = 0;
  if (!user.lastChatDay) user.lastChatDay = new Date().toDateString();

  let today = new Date().toDateString();
  if (user.lastChatDay !== today) {
    user.chatToday = 0;
    user.lastChatDay = today;
  }

  user.totalChat++;
  user.chatToday++;
  user.lastChat = Date.now();

  m.exp = 0
  m.exp += Math.ceil(Math.random() * 10)

  // resolve LID -> PN untuk sender, chat, dan mentions di setiap command baru
  const resolveLid = (jid) => {
    if (!jid || !jid.endsWith('@lid')) return jid
    return global.db.data.lidMapping?.[jid] || jid
  }

  m.sender = resolveLid(m.sender)
  m.chat = resolveLid(m.chat)
  if (m.mentionedJid) m.mentionedJid = m.mentionedJid.map(jid => resolveLid(jid))

  let who = m.mentionedJid?.[0]
    || m.quoted?.sender
    || m.sender
    || m.jid

  who = resolveLid(who)

  if (!global.db.data) global.db.data = {};
  if (!global.db.data.chats) global.db.data.chats = {};
  if (!global.db.data.settings) global.db.data.settings = {};

  if (!(m.sender in global.db.data.users)) {
    global.db.data.users[m.sender] = {};
  }
  const _u = global.db.data.users[m.sender];

  if (!('name' in _u))              _u.name = m.name || 'User'
  if (!('registered' in _u))        _u.registered = false
  if (!('owner' in _u))             _u.owner = false
  if (!('unreg' in _u))             _u.unreg = false
  if (!('pacar' in _u))             _u.pacar = ''
  if (!('tembak' in _u))            _u.tembak = ''
  if (!('ditembak' in _u))          _u.ditembak = false
  if (!('role' in _u))              _u.role = 'Beginner'
  if (!('skill' in _u))             _u.skill = ''
  if (!('email' in _u))             _u.email = ''
  if (!('verif' in _u))             _u.verif = false
  if (!('afkReason' in _u))         _u.afkReason = ''
  if (!('WarnReason' in _u))        _u.WarnReason = ''
  if (!('banned' in _u))            _u.banned = false
  if (!('premium' in _u))           _u.premium = false
  if (!('autolevelup' in _u))       _u.autolevelup = false
  if (!('autodownload' in _u))      _u.autodownload = false
  if (!('autoai' in _u))            _u.autoai = false
  if (!('autoaiChatId' in _u))      _u.autoaiChatId = ''
  if (!('customPrefix' in _u))      _u.customPrefix = null
  if (!('saldo' in _u))             _u.saldo = 0
  if (!('sakit' in _u))             _u.sakit = false

  const _n = (k, v = 0) => { if (!Number.isFinite(_u[k])) _u[k] = v }
  _n('money'); _n('exp'); _n('chat'); _n('chatTotal'); _n('limit', 100)
  _n('donasi'); _n('deposit'); _n('lastclaim'); _n('skata')
  _n('konten'); _n('follower'); _n('lasttiktokkonten')
  _n('pc'); _n('lastseen'); _n('pacaranTime')
  _n('age', -1); _n('regTime', -1)
  _n('afk', -1); _n('unbanwa'); _n('bannedTime'); _n('warning')
  _n('level'); _n('command'); _n('commandTotal'); _n('commandLimit', 50); _n('cmdLimitMsg')
  _n('chip'); _n('atm'); _n('fullatm'); _n('bank'); _n('dosa'); _n('penjara'); _n('bounty'); _n('asuransi')
  _n('health', 100); _n('energy', 100); _n('sleep', 100); _n('potion', 10)
  _n('trash'); _n('wood'); _n('rock'); _n('string'); _n('petfood')
  _n('emerald'); _n('diamond'); _n('gold'); _n('botol'); _n('kardus')
  _n('kaleng'); _n('gelas'); _n('plastik'); _n('iron')
  _n('common'); _n('uncommon'); _n('mythic'); _n('legendary')
  _n('umpan'); _n('pet')
  _n('paus'); _n('kepiting'); _n('gurita'); _n('cumi'); _n('buntal')
  _n('dory'); _n('lumba'); _n('lobster'); _n('hiu'); _n('udang')
  _n('orca'); _n('ikan')
  _n('banteng'); _n('gajah'); _n('harimau'); _n('kambing'); _n('panda')
  _n('buaya'); _n('kerbau'); _n('sapi'); _n('monyet')
  _n('babihutan'); _n('babi'); _n('ayam')
  _n('steak'); _n('ayam_goreng'); _n('ribs'); _n('roti')
  _n('udang_goreng'); _n('bacon'); _n('gandum'); _n('minyak'); _n('garam')
  _n('ojek'); _n('polisi'); _n('roket'); _n('taxy')
  _n('lockBankCD'); _n('lasthackbank'); _n('lastadventure'); _n('lastkill')
  _n('lastmisi'); _n('lastdungeon'); _n('lastwar'); _n('lastsda')
  _n('lastduel'); _n('lastmining'); _n('lasthunt'); _n('lastgift')
  _n('lastberkebon'); _n('lastdagang'); _n('lasthourly'); _n('lastbansos')
  _n('lastrampok'); _n('lastnebang'); _n('lastweekly'); _n('lastmonthly')
  _n('apel', 20); _n('anggur'); _n('jeruk'); _n('mangga'); _n('pisang'); _n('makanan')
  _n('bibitanggur'); _n('bibitpisang'); _n('bibitapel'); _n('bibitmangga'); _n('bibitjeruk')
  _n('horse'); _n('horseexp'); _n('horselastfeed')
  _n('cat'); _n('catexp'); _n('catlastfeed')
  _n('fox'); _n('foxexp'); _n('foxlastfeed')
  _n('dog'); _n('dogexp'); _n('doglastfeed')
  _n('robo'); _n('roboexp'); _n('robolastfeed'); _n('robodurability')
  _n('armor'); _n('armordurability')
  _n('sword'); _n('sworddurability')
  _n('pickaxe'); _n('pickaxedurability')
  _n('fishingrod'); _n('fishingroddurability')
  _n('premiumTime')

  if (!('tiktok' in _u))      _u.tiktok = { username: null, birthdate: null, konten: 0, follower: 0, money: 0 }
  if (!('sticker' in _u))     _u.sticker = {}
  if (!('invest' in _u))      _u.invest = {}
  if (!('saham' in _u))       _u.saham = {}
  if (!('task' in _u))        _u.task = {}
  if (!('historyTrx' in _u))  _u.historyTrx = []
  if (!('rumah' in _u))       _u.rumah = {}
  if (!('bisnis' in _u))      _u.bisnis = { minimarket: 0, restoran: 0, klubmalam: 0, lastprofit: 0 }

  if (typeof _u.life !== 'object' || !_u.life) _u.life = {}
  const _l = _u.life
  if (!('name' in _l))         _l.name = m.name || ''
  if (m.isTelegram && m.username) _u.username = m.username
  if (!('gender' in _l))       _l.gender = ''
  if (!('age' in _l))          _l.age = ''
  if (!('verified' in _l))     _l.verified = false
  if (!('waifu' in _l))        _l.waifu = ''
  if (!('about' in _l))        _l.about = ''
  if (!Number.isFinite(_l.exp))        _l.exp = 0
  if (!Number.isFinite(_l.lastkencan)) _l.lastkencan = 0
  if (!Number.isFinite(_l.money))      _l.money = 0
  if (!Number.isFinite(_l.gamepas))    _l.gamepas = 0
  if (!Number.isFinite(_l.id))         _l.id = Math.floor(Math.random() * 1_000_000)

  const _chatId = m.chat || m.from
  if (typeof global.db.data.chats[_chatId] !== 'object') global.db.data.chats[_chatId] = {}
  const _g = global.db.data.chats[_chatId]

  if (!('isBanned' in _g))        _g.isBanned = false
  if (!('isBannedTime' in _g))    _g.isBannedTime = false
  if (!('mute' in _g))            _g.mute = false
  if (!('bannedPlugin' in _g))    _g.bannedPlugin = []
  if (!('adminOnly' in _g))       _g.adminOnly = false
  if (!('banchat' in _g))         _g.banchat = false
  if (!('welcome' in _g))         _g.welcome = false
  if (!('detect' in _g))          _g.detect = false
  if (!('sWelcome' in _g))        _g.sWelcome = ''
  if (!('sBye' in _g))            _g.sBye = ''
  if (!('sIntro' in _g))            _g.sIntro = ''
  if (!('sPromote' in _g))        _g.sPromote = ''
  if (!('sDemote' in _g))         _g.sDemote = ''
  if (!('otakuNews' in _g))       _g.otakuNews = false
  if (!('otakuNow' in _g))        _g.otakuNow = ''
  if (!('komikuNews' in _g))      _g.komikuNews = false
  if (!('komikuNow' in _g))       _g.komikuNow = ''
  if (!('antidelete' in _g))      _g.antidelete = false
  if (!('antiLinks' in _g))       _g.antiLinks = false
  if (!('antiLinkGc' in _g))      _g.antiLinkGc = false
  if (!('antiVn' in _g))          _g.antiVn = false
  if (!('antiSticker' in _g))     _g.antiSticker = false
  if (!('antiLinkWa' in _g))      _g.antiLinkWa = false
  if (!('antiVirtex' in _g))      _g.antiVirtex = false
  if (!('antivirtex' in _g))      _g.antivirtex = false
  if (!('antiluar' in _g))        _g.antiluar = false
  if (!('antiToxic' in _g))       _g.antiToxic = false
  if (!('antiBadword' in _g))     _g.antiBadword = false
  if (!('antilink' in _g))        _g.antilink = false
  if (!('antifoto' in _g))        _g.antifoto = false
  if (!('antipolling' in _g))     _g.antipolling = false
  if (!('antivideo' in _g))       _g.antivideo = false
  if (!('antimedia' in _g))       _g.antimedia = false
  if (!('antiaudio' in _g))       _g.antiaudio = false
  if (!('antitagall' in _g))      _g.antitagall = false
  if (!('antitagsw' in _g))       _g.antitagsw = false
  if (!('antispam' in _g))        _g.antispam = false
  if (!('antibot' in _g))         _g.antibot = false
  if (!('antibugcatalog' in _g))  _g.antibugcatalog = false
  if (!('autosticker' in _g))     _g.autosticker = false
  if (!('autohd' in _g))          _g.autohd = false
  if (!('autolevelup' in _g))     _g.autolevelup = false
  if (!('autodownload' in _g))    _g.autodownload = false
  if (!('pembatasan' in _g))      _g.pembatasan = false
  if (!('viewonce' in _g))        _g.viewonce = false
  if (!('simi' in _g))            _g.simi = false
  if (!('nsfw' in _g))            _g.nsfw = false
  if (!('rpg' in _g))             _g.rpg = true
  if (!('game' in _g))            _g.game = true
  if (!('teks' in _g))            _g.teks = false
  if (!('notifgempa' in _g))      _g.notifgempa = false
  if (!('gempaDateTime' in _g))   _g.gempaDateTime = ''
  if (!('customPrefix' in _g))    _g.customPrefix = null
  if (!('nsfw' in _g))            _g.nsfw = false
  if (!('sewa' in _g))            _g.sewa = { status: false, expired: 0 }
  if (!('premium' in _g))         _g.premium = { status: false, expired: 0 }
  if (!('warnings' in _g))        _g.warnings = {}
  if (!('store' in _g))           _g.store = {}
  if (!('member' in _g))          _g.member = {}
  if (!Number.isFinite(_g.expired)) _g.expired = 0

  const _memberJid = m.sender || m.jid
  if (typeof _g.member[_memberJid] !== 'object') _g.member[_memberJid] = {}
  const _m = _g.member[_memberJid]
  if (!Number.isFinite(_m.warn))         _m.warn = 0
  if (!('blacklist' in _m))              _m.blacklist = false
  if (!Number.isFinite(_m.blacklistTime)) _m.blacklistTime = 0
  if (!Number.isFinite(_m.chat))         _m.chat = 0
  if (!Number.isFinite(_m.chatTotal))    _m.chatTotal = 0
  if (!Number.isFinite(_m.command))      _m.command = 0
  if (!Number.isFinite(_m.commandTotal)) _m.commandTotal = 0
  if (!Number.isFinite(_m.lastseen))     _m.lastseen = 0

  const _botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
  if (typeof global.db.data.settings[_botJidKey] !== 'object') global.db.data.settings[_botJidKey] = {}
  const _s = global.db.data.settings[_botJidKey]
  if (!('self' in _s))          _s.self = false
  if (!('autoread' in _s))      _s.autoread = true
  if (!('composing' in _s))     _s.composing = false
  if (!('restrict' in _s))      _s.restrict = true
  if (!('autorestart' in _s))   _s.autorestart = true
  if (!('backup' in _s))        _s.backup = false
  if (!('cleartmp' in _s))      _s.cleartmp = false
  if (!('anticall' in _s))      _s.anticall = true
  if (!('adReply' in _s))       _s.adReply = false
  if (!('smlcap' in _s))        _s.smlcap = false
  if (!('noerror' in _s))       _s.noerror = false
  if (!('online' in _s))        _s.online = true
  if (!('gconly' in _s))        _s.gconly = false
  if (!('pvonly' in _s))        _s.pvonly = false
  if (!('maintenance' in _s))   _s.maintenance = false
  if (!('autowd' in _s))        _s.autowd = false
  if (!('autoblock' in _s))     _s.autoblock = false
  if (!('bannedPlugin' in _s))  _s.bannedPlugin = []

  if (typeof global.db.data.bots !== 'object') global.db.data.bots = {}
  const _b = global.db.data.bots
  if (!('replyText' in _b))    _b.replyText = {}
  if (!('rating' in _b))       _b.rating = {}
  if (!('users' in _b))        _b.users = {}
  if (!('menfess' in _b))      _b.menfess = {}
  if (!('anonymous' in _b))    _b.anonymous = {}
  if (!('absen' in _b))        _b.absen = {}
  if (!('ultah' in _b))        _b.ultah = {}
  if (!('logs' in _b))         _b.logs = {}
  if (!('gempaDateTime' in _b)) _b.gempaDateTime = ''
  if (!('otakuNow' in _b))     _b.otakuNow = ''
  if (!('komikuNow' in _b))    _b.komikuNow = ''
  if (!('sellRumah' in _b))    _b.sellRumah = {}
  if (!('maintenance' in _b))  _b.maintenance = false
  if (!('stock' in _b))        _b.stock = JSON.parse(fs.readFileSync('./json/stock.json', 'utf-8'))
  if (!('invest' in _b))       _b.invest = JSON.parse(fs.readFileSync('./json/crypto.json', 'utf-8'))
  const _rumahJson = JSON.parse(fs.readFileSync('./json/rumah.json', 'utf-8'))
  if (!('rumah' in _b) || !Array.isArray(_b.rumah) || _b.rumah.length !== _rumahJson.length) {
    _b.rumah = _rumahJson
  }
  if (!('saham' in _b))        _b.saham  = JSON.parse(fs.readFileSync('./json/saham.json', 'utf-8'))

  if (typeof global.db.data.stats !== 'object') global.db.data.stats = {}

  if (typeof global.db.data.guilds !== 'object') global.db.data.guilds = {}

  await buttonHandler(m, conn, cmd);
  m.chat = m.chat || m.key?.remoteJid || m.from;

  m.reply = async function (teks) {
    if (typeof teks !== 'string') {
        let payload = typeof teks === 'object' ? teks : { text: String(teks) };
        return conn.sendMessage(m.chat, payload, { quoted: m });
    }

    const msg = generateWAMessageFromContent(
        m.chat,
        {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: global.botname || 'Bot',
                            subtitle: '',
                            hasMediaAttachment: false
                        },
                        body: {
                            text: teks
                        },
                        footer: {
                            text: ''
                        },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: 'inapp_signup',
                                    buttonParamsJson: '{}'
                                }
                            ],
                            messageParamsJson: '{}'
                        },
                        contextInfo: {
                            participant: '13135550002@s.whatsapp.net',
                            quotedMessage: {
                                groupInviteMessage: {
                                    groupJid: '0@g.us',
                                    inviteCode: 'abdinr',
                                    caption: m.name || m.pushName || 'User'
                                }
                            },
                            remoteJid: 'status@broadcast',
                            expiration: 0,
                            quotedType: 'EXPLICIT'
                        },
                        messageContextInfo: {
                            deviceListMetadata: {}
                        }
                    }
                }
            }
        },
        {}
    );

    await conn.relayMessage(
        m.chat,
        msg.message,
        {
            messageId: msg.key.id,
            additionalNodes: [
                {
                    tag: 'biz',
                    attrs: {},
                    content: [
                        {
                            tag: 'interactive',
                            attrs: {
                                type: 'native_flow',
                                v: '1'
                            },
                            content: [
                                {
                                    tag: 'native_flow',
                                    attrs: {
                                        v: '9',
                                        name: 'mixed'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    );
    return msg;
  };

  const sender = fixJid(conn.decodeJid(m.sender || m.jid));

  const toNum = (jid) => (jid + "").replace(/[^0-9]/g, "");
  const senderNum = toNum(sender);

  const ownerLocal = (global.owner || [])
    .filter(j => {
      if (Array.isArray(j)) return j[2] !== false;
      return true;
    })
    .map(j => {
      let jid = Array.isArray(j) ? j[0] : j;
      if (!jid) return null;
      return toNum(jid);
    })
    .filter(Boolean);

  const ownerDB = (global.db.data.owner || [])
    .map(j => {
      if (!j) return null;
      return toNum(j);
    })
    .filter(Boolean);

  const botJid = fixJid(conn.decodeJid(conn.user.id));
  const botNum = toNum(botJid);

  const isOwner = [...ownerLocal, ...ownerDB, botNum].includes(senderNum);

  let group = {};
  if (m.isGroup) {
    group = global.db.data.chats[m.chat] || {};
  }

  const isPremium =
    user.premium?.status ||
    group?.premium?.status ||
    isOwner;

  const groupMetadata = m.isGroup && m.metadata ? m.metadata : {};

  let isAdmin = false;

  if (m.isGroup && groupMetadata.participants) {
    const owners = [
      groupMetadata.owner,
      groupMetadata.subjectOwner,
      groupMetadata.ownerPn,
      groupMetadata.subjectOwnerPn
    ]
      .filter(Boolean)
      .map(jid => normalize(jid));

    const senderNum = normalize(sender);

    const isParticipantAdmin = groupMetadata.participants.some(p => {
      const pid = normalize(p.id);
      const ppn = normalize(p.phoneNumber || "");
      const match = pid === senderNum || ppn === senderNum;
      return match && (p.admin === "admin" || p.admin === "superadmin");
    });

    isAdmin = isParticipantAdmin || owners.includes(senderNum);
  }

  let isBotAdmin = false;

  if (m.isGroup && groupMetadata.participants) {
    const botNum = normalize(botJid);

    if (typeof m.isBotAdmin === "boolean") {
      isBotAdmin = m.isBotAdmin;
    }

    if (!isBotAdmin) {
      const owners = [
        groupMetadata.owner,
        groupMetadata.subjectOwner,
        groupMetadata.ownerPn,
        groupMetadata.subjectOwnerPn
      ]
        .filter(Boolean)
        .map(j => normalize(j));

      if (owners.includes(botNum)) isBotAdmin = true;
    }

    if (!isBotAdmin) {
      isBotAdmin = groupMetadata.participants.some(p => {
        const pid = normalize(p.id);
        const ppn = normalize(p.phoneNumber || "");
        const match = pid === botNum || ppn === botNum;
        return match && (p.admin === "admin" || p.admin === "superadmin");
      });
    }
  }

  isAdmin = !!isAdmin;
  isBotAdmin = !!isBotAdmin;

  // 1. Handle message transformations first (Reactions, Stickers)
  if (m.mtype === 'reactionMessage') {
  const { key, text: reactionText } = m.msg
  if (reactionText && key) {
    if (['📷', '📸'].includes(reactionText)) {
      try {
        const targetMsg = store.messages[m.chat]?.get(key.id)
        if (!targetMsg) {
          await conn.sendReact(m.chat, '❌', key)
          return
        }
        const msgObj =
          targetMsg.message?.viewOnceMessageV2?.message ||
          targetMsg.message?.viewOnceMessageV2Extension?.message ||
          targetMsg.message?.viewOnceMessage?.message ||
          targetMsg.message
        if (!msgObj) {
          await conn.sendReact(m.chat, '❌', key)
          return
        }
        const media =
          msgObj.imageMessage ||
          msgObj.videoMessage ||
          msgObj.audioMessage ||
          msgObj.documentMessage
        if (!media) {
          await conn.sendReact(m.chat, '❌', key)
          return
        }
        const msgType = Object.keys(targetMsg.message)[0]
        const stream = await downloadContentFromMessage(
          media,
          msgType.replace('Message', '') || 'document'
        )
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
        }
        if (!buffer) {
          await conn.sendReact(m.chat, '❌', key)
          return
        }
        const mime = media.mimetype || ''
        let type, ext
        if (mime.startsWith('image/')) { type = 'image'; ext = 'jpg' }
        else if (mime.startsWith('video/')) { type = 'video'; ext = 'mp4' }
        else if (mime.startsWith('audio/')) { type = 'audio'; ext = 'mp3' }
        else if (mime) { type = 'document'; ext = 'bin' }
        else {
          await conn.sendReact(m.chat, '❌', key)
          return
        }
        const caption = media.caption || '🔓 View-once berhasil dibuka'
        const targetChat = reactionText === '📷' ? m.chat : m.sender
        await conn.sendMessage(targetChat, {
          [type]: buffer,
          mimetype: mime,
          caption: caption,
          ...(type === 'document' ? { fileName: `viewonce.${ext}` } : {})
        })
        await conn.sendReact(m.chat, reactionText === '📷' ? '✅' : '📩', key)
      } catch (e) {
        console.error('[READ-VIEWONCE-REACTION]', e)
        await conn.sendReact(m.chat, '❌', key)
      }
      return
    }
  }
}
//React Dmsg
  if (m.mtype === 'reactionMessage') {
    const { key, text: reactionText } = m.msg;
    if (reactionText && key) {
      if (['👍', '😂', '😘'].includes(reactionText)) {
        if (key.fromMe || isAdmin || isOwner) {
          try {
            const chatId = m.chat;
            const stanzaId = key.id;

            const tempId = await conn.relayMessage(
                chatId,
                {
                    groupStatusMessageV2: {
                        message: {
                            extendedTextMessage: {
                                text: '',
                                contextInfo: {
                                    isGroupStatus: true,
                                },
                            },
                        },
                    },
                },
                {}
            );

            const tempId2 = await conn.relayMessage(
                chatId,
                {
                    protocolMessage: {
                        key: {
                            jid: chatId,
                            fromMe: true,
                            id: tempId,
                        },
                        type: 14,
                        editedMessage: {
                            extendedTextMessage: {
                                text: '\0',
                                contextInfo: {
                                    isGroupStatus: false,
                                },
                            },
                        },
                    },
                },
                {
                    messageId: stanzaId,
                }
            );

            await delay(50);

            await Promise.allSettled([
                conn.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        id: tempId,
                        fromMe: true,
                    },
                }),
                conn.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        id: tempId2,
                        fromMe: true,
                    },
                }),
            ]);
          } catch (e) {
            console.error('[dmsg-reaction]', e);
          }
        }
        return;
      }
    }
}
  // --- Reaction Message Handling ---
  if (m.mtype === 'reactionMessage') {
    const { key, text: reactionText } = m.msg;
    if (reactionText && key) {
      if (['🗑️', '❌', '🗑'].includes(reactionText)) {
        if (key.fromMe || isAdmin || isOwner) {
          await conn.sendMessage(m.chat, { delete: key }).catch(() => {});
        }
        return;
      }
      if (!store || !store.messages || !store.messages[m.chat]) return;
      const targetMsg = store.messages[m.chat]?.get(key.id);
      if (!targetMsg) return;
      const content = targetMsg?.message?.conversation || 
                      targetMsg?.message?.extendedTextMessage?.text || 
                      targetMsg?.message?.imageMessage?.caption || 
                      targetMsg?.message?.videoMessage?.caption;
      if (!content) return;
      if (['🔍', '🔎'].includes(reactionText)) { m.mtype = 'conversation'; m.text = '.pins ' + content; }
      else if (reactionText === '🗣️') { m.mtype = 'conversation'; m.text = '.tts id ' + content; }
      else if (reactionText === '🌐') { m.mtype = 'conversation'; m.text = '.googleai terjemahkan ke bahasa indonesia: ' + content; }
      else if (reactionText === '🪄') {
        const isMedia = targetMsg?.message?.imageMessage || targetMsg?.message?.videoMessage;
        if (isMedia) { m.mtype = 'conversation'; m.text = '.s'; m.quoted = { key, message: targetMsg.message }; }
      }
      else if (reactionText === '🤖') { m.mtype = 'conversation'; m.text = '.googleai jelaskan maksud pesan ini: ' + content; }
      else if (reactionText === '📌') { if (isAdmin || isOwner) { m.mtype = 'conversation'; m.text = '.pin'; m.quoted = { key, message: targetMsg?.message }; } }
      else if (['🎵', '🎧'].includes(reactionText)) { m.mtype = 'conversation'; m.text = '.play ' + content; }
      else if (reactionText === '📥') { if (Func.isUrl(content)) { m.mtype = 'conversation'; m.text = '.get ' + content; } }
      else if (reactionText === '⚠️') { if (isAdmin || isOwner) { m.mtype = 'conversation'; m.text = '.warn'; m.quoted = { key, message: targetMsg?.message, sender: targetMsg?.participant || targetMsg?.key?.participant || m.chat }; } }
      else if (reactionText === '🚫') { if (isAdmin || isOwner) { m.mtype = 'conversation'; m.text = '.kick'; m.quoted = { key, message: targetMsg?.message, sender: targetMsg?.participant || targetMsg?.key?.participant || m.chat }; } }
      else if (reactionText === 'ℹ️') { m.mtype = 'conversation'; m.text = '.profile'; m.quoted = { key, message: targetMsg?.message, sender: targetMsg?.participant || targetMsg?.key?.participant || m.chat }; }
      else if (reactionText === '🔳') { m.mtype = 'conversation'; m.text = '.qr ' + content; }
    }
  }

  // --- Sticker Command Handling ---
  if (m?.mtype === 'stickerMessage' || m?.type === 'stickerMessage' || m?.message?.stickerMessage) {
    const sha = m.fileSha256 || m.fileEncSha256 || m.message?.stickerMessage?.fileSha256 || m.message?.stickerMessage?.fileEncSha256;
    if (sha) {
      const hash = Buffer.from(sha).toString('base64');
      const users = global.db.data?.users || {};
      for (const jid in users) {
        const sticker = users[jid]?.sticker;
        if (sticker && sticker[hash]) {
          const cmdData = sticker[hash];
          if (!(cmdData.locked && cmdData.creator !== m.sender)) {
            const prefix = users[jid]?.customPrefix || '.';
            m.text = prefix + cmdData.text;
            break;
          }
        }
      }
    }
  }

  // 2. Base Command / Prefix Calculation
  m.text = (m.text || "").trim();
  let customPrefix = null;
  if (user.customPrefix) customPrefix = user.customPrefix;
  else if (m.isGroup && group?.customPrefix) customPrefix = group.customPrefix;

  const prefix = customPrefix ?
    (m.text.startsWith(customPrefix) ? customPrefix :
      (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text) ? m.text.match(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/gi)[0] : null)) :
    (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text) ? m.text.match(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/gi)[0] : null);

  const command = m.text && prefix ? (prefix ? m.text.replace(prefix, "") : m.text).trim().split(/ +/).shift().toLowerCase() : "";
  const text = m.text && prefix ? m.text.replace(new RegExp("^" + escapeRegExp(prefix || "") + "\\s*" + escapeRegExp(command), "i"), "").trim() : "";
  const args = text.split(/ +/).filter(a => a);
  m.isCommand = !!command;

  // 3. Before Handlers
  for (let handler of Object.values(cmd.plugins)) {
    if (typeof handler.before === 'function') {
      const allow = await handler.before(m, {
        conn, store, db: global.db, isAdmin, isBotAdmin, isOwner, isPremium, user, group,
        usedPrefix: prefix || '', command, text, args
      });
      if (allow === false) return;
    }
  }

  // Pengecekan blokir dipindah ke sini (setelah Before Handlers)
  if (_s.autoblock && !m.isGroup && !isOwner) {
    await m.reply("⚠️ *AUTO BLOCK AKTIF*\n\nMaaf, bot tidak menerima chat pribadi. Anda akan diblokir otomatis.");
    await conn.updateBlockStatus(m.sender, "block");
    return;
  }

  if (_s.self && !isOwner) return;
  if (_s.maintenance && !isOwner) return;
  if (_s.gconly && !m.isGroup && !isOwner) return;
  if (_s.pvonly && m.isGroup && !isOwner) return;
  if (_g.banchat && !isOwner) return;
  if (_g.mute && !isAdmin && !isOwner) return;
  if (user.banned && !isOwner) return;

  if (_s.autoread) {
    conn.readMessages([m.key]);
  }

  if (global.settings?.online) {
    conn.sendPresenceUpdate('available', m.chat);
  }

  if (m.quoted && m.sender) {
    const sessionKey = `${m.from}:${m.sender}`;
    const session = global.interactiveSessions.get(sessionKey);

    if (session && session.messageId === m.quoted.id) {
      try {
        await session.callback(m);
        global.interactiveSessions.delete(sessionKey);
      } catch (e) {
        m.reply("Terjadi kesalahan saat memproses balasan Anda.");
        console.error("Interactive Session Error:", e);
      }
      return;
    }
  }

  const ctx = { conn, isOwner, isPremium, isAdmin, isBotAdmin, user, group, settings: _s, db: global.db, Func, store, cmd, who };

  for (let handler of Object.values(cmd.plugins)) {
    if (typeof handler !== 'function' && typeof handler !== 'object') continue;
    if (typeof handler.onMessage === 'function') {
      await handler.onMessage(m, { conn, store, text, args, isOwner, isPremium, isAdmin, isBotAdmin, user, group, settings: _s, db: global.db, Func, who });
    }
  }

  if (command) {
    let handled = false;
    for (let [path, handler] of Object.entries(cmd.plugins)) {
      if (typeof handler !== 'function' && typeof handler !== 'object') continue;

      if (handler.customPrefix instanceof RegExp) continue;

      let isCmd = false;
      if (handler.command instanceof RegExp) {
        isCmd = handler.command.test(command);
      } else if (Array.isArray(handler.command)) {
        isCmd = handler.command.some(c =>
          c instanceof RegExp ? c.test(command) : typeof c === "string" && c.toLowerCase() === command
        );
      } else if (typeof handler.command === "string") {
        isCmd = handler.command.toLowerCase() === command;
      }

      if (!isCmd) continue;

      try {
        m.plugin = path.split('/').pop()
        
        const g = global.db.data.chats[m.chat] || {};
        if (m.isGroup && g.bannedPlugin && g.bannedPlugin.includes(m.plugin)) {
            m.reply(`🚫 Fitur *${m.plugin.replace('.js', '')}* sedang dinonaktifkan di grup ini oleh Admin.`);
            continue;
        }
        
        if (handler.owner && !isOwner) { m.reply("Perintah ini hanya untuk Owner Bot."); continue; }
        if (handler.premium && !isPremium) { m.reply("Perintah ini hanya untuk pengguna Premium."); continue; }
        if (handler.group && !m.isGroup) { m.reply("Perintah ini hanya untuk di grup."); continue; }
        if (handler.admin && !isAdmin && !isOwner) { m.reply("Perintah ini hanya untuk admin grup."); continue; }
        if (handler.botAdmin && !isBotAdmin) { m.reply("Bot harus admin untuk menjalankan perintah ini."); continue; }
        if (handler.nsfw && m.isGroup) {
          const g = global.db.data.chats[m.chat];
          if (!g || !g.nsfw) { m.reply("🚫 Admin menonaktifkan fitur *Nsfw* di group ini!"); continue; }
        }
        if (handler.game && m.isGroup) {
          const g = global.db.data.chats[m.chat];
          if (!g || !g.game) { m.reply("🚫 Admin menonaktifkan fitur *Game* di group ini!"); continue; }
        }
        if (handler.rpg && m.isGroup) {
          const g = global.db.data.chats[m.chat];
          if (!g || !g.rpg) { m.reply("🚫 Admin menonaktifkan fitur *Rpg* di group ini!"); continue; }
        }
        if (handler.rpg && user.penjara > 0) {
          if (!['kabur', 'suap', 'topdosa', 'bounty'].includes(command)) {
            m.reply("👮‍♂️ Kamu sedang berada di dalam penjara! Kamu tidak bisa menggunakan fitur RPG selain *.kabur* atau *.suap*.");
            continue;
          }
        }
        if (handler.rpg && user.sakit) {
          if (command !== 'berobat') {
            user.health -= 5;
            if (user.health < 0) user.health = 0;
            if (Math.random() < 0.4) {
              m.reply("🤧 *UHUK UHUK!* Kamu sedang sakit! Aktivitasmu gagal karena tubuhmu terlalu lemah. Segera *.berobat* ke rumah sakit!");
              continue;
            }
          }
        }
        if (handler.register && !user.registered) { m.reply("Anda harus daftar dulu.\nKetik: .daftar"); continue; }
        
        if (handler.energy && user.energy < handler.energy) {
          m.reply(`Energi Anda tidak cukup. Diperlukan *${handler.energy}* energi.\nKetik *.energy* untuk cek sisa energi.`);
          continue;
        }

        // Increment command counters
        user.commandTotal = (user.commandTotal || 0) + 1;
        
        await handler(m, { ...ctx, text, args, usedPrefix: prefix, command });

        if (handler.energy) {
          Func.useEnergy(user, handler.energy);
        }

        // Only deduct limit if command executed successfully
        if (handler.limit && !isOwner && !isPremium) {
          const limitAmount = typeof handler.limit === 'number' ? handler.limit : 1;
          const limit = Func.useLimit(user, limitAmount);
          if (!limit.success) {
            // Refund: increment back since command already ran
            user.limit = (user.limit || 0) + limitAmount;
            m.reply(`Limit Anda tidak cukup.\nSisa limit: ${limit.remaining}`);
          }
        }
        
        global.db.save();
        
        if (handler.rpg && user.dosa > 15 && user.penjara === 0) {
            user.penjara = Date.now();
            user.dosa = 0; // Reset dosa upon arrest
            setTimeout(() => {
                conn.sendMessage(m.chat, { text: `🚨 *WEE WOO WEE WOO!* 🚨\n\n@${m.sender.split("@")[0]} telah ditangkap oleh polisi karena memiliki dosa yang terlalu tinggi!\nSekarang kamu berada di dalam *Penjara*! Kamu tidak bisa menggunakan command RPG selain *.kabur* atau *.suap*.`, mentions: [m.sender] });
            }, 1000);
        }
        
        if (handler.rpg && user.health < 20 && !user.sakit && command !== 'berobat' && command !== 'heal') {
            if (Math.random() < 0.3) {
                user.sakit = true;
                setTimeout(() => {
                    conn.sendMessage(m.chat, { text: `🤒 *KAMU JATUH SAKIT!* Karena memaksakan beraktivitas dengan darah sekarat, kamu sekarang berstatus *Sakit*. Aktivitasmu berikutnya mungkin akan gagal dan darahmu akan terus berkurang! Segera *.berobat*!`, mentions: [m.sender] });
                }, 1500);
            }
        }

        let xp = 'exp' in handler ? parseInt(handler.exp) : 17
        m.exp += xp
        handled = true;
      } catch (e) {
        m.error = e;
        if (typeof e === 'string') {
          m.reply(e);
          break;
        }
        console.error(`Error pada command '${command}':`, e);
        const errorMessage = `*[ ERROR REPORT ]*\n\n*Command:* ${command}\n*User:* ${m.name} (${m.sender})\n*Error:* \n\`\`\`${util.format(e)}\`\`\``;
        for (let ownerNum of [...ownerLocal, ...ownerDB]) {
          const ownerJid = conn.isTelegram ? (isNaN(ownerNum) ? null : ownerNum) : ownerNum + '@s.whatsapp.net';
          if (ownerJid) {
            conn.sendMessage(ownerJid, { text: errorMessage }).catch(() => {});
          }
        }
        m.reply("Kesalahan terjadi. Laporan dikirim ke owner.");
      }
      break;
    }
    if (handled) return;
  }

  for (let [path, handler] of Object.entries(cmd.plugins)) {
    if (typeof handler !== 'function' && typeof handler !== 'object') continue;
    if (!(handler.customPrefix instanceof RegExp)) continue;

    const rawText = (m.text || "").trim();
    const match = rawText.match(handler.customPrefix);
    if (!match) continue;

    try {
      m.plugin = path.split('/').pop()

      const g = global.db.data.chats[m.chat] || {};
      if (m.isGroup && g.bannedPlugin && g.bannedPlugin.includes(m.plugin)) {
        m.reply(`🚫 Fitur *${m.plugin.replace('.js', '')}* sedang dinonaktifkan di grup ini oleh Admin.`);
        continue;
      }

      if (handler.owner && !isOwner) { m.reply("Perintah ini hanya untuk Owner Bot."); continue; }
      if (handler.premium && !isPremium) { m.reply("Perintah ini hanya untuk pengguna Premium."); continue; }
      if (handler.group && !m.isGroup) { m.reply("Perintah ini hanya untuk di grup."); continue; }
      if (handler.admin && !isAdmin && !isOwner) { m.reply("Perintah ini hanya untuk admin grup."); continue; }
      if (handler.botAdmin && !isBotAdmin) { m.reply("Bot harus admin untuk menjalankan perintah ini."); continue; }
      if (handler.nsfw && m.isGroup) {
        const g = global.db.data.chats[m.chat];
        if (!g || !g.nsfw) { m.reply("🚫 Admin menonaktifkan fitur *Nsfw* di group ini!"); continue; }
      }
      if (handler.game && m.isGroup) {
        const g = global.db.data.chats[m.chat];
        if (!g || !g.game) { m.reply("🚫 Admin menonaktifkan fitur *Game* di group ini!"); continue; }
      }
      if (handler.rpg && m.isGroup) {
        const g = global.db.data.chats[m.chat];
        if (!g || !g.rpg) { m.reply("🚫 Admin menonaktifkan fitur *Rpg* di group ini!"); continue; }
      }
      if (handler.rpg && user.penjara > 0) {
        if (!['kabur', 'suap', 'topdosa', 'bounty'].includes(match[0].toLowerCase())) {
          m.reply("👮‍♂️ Kamu sedang berada di dalam penjara! Kamu tidak bisa menggunakan fitur RPG selain *.kabur* atau *.suap*.");
          continue;
        }
      }
      if (handler.rpg && user.sakit) {
        if (match[0].toLowerCase() !== 'berobat') {
          user.health -= 5;
          if (user.health < 0) user.health = 0;
          if (Math.random() < 0.4) {
            m.reply("🤧 *UHUK UHUK!* Kamu sedang sakit! Aktivitasmu gagal karena tubuhmu terlalu lemah. Segera *.berobat* ke rumah sakit!");
            continue;
          }
        }
      }
      if (handler.register && !user.registered) { m.reply("Anda harus daftar dulu.\nKetik: .daftar"); continue; }
      
      // Increment command counters
      user.commandTotal = (user.commandTotal || 0) + 1;
      
      if (handler.limit && !isOwner && !isPremium) {
        const limitAmount = typeof handler.limit === 'number' ? handler.limit : 1;
        const limit = Func.useLimit(user, limitAmount);
        if (!limit.success) { m.reply(`Limit Anda tidak cukup.\nSisa limit: ${limit.remaining}`); continue; }
      }

      const textAfter = rawText.replace(handler.customPrefix, "").trim();
      await handler(m, {
        ...ctx,
        text: textAfter,
        args: textAfter.split(/ +/).filter(a => a),
        usedPrefix: "",
        command: match[0]
      });
      
      if (handler.rpg && user.dosa > 15 && user.penjara === 0) {
          user.penjara = Date.now();
          user.dosa = 0;
          setTimeout(() => {
              conn.sendMessage(m.chat, { text: `🚨 *WEE WOO WEE WOO!* 🚨\n\n@${m.sender.split("@")[0]} telah ditangkap oleh polisi karena memiliki dosa yang terlalu tinggi!\nSekarang kamu berada di dalam *Penjara*! Kamu tidak bisa menggunakan command RPG selain *.kabur* atau *.suap*.`, mentions: [m.sender] });
          }, 1000);
      }
      
      if (handler.rpg && user.health < 20 && !user.sakit && match[0].toLowerCase() !== 'berobat' && match[0].toLowerCase() !== 'heal') {
          if (Math.random() < 0.3) {
              user.sakit = true;
              setTimeout(() => {
                  conn.sendMessage(m.chat, { text: `🤒 *KAMU JATUH SAKIT!* Karena memaksakan beraktivitas dengan darah sekarat, kamu sekarang berstatus *Sakit*. Aktivitasmu berikutnya mungkin akan gagal dan darahmu akan terus berkurang! Segera *.berobat*!`, mentions: [m.sender] });
              }, 1500);
          }
      }

      let xp = 'exp' in handler ? parseInt(handler.exp) : 17
      m.exp += xp
      break;
    } catch (e) {
      m.error = e;
      if (typeof e === 'string') {
        m.reply(e);
        break;
      }
      console.error(`Error pada customPrefix command '${match[0]}':`, e);
      const errorMessage = `*[ ERROR REPORT ]*\n\n*Command:* ${match[0]}\n*User:* ${m.name} (${m.sender})\n*Error:* \n\`\`\`${util.format(e)}\`\`\``;
      for (let ownerNum of [...ownerLocal, ...ownerDB]) {
        conn.sendMessage(ownerNum + '@s.whatsapp.net', { text: errorMessage }).catch(() => {});
      }
      m.reply("Kesalahan terjadi. Laporan dikirim ke owner.");
    }
  }

  const isNumber = x => typeof x === 'number' && !isNaN(x)
  const stats = global.db.data.stats;
  if (m) {
    let user = global.db.data.users[m.sender];
    if (m.sender && user) {
      if (typeof user.exp !== 'number') user.exp = 0;
      if (typeof user.limit !== 'number') user.limit = 100;
      if (typeof user.energy !== 'number') user.energy = 100;
      
      user.exp += m.exp || 0;
      user.limit -= (m.limit || 0) * 1;
      user.energy -= (m.energy || 0) * 1;
    }

    let stat;
    if (m.plugin) {
      let now = +new Date();
      if (m.plugin in stats) {
        stat = stats[m.plugin];
        if (!isNumber(stat.total)) stat.total = 1;
        if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1;
        if (!isNumber(stat.last)) stat.last = now;
        if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now;
      } else {
        stat = stats[m.plugin] = {
          total: 1,
          success: m.error != null ? 0 : 1,
          last: now,
          lastSuccess: m.error != null ? 0 : now
        };
      }
      stat.total += 1;
      stat.last = now;
      if (m.error == null) {
        stat.success += 1;
        stat.lastSuccess = now;
      }
    }
  }
  global.db.save();
};
