import BetterSQLite3 from 'better-sqlite3'
import _fs, { existsSync, readFileSync } from 'node:fs'
import path, { resolve, dirname } from 'node:path'
import chalk from 'chalk'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function makeDeepProxy(obj, onWrite) {
    const isProxyable = (val) => {
        if (typeof val !== 'object' || val === null) return false
        const proto = Object.getPrototypeOf(val)
        return proto === Object.prototype || proto === null || Array.isArray(val)
    }
    if (!isProxyable(obj)) return obj
    return new Proxy(obj, {
        get(target, key) {
            if (typeof key === 'symbol') return target[key]
            const val = target[key]
            if (isProxyable(val)) return makeDeepProxy(val, onWrite)
            return val
        },
        set(target, key, val) {
            target[key] = val
            onWrite()
            return true
        },
        deleteProperty(target, key) {
            delete target[key]
            onWrite()
            return true
        }
    })
}

function makeTableProxy(stmts, ns) {
    const cache = new Map()
    const dirty = new Set()
    const accessingDescriptor = new Set()

    const load = (key) => {
        if (cache.has(key)) return cache.get(key)
        const row = stmts.get.get(`${ns}:${key}`)
        if (!row) return undefined
        try {
            const v = JSON.parse(row.value)
            cache.set(key, v)
            return v
        } catch { return undefined }
    }

    const save = (key, val) => {
        cache.set(key, val)
        stmts.set.run(`${ns}:${key}`, JSON.stringify(val))
        dirty.delete(key)
    }

    const markDirty = (key) => dirty.add(key)

    const flushAll = () => {
        for (const key of dirty) {
            const val = cache.get(key)
            if (val !== undefined) {
                stmts.set.run(`${ns}:${key}`, JSON.stringify(val))
            }
        }
        dirty.clear()
    }

    const del = (key) => {
        cache.delete(key)
        dirty.delete(key)
        stmts.del.run(`${ns}:${key}`)
    }

    const allKeys = () => {
        const prefix = `${ns}:`
        return stmts.keys.all(prefix + '%').map(r => r.key.slice(prefix.length))
    }

    return new Proxy({}, {
        get(_, key) {
            if (typeof key === 'symbol') return undefined
            if (key === '__isProxy') return true
            if (key === '__flushAll') return flushAll
            if (key === 'toJSON') return () => Object.fromEntries(allKeys().map(k => [k, load(k)]))
            const val = load(key)
            if (typeof val === 'object' && val !== null) {
                return makeDeepProxy(val, () => {
                    stmts.set.run(`${ns}:${key}`, JSON.stringify(val))
                })
            }
            return val
        },
        set(_, key, val) {
            if (typeof key === 'symbol') return false
            save(key, val)
            return true
        },
        deleteProperty(_, key) { del(key); return true },
        has(_, key) { return load(key) !== undefined },
        ownKeys() { return allKeys() },
        getOwnPropertyDescriptor(_, key) {
            if (typeof key === 'symbol') return undefined
            const keyId = `${ns}:${key}`
            if (accessingDescriptor.has(keyId)) return undefined
            accessingDescriptor.add(keyId)
            try {
                const v = load(key)
                if (v === undefined) return undefined
                return { configurable: true, enumerable: true, writable: true, value: v }
            } finally {
                accessingDescriptor.delete(keyId)
            }
        },
        apply() { return undefined }
    })
}

function makeNestedProxy(stmts, ns) {
    const subCache = new Map()
    const dirty = new Set()
    const accessingDescriptor = new Set()
    const accessingSubDescriptor = new Map()

    const loadSub = (subKey) => {
        if (subCache.has(subKey)) return subCache.get(subKey)
        const r = stmts.get.get(`${ns}:${subKey}`)
        const val = r ? JSON.parse(r.value) : {}
        subCache.set(subKey, val)
        return val
    }

    const saveSub = (subKey, val) => {
        subCache.set(subKey, val)
        stmts.set.run(`${ns}:${subKey}`, JSON.stringify(val))
        dirty.delete(subKey)
    }

    const flushAll = () => {
        for (const key of dirty) {
            const val = subCache.get(key)
            if (val !== undefined) stmts.set.run(`${ns}:${key}`, JSON.stringify(val))
        }
        dirty.clear()
    }

    const makeSubProxy = (subKey) => new Proxy({}, {
        get(_, key) {
            if (typeof key === 'symbol') return undefined
            if (key === 'toJSON') return () => loadSub(subKey)
            const obj = loadSub(subKey)
            const val = obj[key]
            if (typeof val === 'object' && val !== null) {
                return makeDeepProxy(val, () => {
                    stmts.set.run(`${ns}:${subKey}`, JSON.stringify(obj))
                })
            }
            return val
        },
        set(_, key, val) {
            const obj = loadSub(subKey)
            obj[key] = val
            saveSub(subKey, obj)
            return true
        },
        deleteProperty(_, key) {
            const obj = loadSub(subKey)
            delete obj[key]
            saveSub(subKey, obj)
            return true
        },
        has(_, key) {
            try {
                const obj = loadSub(subKey)
                return Object.prototype.hasOwnProperty.call(obj, key)
            } catch (e) {
                console.log(`[DB DEBUG] has() error for ${subKey}.${key}:`, e.message)
                return false
            }
        },
        ownKeys() {
            try {
                const raw = loadSub(subKey)
                if (!raw || typeof raw !== 'object') return []
                // Use Reflect.ownKeys directly without triggering getOwnPropertyDescriptor
                return Object.keys(raw)
            } catch (e) {
                console.log(`[DB DEBUG] ownKeys() error for ${subKey}:`, e.message)
                return []
            }
        },
        getOwnPropertyDescriptor(_, key) {
            const descId = `${subKey}.${key}`
            if (accessingSubDescriptor.has(descId)) {
                console.log(`[DB DEBUG] Preventing recursive getOwnPropertyDescriptor for ${descId}`)
                return undefined
            }
            accessingSubDescriptor.set(descId, true)
            try {
                if (typeof key === 'symbol') return undefined
                const raw = loadSub(subKey)
                if (!raw || !Object.prototype.hasOwnProperty.call(raw, key)) return undefined
                return { configurable: true, enumerable: true, writable: true, value: raw[key] }
            } catch (e) {
                console.log(`[DB DEBUG] getOwnPropertyDescriptor() error for ${descId}:`, e.message)
                return undefined
            } finally {
                accessingSubDescriptor.delete(descId)
            }
        }
    })

    return new Proxy({}, {
        get(_, key) {
            if (typeof key === 'symbol') return undefined
            if (key === '__flushAll') return flushAll
            if (key === 'toJSON') return () => {
                const prefix = `${ns}:`
                const rows = stmts.keys.all(prefix + '%')
                const result = {}
                for (const r of rows) result[r.key.slice(prefix.length)] = loadSub(r.key.slice(prefix.length))
                return result
            }
            return makeSubProxy(key)
        },
        set(_, key, val) {
            subCache.set(key, val)
            stmts.set.run(`${ns}:${key}`, JSON.stringify(val))
            dirty.delete(key)
            return true
        },
        deleteProperty(_, key) {
            subCache.delete(key)
            dirty.delete(key)
            stmts.del.run(`${ns}:${key}`)
            return true
        },
        has(_, key) {
            try {
                return !!stmts.get.get(`${ns}:${key}`)
            } catch (e) {
                console.log(`[DB DEBUG] has() error for ${ns}:${key}:`, e.message)
                return false
            }
        },
        ownKeys() {
            try {
                const prefix = `${ns}:`
                const keys = stmts.keys.all(prefix + '%').map(r => r.key.slice(prefix.length))
                console.log(`[DB DEBUG] main ownKeys for ${ns}:`, keys.slice(0, 5), keys.length > 5 ? `... +${keys.length - 5} more` : '')
                return keys
            } catch (e) {
                console.log(`[DB DEBUG] ownKeys() error for ${ns}:`, e.message)
                return []
            }
        },
        getOwnPropertyDescriptor(_, key) {
            if (typeof key === 'symbol') return undefined
            const keyId = `${ns}:${key}`
            if (accessingDescriptor.has(keyId)) {
                console.log(`[DB DEBUG] Preventing recursive getOwnPropertyDescriptor for ${keyId}`)
                return undefined
            }
            accessingDescriptor.add(keyId)
            try {
                const r = stmts.get.get(keyId)
                if (!r) return undefined
                const raw = JSON.parse(r.value)
                return { configurable: true, enumerable: true, writable: true, value: raw }
            } catch (e) {
                console.log(`[DB DEBUG] getOwnPropertyDescriptor() error for ${keyId}:`, e.message)
                return undefined
            } finally {
                accessingDescriptor.delete(keyId)
            }
        }
    })
}

function makeScalarProxy(stmts, nsKey) {
    let _val = null
    const load = () => {
        if (_val !== null) return _val
        const r = stmts.get.get(nsKey)
        _val = r ? JSON.parse(r.value) : {}
        return _val
    }
    const flush = () => stmts.set.run(nsKey, JSON.stringify(_val))

    return new Proxy({}, {
        get(_, key) {
            if (typeof key === 'symbol') return undefined
            if (key === 'toJSON') return () => load()
            return load()[key]
        },
        set(_, key, val) { load()[key] = val; flush(); return true },
        deleteProperty(_, key) { delete load()[key]; flush(); return true },
        has(_, key) { return key in load() },
        ownKeys() { return Object.keys(load()) },
        getOwnPropertyDescriptor(_, key) {
            const v = load()[key]
            if (v === undefined) return undefined
            return { configurable: true, enumerable: true, writable: true, value: v }
        }
    })
}

function makeOwnerProxy(stmts) {
    const NS = '__scalar:owner'
    let _arr = null
    const load = () => {
        if (_arr !== null) return _arr
        const r = stmts.get.get(NS)
        _arr = r ? JSON.parse(r.value) : []
        return _arr
    }
    const flush = () => stmts.set.run(NS, JSON.stringify(_arr))

    return new Proxy([], {
        get(_, key) {
            const arr = load()
            if (key === 'length') return arr.length
            if (key === Symbol.iterator) return arr[Symbol.iterator].bind(arr)
            if (key === 'toJSON') return () => arr
            if (typeof arr[key] === 'function') return (...args) => {
                const result = arr[key](...args)
                flush()
                return result
            }
            const idx = parseInt(key)
            return !isNaN(idx) ? arr[idx] : arr[key]
        },
        set(_, key, val) {
            const idx = parseInt(key)
            if (!isNaN(idx)) { load()[idx] = val; flush() }
            return true
        }
    })
}

class SQLiteDatabase {
    constructor(filepath) {
        this.file = resolve(filepath)
        this.logger = console
        this._db = null
        this._stmts = null
        this._data = null
        this._open()
    }

    _open() {
        const dir = path.dirname(this.file)
        if (!existsSync(dir)) _fs.mkdirSync(dir, { recursive: true })

        this._db = new BetterSQLite3(this.file)
        this._db.pragma('journal_mode = WAL')
        this._db.pragma('synchronous = NORMAL')

        this._db.exec(`
            CREATE TABLE IF NOT EXISTS kv (
                key   TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `)

        this._stmts = {
            get:  this._db.prepare('SELECT value FROM kv WHERE key = ?'),
            set:  this._db.prepare('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)'),
            del:  this._db.prepare('DELETE FROM kv WHERE key = ?'),
            keys: this._db.prepare('SELECT key FROM kv WHERE key LIKE ?'),
        }

        this._data = {
            users:    makeTableProxy(this._stmts, 'users'),
            chats:    makeTableProxy(this._stmts, 'chats'),
            settings: makeNestedProxy(this._stmts, 'settings'),
            bots:     makeNestedProxy(this._stmts, 'bots'),
            stats:    makeScalarProxy(this._stmts, '__scalar:stats'),
            guilds:   makeTableProxy(this._stmts, 'guilds'),
            owner:    makeOwnerProxy(this._stmts),
        }
    }

    get data() { return this._data }

    set data(value) {
        if (value && typeof value === 'object') this._importBulk(value)
    }

    save() {
        try {
            this._data.users?.__flushAll?.()
            this._data.chats?.__flushAll?.()
            this._data.bots?.__flushAll?.()
            this._data.settings?.__flushAll?.()
        } catch (e) {
            console.error(chalk.red('[DB] save() error:'), e.message)
        }
    }

    load() {}

    _importBulk(obj) {
        const entries = []
        const push = (key, val) => entries.push([key, JSON.stringify(val)])

        if (obj.users)    for (const [k, v] of Object.entries(obj.users))    push(`users:${k}`, v)
        if (obj.chats)    for (const [k, v] of Object.entries(obj.chats))    push(`chats:${k}`, v)
        if (obj.guilds)   for (const [k, v] of Object.entries(obj.guilds))   push(`guilds:${k}`, v)
        if (obj.settings) for (const [k, v] of Object.entries(obj.settings)) push(`settings:${k}`, v)
        if (obj.bots)     for (const [k, v] of Object.entries(obj.bots))     push(`bots:${k}`, v)
        if (obj.stats)    push('__scalar:stats', obj.stats)
        if (obj.owner)    push('__scalar:owner', obj.owner)

        const insert = this._db.transaction((rows) => {
            for (const [k, v] of rows) this._stmts.set.run(k, v)
        })
        insert(entries)
        console.log(chalk.green(`[DB] Import selesai: ${entries.length} entries`))
    }

    async init() {
        const jsonPath = resolve(path.dirname(this.file), '..', 'database.json')
        if (existsSync(jsonPath)) {
            try {
                const count = this._db.prepare('SELECT COUNT(*) as c FROM kv').get()
                if (count.c === 0) {
                    console.log(chalk.yellow('[DB] Migrasi database.json → SQLite...'))
                    const raw = readFileSync(jsonPath, 'utf-8')
                    this._importBulk(JSON.parse(raw))
                    _fs.renameSync(jsonPath, jsonPath + '.migrated.' + Date.now())
                    console.log(chalk.green('[DB] Migrasi selesai! database.json diarsipkan.'))
                }
            } catch (e) {
                console.error(chalk.red('[DB] Gagal migrasi:'), e.message)
            }
        }
        return this._data
    }

    list() { return this._data }

    getBanchat(groupId) {
        const group = this._data?.chats?.[groupId] || {}
        return typeof group.banchat !== 'undefined' ? group.banchat : false
    }

    async setBanchat(groupId, value) {
        const current = this._data.chats[groupId] || {}
        current.banchat = value
        this._data.chats[groupId] = current
        return current
    }

    close() { this._db?.close() }
}

export default SQLiteDatabase

const fileName = path.basename(__filename)
_fs.watchFile(__filename, async () => {
    _fs.unwatchFile(__filename)
    console.log(chalk.greenBright(`🔄 File "${fileName}" telah diperbarui!`))
    try {
        await import(`${pathToFileURL(__filename).href}?update=${Date.now()}`)
        console.log(chalk.blueBright(`✅ ${fileName} berhasil di-reload!`))
    } catch (err) {
        console.error(chalk.redBright(`❌ Gagal me-reload ${fileName}:`), err)
    }
})
