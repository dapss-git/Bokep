import {
  extractMessageContent,
  jidNormalizedUser,
  areJidsSameUser,
  downloadMediaMessage,
} from "baileys";
import fs from "fs";
import { cleanJid } from "./utils.js";

/**
 * Resolve @lid → PN menggunakan participantAlt yang diisi baileys.
 * baileys mengisi key.participantAlt = PN jika key.participant adalah LID.
 * Jika participantAlt tidak ada, coba ambil dari signalRepository.
 */
const resolveLid = async (jid, altJid, conn) => {
  if (!jid) return jid;
  if (jid.endsWith("@lid")) {
    if (altJid && !altJid.endsWith("@lid")) {
      return cleanJid(altJid);
    }
    try {
      if (typeof conn.getPNForLID === "function") {
        const pn = await conn.getPNForLID(jid);
        if (pn) return cleanJid(pn);
      }
      const pn = await conn.signalRepository?.lidMapping?.getPNForLID(jid);
      if (pn) return cleanJid(pn);
      const storePn = conn.store?.lidMapping?.[jid];
      if (storePn) return cleanJid(storePn);
    } catch (e) {
      // ignore
    }
  }
  return cleanJid(jid);
};

const getDevice = (id) =>
  /^3A.{18}$/.test(id)
    ? "ios"
    : /^3E.{20}$/.test(id)
      ? "web"
      : /^(.{21}|.{32})$/.test(id)
        ? "android"
        : /^.{18}$/.test(id)
          ? "desktop"
          : "bot";

const getContentType = (content) => {
  if (!content) return;
  const keys = Object.keys(content);
  return keys.find(
    (k) =>
      (k === "conversation" ||
        k.endsWith("Message") ||
        k.includes("V2") ||
        k.includes("V3")) &&
      k !== "senderKeyDistributionMessage"
  );
};

function parseMessage(content) {
  content = extractMessageContent(content);
  if (content?.viewOnceMessageV2Extension) {
    content = content.viewOnceMessageV2Extension.message;
  }
  if (content?.protocolMessage?.type === 14) {
    const type = getContentType(content.protocolMessage);
    content = content.protocolMessage[type];
  }
  if (content?.message) {
    const type = getContentType(content.message);
    content = content.message[type];
  }
  return content;
}

export default async (raw, conn, store) => {
  if (!raw?.message) return;

  const m = {};
  m.key = raw.key;
  m.from = await resolveLid(m.key.remoteJid, m.key.remoteJidAlt, conn);
  m.chat = m.from;
  m.chatAlt = m.key.remoteJidAlt;
  m.fromMe = m.key.fromMe;
  m.message = parseMessage(raw.message);

  // m.sender: pakai participantAlt sebagai fallback jika participant adalah @lid
  // (baileys mengisi participantAlt = PN kalau participant = LID di grup, remoteJidAlt di PV)
  const isGroup = m.key.remoteJid?.endsWith("@g.us");
  const rawParticipant = m.key.participant || (isGroup ? null : m.key.remoteJid);
  const altParticipant = isGroup ? m.key.participantAlt : m.key.remoteJidAlt;
  m.sender = (await resolveLid(rawParticipant, altParticipant, conn)) || m.from;

  if (raw.message) {
    m.type = getContentType(raw.message) || Object.keys(raw.message)[0];
    m.mtype = m.type;
    m.msg = parseMessage(raw.message[m.type]) || raw.message[m.type];

    m.text =
      m.msg?.text ||
      m.msg?.conversation ||
      m.msg?.caption ||
      m.message?.conversation ||
      m.msg?.selectedButtonId ||
      m.msg?.singleSelectReply?.selectedRowId ||
      m.msg?.selectedId ||
      m.msg?.contentText ||
      m.msg?.selectedDisplayText ||
      m.msg?.title ||
      "";

    // Resolve mentions and update text if they are LIDs
    const mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
    const groupMentions =
      m.msg?.contextInfo?.groupMentions?.map((v) => v.groupJid) || [];
    const allMentions = [...mentionedJid, ...groupMentions];

    m.mentions = [];
    for (const jid of allMentions) {
      const resolved = await resolveLid(jid, null, conn);
      if (resolved) {
        const cleanResolved = cleanJid(resolved);
        m.mentions.push(cleanResolved);
        const lidNum = jid.split("@")[0];
        const pnNum = cleanResolved.split("@")[0];
        if (lidNum !== pnNum) {
          const regex = new RegExp(lidNum, "g");
          m.text = m.text.replace(regex, pnNum);
          if (m.msg?.text) m.msg.text = m.msg.text.replace(regex, pnNum);
          if (m.msg?.caption) m.msg.caption = m.msg.caption.replace(regex, pnNum);
          if (m.msg?.conversation) m.msg.conversation = m.msg.conversation.replace(regex, pnNum);
        }
      }
    }
    m.mentionedJid = m.mentions;
  }

  m.isGroup = m.from.endsWith("@g.us");
  m.isNewsletter = m.from.endsWith("@newsletter");
  m.jid = await resolveLid(
    m.fromMe ? conn.user.id : m.isGroup ? m.key.participant : m.from,
    m.isGroup ? m.key.participantAlt : m.key.remoteJidAlt,
    conn
  );

  if (m.isGroup) {
    try {
      if (!(m.from in store.groupMetadata))
        store.groupMetadata[m.from] = await conn.groupMetadata(m.from);
      m.metadata = store.groupMetadata[m.from];
    } catch (e) {
      console.error(`[SERIALIZE] Error fetching metadata for ${m.from}:`, e.message);
      m.metadata = store.groupMetadata[m.from] || {
        id: m.from,
        subject: 'Unknown Group',
        participants: []
      };
    }
  }

  m.id = raw?.key?.id || false;
  m.device = getDevice(m.id);
  m.isBot = m.id?.startsWith("BAE5") || m.device === "bot";
  m.expiration = m.msg?.contextInfo?.expiration || 0;
  m.timestamps =
    typeof raw?.messageTimestamp === "number"
      ? raw.messageTimestamp * 1000
      : m.msg?.timestampMs * 1000 || Date.now();
  m.name = raw?.pushName || conn.user?.name || "User";
  m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath;

  if (m.isMedia) {
    m.download = async () =>
      downloadMediaMessage(
        raw,
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: conn.updateMediaMessage,
        }
      );
  }

  m.reply = async (teks) => {
    let payload = typeof teks === "object" ? teks : { text: teks };
    return conn.sendMessage(m.from, payload, { quoted: raw });
  };

  m.edit = async (text, key = m.key) => {
    let payload =
      typeof text === "string" ? { text, edit: key } : { ...text, edit: key };
    return conn.sendMessage(m.from, payload, { quoted: raw });
  };

  m.react = (emoji) =>
    conn.sendMessage(m.from, { react: { text: emoji, key: m.key } });

  // --- QUOTED MESSAGE ---
  if (m.msg?.contextInfo?.quotedMessage) {
    m.quoted = {};
    const qCtx = m.msg.contextInfo;

    // contextInfo.participant sudah di-resolve baileys (@lid → PN) via patch resolveMentionedLIDs
    // cleanJid untuk strip :0 kalau ada
    const quotedParticipant =
      (await resolveLid(qCtx.participant, null, conn)) || m.from;

    const quotedRaw = {
      key: {
        remoteJid: m.from,
        fromMe: areJidsSameUser(
          quotedParticipant,
          conn.user.id.split(":")[0] + "@s.whatsapp.net"
        ),
        id: qCtx.stanzaId,
        participant: quotedParticipant,
      },
      message: qCtx.quotedMessage,
    };

    m.quoted.id = quotedRaw.key.id || null;
    m.quoted.sender = quotedParticipant;
    m.quoted.fromMe = quotedRaw.key.fromMe || false;
    m.quoted.isBot = m.quoted.id?.startsWith("BAE5") || false;
    m.quoted.message = parseMessage(quotedRaw.message);
    m.quoted.type =
      getContentType(m.quoted.message) ||
      Object.keys(m.quoted.message || {})[0];
    m.quoted.mtype = m.quoted.type;
    m.quoted.msg = m.quoted.message?.[m.quoted.type] || m.quoted.message;
    m.quoted.text =
      m.quoted.msg?.text ||
      m.quoted.msg?.conversation ||
      m.quoted.msg?.caption ||
      (typeof m.quoted.msg === "string" ? m.quoted.msg : "") ||
      "";

    // mentionedJid dari quoted (sudah di-resolve baileys, cleanJid safety)
    const qMentions = m.quoted.msg?.contextInfo?.mentionedJid || [];
    m.quoted.mentionedJid = [];
    for (const jid of qMentions) {
      const resolved = await resolveLid(jid, null, conn);
      if (resolved) {
        const cleanResolved = cleanJid(resolved);
        m.quoted.mentionedJid.push(cleanResolved);
        const lidNum = jid.split("@")[0];
        const pnNum = cleanResolved.split("@")[0];
        if (lidNum !== pnNum) {
          const regex = new RegExp(lidNum, "g");
          m.quoted.text = m.quoted.text.replace(regex, pnNum);
          if (m.quoted.msg?.text)
            m.quoted.msg.text = m.quoted.msg.text.replace(regex, pnNum);
          if (m.quoted.msg?.caption)
            m.quoted.msg.caption = m.quoted.msg.caption.replace(regex, pnNum);
          if (m.quoted.msg?.conversation)
            m.quoted.msg.conversation = m.quoted.msg.conversation.replace(
              regex,
              pnNum
            );
        }
      }
    }
    m.quoted.mentions = m.quoted.mentionedJid;
    m.quoted.isMedia =
      !!m.quoted.msg?.mimetype || !!m.quoted.msg?.thumbnailDirectPath;
    if (m.quoted.isMedia) {
      m.quoted.download = async () =>
        downloadMediaMessage(
          quotedRaw,
          "buffer",
          {},
          {
            logger: console,
            reuploadRequest: conn.updateMediaMessage,
          }
        );
    }
    // fakeObj untuk preSudo / forward
    m.quoted.fakeObj = quotedRaw;
  }

  return m;
};
