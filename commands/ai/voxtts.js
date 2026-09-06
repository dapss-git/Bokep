import axios from 'axios'
import {
    SocksProxyAgent
} from 'socks-proxy-agent'

const TARGET_URL = 'https://voxlabs.ornzora.workers.dev'
const TTS_ENDPOINT = `${TARGET_URL}/api/tts`
const SITEKEY = '0x4AAAAAADxGWHctWk2yfROX'
const BYPASS_API = 'https://api.ikyyxd.my.id/bypass/turnstile-cf-min'
const PROXY_API_URL = 'https://api.ikyyxd.my.id/v2l/proxy-free/ikyy-xsample'

class VoxTtsBot {
    constructor() {
        this.proxyList = []
        this.activeProxy = null
        this.client = null
    }

    async loadProxies() {
        try {
            const res = await axios.get(PROXY_API_URL, {
                timeout: 10000
            })
            const rawList = Array.isArray(res.data) ? res.data : []
            this.proxyList = rawList.map(p => {
                const parts = p.trim().split(':')
                return parts.length === 4 ?
                    {
                        host: parts[0],
                        port: parseInt(parts[1]),
                        userId: parts[2],
                        password: parts[3]
                    } :
                    null
            }).filter(Boolean)

            if (this.proxyList.length === 0) throw new Error('No proxies available')
        } catch (err) {
            console.warn('[VoxTTS] Gagal ambil proxy, pakai koneksi langsung:', err.message)
            this.proxyList = []
        }
    }

    selectProxy(index = 0) {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Content-Type': 'application/json',
            'Origin': TARGET_URL,
            'Referer': `${TARGET_URL}/`
        }

        if (this.proxyList[index]) {
            const proxy = this.proxyList[index]
            const proxyUrl = `socks5://${proxy.userId}:${proxy.password}@${proxy.host}:${proxy.port}`
            const agent = new SocksProxyAgent(proxyUrl)
            this.client = axios.create({
                httpAgent: agent,
                httpsAgent: agent,
                timeout: 60000,
                headers
            })
        } else {
            this.client = axios.create({
                timeout: 60000,
                headers
            })
        }
    }

    async getTurnstileToken() {
        const encodedUrl = encodeURIComponent(TTS_ENDPOINT)
        const res = await axios.get(`${BYPASS_API}?url=${encodedUrl}&sitekey=${SITEKEY}`, {
            timeout: 30000
        })
        if (res.data?.status && res.data?.result?.token) {
            return res.data.result.token
        }
        throw new Error('Invalid bypass response')
    }

    async generateTts(text, token) {
        const payload = {
            text: text,
            lang: 0,
            reverb: true,
            turnstileToken: token,
            voice: 17 // default voice
        }

        const res = await this.client.post(TTS_ENDPOINT, payload, {
            responseType: 'arraybuffer'
        })

        const contentType = res.headers['content-type'] || ''
        if (contentType.includes('application/json')) {
            const errorMsg = Buffer.from(res.data).toString()
            throw new Error(`Server Error: ${errorMsg}`)
        }

        if (res.status === 200 && res.data.byteLength > 1000) {
            return Buffer.from(res.data)
        }

        throw new Error('Empty or invalid audio response')
    }

    async processText(text, maxRetries = 3) {
        await this.loadProxies()

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                this.selectProxy(this.proxyList.length ? attempt % this.proxyList.length : 0)
                const token = await this.getTurnstileToken()
                const audioBuffer = await this.generateTts(text, token)
                return {
                    audioBuffer,
                    duration_estimate: Math.round(audioBuffer.byteLength / 16000),
                    file_size_kb: Math.round(audioBuffer.byteLength / 1024)
                }
            } catch (err) {
                console.error(`❌ Attempt ${attempt + 1} failed:`, err.message)
                if (attempt === maxRetries - 1) throw err
            }
        }
    }
}

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) return m.reply(`Contoh: ${usedPrefix + command} Halo semuanya`)

    await conn.sendReact(m.chat, '⏳', m.key)

    try {
        const bot = new VoxTtsBot()
        const result = await bot.processText(text)

        await conn.sendMessage(m.chat, {
            audio: result.audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `vox-default.mp3`
        }, {
            quoted: m
        })

        await conn.sendReact(m.chat, '✅', m.key)
    } catch (e) {
        console.error(e)
        await conn.sendReact(m.chat, '❌', m.key)
        await m.reply(`❌ Gagal generate TTS: ${e.message}`)
    }
}

handler.help = ['vox <teks>']
handler.tags = ['ai', 'tools']
handler.command = /^(vox|voxtts)$/i
handler.limit = true
handler.register = true

export default handler