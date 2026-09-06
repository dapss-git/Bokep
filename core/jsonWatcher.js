import chokidar from 'chokidar'
import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'

const JSON_DIR = path.resolve('./json')

const JSON_TO_BOT_KEY = {
    'rumah.json':  'rumah',
    'stock.json':  'stock',
    'crypto.json': 'invest',
    'saham.json':  'saham',
}

function loadJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch (e) {
        console.error(chalk.red(`[JsonWatcher] Gagal parse ${filePath}:`), e.message)
        return null
    }
}

function syncToDB(filePath) {
    const filename = path.basename(filePath)
    const botKey = JSON_TO_BOT_KEY[filename]
    if (!botKey) return

    const data = loadJson(filePath)
    if (data === null) return

    try {
        global.db.data.bots[botKey] = data
        console.log(chalk.green(`[JsonWatcher] ✅ ${filename} → bots.${botKey} (${Array.isArray(data) ? data.length + ' items' : 'updated'})`))
    } catch (e) {
        console.error(chalk.red(`[JsonWatcher] Gagal sync ${filename}:`), e.message)
    }
}

export function startJsonWatcher() {
    const watcher = chokidar.watch(JSON_DIR, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100
        }
    })

    watcher.on('change', (filePath) => {
        console.log(chalk.yellow(`[JsonWatcher] 🔄 Perubahan terdeteksi: ${path.basename(filePath)}`))
        syncToDB(filePath)
    })

    watcher.on('add', (filePath) => {
        syncToDB(filePath)
    })

    watcher.on('error', (err) => {
        console.error(chalk.red('[JsonWatcher] Error:'), err)
    })

    console.log(chalk.cyan(`[JsonWatcher] 👀 Memantau: ${JSON_DIR}`))
    console.log(chalk.cyan(`[JsonWatcher] File terpantau: ${Object.keys(JSON_TO_BOT_KEY).join(', ')}`))

    return watcher
}
