import axios from "axios";
import * as cheerio from "cheerio";
import vm from "node:vm";
import crypto from "node:crypto";

const BASE = "https://snaptik.app";
const PAGE = `${BASE}/en2`;
const API = `${BASE}/abc2.php`;
const LANG = "en2";
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

// Simple cookie jar implementation
const cookieJar = new Map();

function autoToken() {
  const unix = Math.floor(Date.now() / 1000).toString();
  return `ey${Buffer.from(unix).toString("base64")}c`;
}

function saveCookies(res) {
  const cookies = res.headers["set-cookie"] || [];
  for (const cookie of cookies) {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    cookieJar.set(name.trim(), value.trim());
  }
}

function getCookieHeader() {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

function commonHeaders(extra = {}) {
  return {
    "user-agent": UA,
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "x-request-id": crypto.randomUUID(),
    ...extra
  };
}

function extractToken(html) {
  const $ = cheerio.load(html);
  return $('input[name="token"]').attr("value") || null;
}

async function openHome() {
  const res = await axios.get(PAGE, {
    timeout: 30000,
    validateStatus: () => true,
    headers: commonHeaders({
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "upgrade-insecure-requests": "1",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document"
    })
  });

  saveCookies(res);

  const html = String(res.data || "");
  const token = extractToken(html) || autoToken();

  return { status: res.status, token, html };
}

async function submitVideo(url, token) {
  const params = new URLSearchParams({ url, lang: LANG, token });
  const cookie = getCookieHeader();

  const res = await axios.post(API, params.toString(), {
    timeout: 60000,
    validateStatus: () => true,
    headers: commonHeaders({
      accept: "*/*",
      "content-type": "application/x-www-form-urlencoded",
      origin: BASE,
      referer: PAGE,
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      cookie
    })
  });

  saveCookies(res);

  return { status: res.status, body: String(res.data || "") };
}

function decodeObfuscatedResponse(body) {
  let decoded = "";

  const context = {
    console,
    Math,
    Date,
    RegExp,
    String,
    decodeURIComponent,
    escape,
    window: { location: { hostname: "snaptik.app" } },
    eval(code) {
      decoded = String(code || "");
      return decoded;
    }
  };

  try {
    vm.createContext(context);
    vm.runInContext(body, context, { timeout: 3000 });
  } catch {}

  return decoded || body;
}

async function extractResult(decodedJs) {
  const dom = new Map();

  const fakeDollar = selector => {
    if (!dom.has(selector)) {
      dom.set(selector, {
        innerHTML: "",
        style: {},
        remove() {},
        addClass() {},
        removeClass() {},
        show() {},
        hide() {},
        html(value) {
          if (value !== undefined) this.innerHTML = String(value);
          return this.innerHTML;
        }
      });
    }
    return dom.get(selector);
  };

  const context = {
    console,
    Math,
    Date,
    RegExp,
    String,
    setTimeout,
    clearTimeout,
    document: {
      getElementById() { return { src: "", style: {} }; },
      querySelector() { return { innerHTML: "", style: {} }; }
    },
    window: { location: { hostname: "snaptik.app" } },
    gtag() {},
    fetch: async () => ({ json: async () => ({}) }),
    $: fakeDollar
  };

  try {
    vm.createContext(context);
    vm.runInContext(decodedJs, context, { timeout: 3000 });
  } catch {}

  const html = dom.get("#download")?.innerHTML || decodedJs;
  const $ = cheerio.load(html);

  const links = [];

  $("a[href]").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    const href = $(el).attr("href");

    if (!href) return;

    const lowerText = text.toLowerCase();
    if (lowerText.includes("download with app")) return;
    if (lowerText.includes("download other video")) return;
    if (href === "/") return;
    if (href.includes("play.google.com")) return;

    links.push({ text: text || "Download", url: href });
  });

  return {
    title: $(".video-title").first().text().trim() || null,
    author: $(".info span").first().text().trim() || null,
    thumbnail:
      $("#thumbnail").attr("src") ||
      $(".avatar").attr("src") ||
      $("img").first().attr("src") ||
      null,
    render_token: $(".btn-render").attr("data-token") || null,
    links
  };
}

async function renderVideo(renderToken) {
  if (!renderToken) return null;

  const cookie = getCookieHeader();

  const renderRes = await axios.get(`${BASE}/render.php`, {
    timeout: 30000,
    validateStatus: () => true,
    params: { token: renderToken },
    headers: commonHeaders({ accept: "*/*", referer: PAGE, cookie })
  });

  const taskId = renderRes.data?.task_id;
  if (!taskId) return renderRes.data;

  for (let i = 0; i < 30; i++) {
    const poll = await axios.get(`${BASE}/task.php`, {
      timeout: 30000,
      validateStatus: () => true,
      params: { token: taskId },
      headers: commonHeaders({
        accept: "*/*",
        referer: PAGE,
        cookie: getCookieHeader()
      })
    });

    const data = poll.data;
    if (data?.download_url) return data;
    if (data?.status !== 0) return data;

    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  return null;
}

async function snapTik(url) {
  const home = await openHome();
  const post = await submitVideo(url, home.token);
  const decoded = decodeObfuscatedResponse(post.body);
  const result = await extractResult(decoded);

  let render = null;
  if (result.render_token) {
    render = await renderVideo(result.render_token);
  }

  const output = {
    title: result.title,
    author: result.author,
    thumbnail: result.thumbnail,
    links: result.links
  };

  if (render) output.render = render;

  return output;
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} https://vt.tiktok.com/ZS2xXXXX/`);
    
    try {
        await global.loading(m, conn);
        const res = await snapTik(text);
        
        const videoLink = res.render?.download_url || res.links[0]?.url;
        
        if (!videoLink) return m.reply("Gagal mendapatkan link video.");

        await new AIRich(conn)
            .setTitle(`🎬 *Snaptik Downloader*`)
            .setFooter(`👤 ${res.author || '-'}`)
            .addText(`📌 *Title:* ${res.title || '-'}\n👤 *Author:* ${res.author || '-'}`)
            .addVideo(`${videoLink}|0`)
            .send(m.chat, { quoted: m });
            
    } catch (e) {
        console.error(e);
        m.reply(`Terjadi kesalahan: ${e.message}`);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['snaptik <url>'];
handler.tags = ['downloader'];
handler.command = /^(snaptik)$/i;
handler.limit = true;
handler.register = true;

export default handler;
