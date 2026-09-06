import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";
import fs from "fs";
import path from "path";
import {
    proto,
    generateWAMessageContent
} from "baileys";

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
];

function getStoredCookies() {
    try {
        const filePath = path.join(process.cwd(), ".pinterest_cookies_test.json");
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
            if (data.cookies && Array.isArray(data.cookies)) {
                return data.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
            }
        }
    } catch (_e) {}
    return null;
}

async function pinterestSearch(query, type = "all", limit = 10) {
    const agent = new https.Agent({
        keepAlive: true
    });
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    let cookies = getStoredCookies();
    let csrf = "";

    try {
        if (!cookies) {
            const home = await axios.get("https://www.pinterest.com/", {
                httpsAgent: agent,
                headers: {
                    "User-Agent": ua,
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Upgrade-Insecure-Requests": "1",
                },
                timeout: 10000,
            });

            const raw = home.headers["set-cookie"] || [];
            cookies = raw.map((c) => c.split(";")[0]).join("; ");
            csrf = (raw.find((c) => c.startsWith("csrftoken=")) || "")
                .split("=")[1]
                ?.split(";")[0] || "";
        } else {
            const match = cookies.match(/csrftoken=([^;]+)/);
            if (match) csrf = match[1];
        }

        const source_url = `/search/pins/?q=${encodeURIComponent(query)}`;
        const allPins = new Map();
        let bookmarks = [];
        const maxPages = 5;

        for (let i = 0; i < maxPages; i++) {
            if (allPins.size >= limit) break;

            const data = {
                options: {
                    query,
                    field_set_key: "react_grid_pin",
                    is_prefetch: false,
                    page_size: 25,
                    ...(bookmarks.length > 0 ? {
                        bookmarks
                    } : {}),
                },
                context: {},
            };
            const body = new URLSearchParams({
                source_url,
                data: JSON.stringify(data),
            }).toString();

            const res = await axios.post(
                "https://www.pinterest.com/resource/BaseSearchResource/get/",
                body, {
                    httpsAgent: agent,
                    headers: {
                        "User-Agent": ua,
                        Accept: "application/json, text/javascript, */*; q=0.01",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "X-CSRFToken": csrf,
                        "X-Requested-With": "XMLHttpRequest",
                        Origin: "https://www.pinterest.com",
                        Referer: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`,
                        Cookie: cookies,
                    },
                    timeout: 10000,
                }
            );

            if (!res.data.resource_response || !res.data.resource_response.data) break;

            const results = res.data.resource_response.data.results || [];
            if (results.length === 0) break;

            const pins = results
                .map((p) => {
                    const result = {
                        id: p.id,
                        title: p.title || p.grid_title || p.description || "Pinterest Pin",
                        link: `https://www.pinterest.com/pin/${p.id}/`,
                        directLink: p.images?.orig?.url || p.images?.["736x"]?.url || p.images?.["236x"]?.url,
                    };

                    if (p.videos && p.videos.video_list) {
                        const videoList = p.videos.video_list;
                        const formats = ["V_720P", "V_HLSV4", "V_HLSV3_MOBILE"];
                        for (const format of formats) {
                            if (videoList[format] && videoList[format].url) {
                                let url = videoList[format].url;
                                if (url.includes("/hls/") && url.endsWith(".m3u8")) {
                                    url = url.replace("/hls/", "/720p/").replace(".m3u8", ".mp4");
                                }
                                result.videoLink = url;
                                break;
                            }
                        }
                    }
                    return result;
                })
                .filter((p) => {
                    if (!p.directLink) return false;
                    if (type === "video") return !!p.videoLink;
                    if (type === "image") return !p.videoLink;
                    return true;
                });

            pins.forEach((p) => {
                if (allPins.size < limit) allPins.set(p.link, p);
            });

            bookmarks = res.data.resource_response.bookmarks;
            if (!bookmarks || bookmarks.length === 0) break;
        }

        return Array.from(allPins.values());
    } catch (e) {
        console.error("[PINTEREST SEARCH ERROR]", e.message);
        return [];
    }
}

async function downloadPinterest(url) {
    const startTime = Date.now();
    const response = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        },
        timeout: 15000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const title =
        $('meta[property="og:title"]').attr("content") ||
        $("title").text() ||
        "Pinterest Download";
    let type = "image";
    let download_url = null;
    let download_urls;

    const videoMeta =
        $('meta[property="og:video:url"]').attr("content") ||
        $('meta[property="og:video:secure_url"]').attr("content") ||
        $('meta[name="og:video:url"]').attr("content");

    const allVideos = [];
    if (videoMeta?.includes(".mp4")) {
        allVideos.push(videoMeta);
    }

    const mp4Match = html.match(/https?:\/\/[^\s"'<>\\]+?\.mp4[^\s"'<>\\]*/g);
    if (mp4Match) {
        allVideos.push(...mp4Match);
    }

    if (allVideos.length > 0) {
        type = "video";
        const uniqueMp4 = [...new Set(allVideos)];
        download_urls = uniqueMp4;
        download_url = uniqueMp4[0];
    } else {
        const imageMeta =
            $('meta[property="og:image"]').attr("content") ||
            $('meta[name="og:image"]').attr("content");
        if (imageMeta) {
            type = "image";
            download_url = imageMeta.replace(/\/\d+x\//, "/originals/");
        }
    }

    return {
        title,
        type,
        download_url,
        download_urls,
        time_taken: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
    };
}

let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    try {
        const text = args.join(" ") || (m.quoted && (m.quoted.text || m.quoted.caption));

        if (!text) {
            return m.reply(
                `> ◦❒ *Contoh Download:* ${usedPrefix + command} https://pin.it/xxxxx\n` +
                `> ◦❒ *Contoh Search:* ${usedPrefix + command} anime aesthetic`
            );
        }

        const urlMatch = text.match(/https?:\/\/[^\s]+/i);
        const isPinUrl = urlMatch && (urlMatch[0].includes("pinterest.com") || urlMatch[0].includes("pin.it") || urlMatch[0].includes("pinterest."));

        if (isPinUrl) {
            const targetUrl = urlMatch[0];
            await m.reply("> ◦❒ Mengambil data media Pinterest... ⏳");

            const data = await downloadPinterest(targetUrl);

            if (!data || (!data.download_url && (!data.download_urls || !data.download_urls.length))) {
                return m.reply("> ◦❒ Gagal menemukan media (Gambar/Video) pada link Pinterest tersebut.");
            }

            const caption = `> ╭─❁ *PINTEREST DOWNLOADER* ❁\n` +
                `> ◦❒ *Judul:* ${data.title}\n` +
                `> ◦❒ *Tipe:* ${data.type.toUpperCase()}\n` +
                `> ╰─❁`;

            if (data.type === "video" && data.download_url) {
                return await conn.sendMessage(m.chat, {
                    video: {
                        url: data.download_url
                    },
                    caption
                }, {
                    quoted: m
                });
            } else if (data.type === "image" && data.download_url) {
                return await conn.sendMessage(m.chat, {
                    image: {
                        url: data.download_url
                    },
                    caption
                }, {
                    quoted: m
                });
            } else {
                return m.reply("> ◦❒ Gagal mengunduh media dari Pinterest.");
            }
        }

        await m.reply("> ◦❒ Mencari di Pinterest... ⏳");

        const results = await pinterestSearch(text, "all", 10);

        if (!results || !results.length) {
            return m.reply("> ◦❒ Tidak ada hasil ditemukan di Pinterest.");
        }

        const caption = `> ╭─❁ *PINTEREST SEARCH* ❁\n` +
            `> ◦❒ *Query:* ${text}\n` +
            `> ◦❒ *Total:* ${results.length} Pin\n` +
            `> ╰─❁`;

        // Slide Carousel Interaktif
        async function createHeader(item) {
            if (item.videoLink) {
                const {
                    videoMessage
                } = await generateWAMessageContent({
                    video: {
                        url: item.videoLink
                    }
                }, {
                    upload: conn.waUploadToServer
                });
                return {
                    hasMediaAttachment: true,
                    videoMessage
                };
            } else {
                const {
                    imageMessage
                } = await generateWAMessageContent({
                    image: {
                        url: item.directLink
                    }
                }, {
                    upload: conn.waUploadToServer
                });
                return {
                    hasMediaAttachment: true,
                    imageMessage
                };
            }
        }

        const cards = [];

        for (let i = 0; i < results.length; i++) {
            const item = results[i];
            const header = await createHeader(item);

            cards.push({
                body: proto.Message.InteractiveMessage.Body.fromObject({
                    text: i === 0 ? caption : `Pin ${i + 1} dari ${results.length}`
                }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({
                    text: `乂 P I N T E R E S T - S L I D E (${i + 1}/${results.length})`
                }),
                header: proto.Message.InteractiveMessage.Header.fromObject(header),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [{
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Buka di Pinterest 📌",
                            url: item.link,
                            merchant_url: item.link
                        })
                    }]
                })
            });
        }

        if (global.Carousel) {
            const carousel = new global.Carousel(conn);
            carousel.setFooter("乂 P I N T E R E S T - C A R O U S E L");
            carousel.addCard(cards);
            await carousel.send(m.chat, {
                quoted: m
            });
        } else {
            for (let i = 0; i < results.length; i++) {
                const item = results[i];
                if (item.videoLink) {
                    await conn.sendMessage(m.chat, {
                        video: {
                            url: item.videoLink
                        },
                        caption: i === 0 ? caption : undefined
                    }, {
                        quoted: m
                    });
                } else {
                    await conn.sendMessage(m.chat, {
                        image: {
                            url: item.directLink
                        },
                        caption: i === 0 ? caption : undefined
                    }, {
                        quoted: m
                    });
                }
            }
        }

    } catch (e) {
        console.error("[PINTEREST ERROR]", e);
        await m.reply(`> ◦❒ Gagal memproses Pinterest: ${e.message || "Terjadi kesalahan."}`);
    }
};

handler.help = ["pinterest", "pindl", "pins"];
handler.tags = ["download"];
handler.command = /^(pinterest|pindl|pins)$/i;
handler.limit = true;
handler.register = true;

export default handler;
