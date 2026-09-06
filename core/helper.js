import {
  generateWAMessageFromContent,
  generateWAMessage,
  prepareWAMessageMedia,
  proto,
  encryptedStream,
  generateMessageIDV2,
  getStream,
  sha256,
  toBuffer,
  unixTimestampSeconds,
  MEDIA_PATH_MAP,
  MEDIA_HKDF_KEY_MAPPING,
  jidNormalizedUser,
  delay,
  STORIES_JID,
  getUrlInfo
} from 'baileys'
import crypto from 'crypto'
import { zip } from 'fflate'

// Fix for sticker-pack media upload
MEDIA_PATH_MAP['sticker-pack'] = '/mms/image'
MEDIA_PATH_MAP['thumbnail-sticker-pack'] = '/mms/image'
MEDIA_HKDF_KEY_MAPPING['sticker-pack'] = 'Sticker Pack'
MEDIA_HKDF_KEY_MAPPING['thumbnail-sticker-pack'] = 'Sticker Pack'

const isJidGroup = (jid) => jid?.endsWith('@g.us')
const isJidUser = (jid) => jid?.endsWith('@s.whatsapp.net') || jid?.endsWith('@lid')

const bizNode = {
  tag: 'biz',
  attrs: {},
  content: [{
    tag: 'interactive',
    attrs: { type: 'native_flow', v: '1' },
    content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
  }]
}

export default function makeHelper(conn) {
  const originalSendMessage = conn.sendMessage.bind(conn)

  const uploadMedia = async (content) =>
    prepareWAMessageMedia(content, { upload: conn.waUploadToServer })

  const buildHeader = async (content = {}) => {
    if (content.image) {
      const m = await uploadMedia({ image: content.image })
      return { hasMediaAttachment: true, imageMessage: m.imageMessage }
    }
    if (content.video) {
      const m = await uploadMedia({ video: content.video })
      return { hasMediaAttachment: true, videoMessage: m.videoMessage }
    }
    if (content.document) {
      const m = await uploadMedia({ document: content.document, mimetype: content.mimetype || 'application/octet-stream', fileName: content.filename || 'file' })
      return { hasMediaAttachment: true, documentMessage: m.documentMessage }
    }
    if (content.location) {
      return {
        hasMediaAttachment: true,
        locationMessage: {
          degreesLatitude: content.location.lat || 0,
          degreesLongitude: content.location.lng || 0,
          name: content.location.name || '',
          address: content.location.address || '',
          jpegThumbnail: content.location.jpegThumbnail || Buffer.from([])
        }
      }
    }
    return { hasMediaAttachment: false }
  }

  const convertButtons = (buttons = []) => buttons.map((btn, i) => {
    if (btn.name) return btn 
    if (btn.nativeFlowInfo) return {
      name: btn.nativeFlowInfo.name,
      buttonParamsJson: btn.nativeFlowInfo.paramsJson
    }

    const text = btn.displayText || btn.text || btn.buttonText?.displayText || ''
    const id = btn.id || btn.buttonId || `btn_${i}`

    if (btn.url || btn.urlButton) {
      return {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({ 
          display_text: text || btn.urlButton?.displayText || 'Link', 
          url: btn.url || btn.urlButton?.url || btn.urlButton?.merchantUrl 
        })
      }
    }

    if (btn.copy || btn.copyCode) {
      return {
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({ display_text: text, copy_code: btn.copy || btn.copyCode })
      }
    }

    if (btn.call || btn.phone || btn.callButton) {
      return {
        name: 'cta_call',
        buttonParamsJson: JSON.stringify({ 
          display_text: text || btn.callButton?.displayText || 'Call', 
          phone_number: btn.call || btn.phone || btn.callButton?.phoneNumber 
        })
      }
    }

    if (btn.sections || btn.rows) {
      const sections = btn.sections
        ? btn.sections.map(sec => ({
            title: sec.title || '',
            rows: (sec.rows || []).map((row, ri) => ({
              title: row.title || row.text || '',
              description: row.description || row.desc || '',
              id: row.id || row.rowId || `row_${ri}`
            }))
          }))
        : [{
            title: btn.sectionTitle || '',
            rows: (btn.rows || []).map((row, ri) => ({
              title: row.title || row.text || '',
              description: row.description || row.desc || '',
              id: row.id || row.rowId || `row_${ri}`
            }))
          }]

      return {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: btn.title || btn.buttonText || 'Pilih',
          sections
        })
      }
    }

    return {
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({ display_text: text, id: id })
    }
  })

  // ─── Dispatcher ───

  conn.sendMessage = async (jid, content = {}, options = {}) => {

    // Auto-merge contextInfo.mentionedJid into mentions
    if (content.contextInfo?.mentionedJid?.length && !content.mentions?.length) {
      content.mentions = content.contextInfo.mentionedJid
    }
    
    // Support for Telegram-like format (photo, caption, reply_markup)
    if (content.photo || content.video || content.document) {
      if (content.reply_markup?.inline_keyboard) {
        content.buttons = content.reply_markup.inline_keyboard.flat().map(btn => ({
          text: btn.text,
          ...(btn.url ? { url: btn.url } : { id: btn.callback_data })
        }))
      }
      if (content.photo) content.image = content.photo
    }

    // 1. Interactive Buttons / Native Flow
    if (content.buttons || content.interactiveButtons || content.templateButtons) {
      const btns = content.buttons || content.interactiveButtons || content.templateButtons
      const header = await buildHeader(content)
      const buttons = convertButtons(btns)

      const interactiveMessage = proto.Message.InteractiveMessage.create({
        header: {
          title: content.title || '',
          subtitle: content.subtitle || '',
          hasMediaAttachment: header.hasMediaAttachment || false,
          ...(header.imageMessage    && { imageMessage: header.imageMessage }),
          ...(header.videoMessage    && { videoMessage: header.videoMessage }),
          ...(header.documentMessage && { documentMessage: header.documentMessage }),
          ...(header.locationMessage && { locationMessage: header.locationMessage })
        },
        body: { text: content.text || content.caption || '' },
        footer: { text: content.footer || '' },
        contextInfo: content.contextInfo || {},
        nativeFlowMessage: {
          buttons,
          messageParamsJson: content.messageParams ? JSON.stringify(content.messageParams) : ''
        }
      })

      if (options.quoted) {
        interactiveMessage.contextInfo = {
          ...(interactiveMessage.contextInfo || {}),
          stanzaId: options.quoted.key.id,
          participant: options.quoted.key.participant || options.quoted.key.remoteJid,
          quotedMessage: options.quoted.message
        }
      }

      const message = {
        messageContextInfo: {
          deviceListMetadataVersion: 2,
          deviceListMetadata: {}
        },
        interactiveMessage
      }

      const messageId = options.messageId || crypto.randomBytes(16).toString('hex').toUpperCase()
      await conn.relayMessage(jid, message, {
        messageId,
        additionalNodes: [bizNode]
      })

      return {
        key: { remoteJid: jid, fromMe: true, id: messageId },
        message
      }
    }

    // 2. Product
    if (content.product) {
      const p = content.product
      let productImage
      if (p.image) {
        const m = await uploadMedia({ image: p.image })
        productImage = m.imageMessage
      }

      return originalSendMessage(jid, {
        productMessage: {
          product: {
            productImage,
            productId: p.productId || '',
            title: p.title || '',
            description: p.description || '',
            currencyCode: p.currency || 'IDR',
            priceAmount1000: (p.price || 0) * 1000,
            retailerId: p.retailerId || '',
            url: p.url || '',
            productImageCount: 1
          },
          businessOwnerJid: p.businessJid || conn.user?.id,
          contextInfo: content.contextInfo || {}
        }
      }, { ...options, additionalNodes: [bizNode] })
    }

    // 3. Order
    if (content.order) {
      const o = content.order
      return originalSendMessage(jid, {
        orderMessage: {
          orderId: o.orderId || `ORDER-${Date.now()}`,
          thumbnail: o.thumbnail || '',
          itemCount: o.itemCount || 1,
          status: o.status || 1,
          surface: o.surface || 1,
          message: o.text || content.text || content.caption || '',
          orderTitle: o.title || '',
          sellerJid: o.sellerJid || conn.user?.id,
          token: o.token || 'token',
          totalAmount1000: (o.total || 0) * 1000,
          totalCurrencyCode: o.currency || 'IDR',
          contextInfo: content.contextInfo || {}
        }
      }, { ...options, additionalNodes: [bizNode] })
    }

    // 4. List
    if (content.list) {
      const l = content.list
      return originalSendMessage(jid, {
        listMessage: {
          title: l.title || '',
          description: l.text || content.text || content.caption || '',
          buttonText: l.buttonText || 'Pilih',
          footerText: l.footer || '',
          listType: l.listType || 1,
          sections: l.sections || [],
          contextInfo: content.contextInfo || {}
        }
      }, { ...options, additionalNodes: [bizNode] })
    }

    // 5. Album
    if (content.album) {
      const medias = content.album
      const album = await originalSendMessage(jid, { text: content.text || content.caption || '' }, options)

      for (const media of medias) {
        const mediaContent = media.image ? { image: media.image, caption: media.caption || '' }
                           : media.video ? { video: media.video, caption: media.caption || '' }
                           : null
        if (!mediaContent) continue

        await originalSendMessage(jid, mediaContent, {
          ...options,
          contextInfo: {
            ...(options.contextInfo || {}),
            messageAssociation: {
              associationType: 1,
              parentMessageKey: album.key
            }
          }
        })
      }
      return album
    }

    // 6. AIRich
    if (content.rich) {
      const rich = content.rich
      const builder = conn.createAIRich(rich)
      if (Array.isArray(rich.content)) {
        for (const item of rich.content) {
          if (item.text || item.caption) builder.addText(item.text || item.caption, item.options)
          if (item.code) builder.addCode(item.code.language, item.code.code)
          if (item.image) builder.addImage(item.image)
          if (item.video) builder.addVideo(item.video)
          if (item.table) builder.addTable(item.table)
          if (item.suggest) builder.addSuggest(item.suggest)
        }
      }
      return await builder.send(jid, options)
    }

    // 7. Event
    if (content.event) {
      const e = content.event
      const startTime = e.startTime
        ? Math.floor(new Date(e.startTime).getTime() / 1000)
        : Math.floor(Date.now() / 1000)

      return await originalSendMessage(jid, {
        messageContextInfo: {
          messageSecret: e.messageSecret || 'ptz3I2WYmmosIUCYwP7vaPyNLHhZtbEyFA64NyaU3Ok=',
        },
        eventMessage: {
          isCanceled: false,
          name: e.name || e.title || '',
          startTime: String(startTime),
          extraGuestsAllowed: e.extraGuestsAllowed ?? false,
          isScheduleCall: e.isScheduleCall ?? false,
          hasReminder: e.hasReminder ?? true,
          reminderOffsetSec: String(e.reminderOffsetSec || 3600)
        }
      }, {
        ...options,
        additionalNodes: [{ tag: 'meta', attrs: { event_type: 'creation' } }]
      })
    }

    // 8. Sticker Pack
    if (content.stickerPack) {
      const { stickers, cover, name, publisher, packId, description } = content.stickerPack
      const stickerPackId = packId || generateMessageIDV2()
      const trayIconFileName = `${stickerPackId}.webp`

      const [_sharp, _jimp] = await Promise.all([import('sharp').catch(() => null), import('jimp').catch(() => null)])
      const lib = _sharp ? { sharp: _sharp } : _jimp ? { jimp: _jimp } : null

      const isWebPBuffer = (buf) => (
        buf.length >= 12 &&
        buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
        buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
      )

      const isAnimatedWebP = (buf) => {
        if (!isWebPBuffer(buf)) return false
        let offset = 12
        while (offset < buf.length - 8) {
          const fourCC = buf.toString('ascii', offset, offset + 4)
          const chunkSize = buf.readUInt32LE(offset + 4)
          if (fourCC === 'VP8X') {
            const flagsOffset = offset + 8
            if (flagsOffset < buf.length && (buf[flagsOffset] & 0x02)) return true
          } else if (fourCC === 'ANIM' || fourCC === 'ANMF') {
            return true
          }
          offset += 8 + chunkSize + (chunkSize % 2)
        }
        return false
      }

      const stickerData = {}
      const stickerMetadata = []

      const getMediaBuffer = async (input) => {
        if (typeof input === 'string' && /^https?:\/\//.test(input)) {
          const res = await fetch(input)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return Buffer.from(await res.arrayBuffer())
        }
        const { stream } = await getStream(input)
        return await toBuffer(stream)
      }

      for (let i = 0; i < stickers.length; i++) {
        const s = stickers[i]
        try {
          const buffer = await getMediaBuffer(s.data || s.sticker)
          if (!buffer || buffer.length === 0) {
            console.log(`[StickerPack] Empty buffer for sticker ${i}`)
            continue
          }

          let webpBuffer
          let isAnimated = false

          if (isWebPBuffer(buffer)) {
            isAnimated = isAnimatedWebP(buffer)
            if (lib?.sharp) {
              webpBuffer = await lib.sharp.default(buffer).resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 75, effort: 6 }).toBuffer()
            } else webpBuffer = buffer
          } else if (lib?.sharp) {
            webpBuffer = await lib.sharp.default(buffer).resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 75, effort: 6 }).toBuffer()
          } else if (lib?.jimp) {
            const jimg = await (lib.jimp.Jimp || lib.jimp.default).read(buffer)
            webpBuffer = await jimg.resize({ w: 512, h: 512 }).getBuffer('image/webp')
          }

          if (!webpBuffer) {
            console.log(`[StickerPack] webpBuffer is null for sticker ${i}`)
            continue
          }

          const hash = sha256(webpBuffer).toString('base64').replace(/\//g, '-')
          const fileName = `${hash}.webp`
          stickerData[fileName] = [new Uint8Array(webpBuffer), { level: 6 }]
          stickerMetadata.push({
            fileName,
            mimetype: 'image/webp',
            isAnimated,
            emojis: s.emojis || [],
            accessibilityLabel: s.accessibilityLabel || ''
          })
        } catch (err) {
          console.error(`[StickerPack] Error processing sticker ${i}:`, err)
        }
      }

      if (stickerMetadata.length === 0) throw new Error('No valid stickers could be processed')

      const coverBuffer = await getMediaBuffer(cover)
      let coverWebpBuffer
      if (isWebPBuffer(coverBuffer)) {
        if (lib?.sharp) coverWebpBuffer = await lib.sharp.default(coverBuffer).resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 75, effort: 6 }).toBuffer()
        else coverWebpBuffer = coverBuffer
      } else if (lib?.sharp) {
        coverWebpBuffer = await lib.sharp.default(coverBuffer).resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 75, effort: 6 }).toBuffer()
      } else if (lib?.jimp) {
        const jimg = await (lib.jimp.Jimp || lib.jimp.default).read(coverBuffer)
        coverWebpBuffer = await jimg.resize({ w: 512, h: 512 }).getBuffer('image/webp')
      }

      if (!coverWebpBuffer) throw new Error('Cover processing failed')
      stickerData[trayIconFileName] = [new Uint8Array(coverWebpBuffer), { level: 6 }]

      const zipBuffer = await new Promise((resolve, reject) => {
        zip(stickerData, { level: 6, memLevel: 9 }, (err, data) => {
          if (err) reject(err)
          else resolve(Buffer.from(data))
        })
      })

      console.log(`[StickerPack] ZIP buffer created, size: ${zipBuffer.length} bytes`)

      const stickerPackUpload = await encryptedStream(zipBuffer, 'sticker-pack', { logger: { level: 'silent', log: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, trace: () => {} } })
      const stickerPackUploadResult = await conn.waUploadToServer(stickerPackUpload.encWriteStream || stickerPackUpload.encFilePath, {
        fileEncSha256B64: stickerPackUpload.fileEncSha256.toString('base64'),
        mediaType: 'sticker-pack'
      })

      const m = {
        stickerPackMessage: {
          name,
          publisher,
          stickerPackId,
          packDescription: description,
          stickerPackOrigin: 1, // THIRD_PARTY
          stickerPackSize: zipBuffer.length,
          stickers: stickerMetadata,
          fileSha256: stickerPackUpload.fileSha256,
          fileEncSha256: stickerPackUpload.fileEncSha256,
          mediaKey: stickerPackUpload.mediaKey,
          directPath: stickerPackUploadResult.directPath,
          fileLength: stickerPackUpload.fileLength,
          mediaKeyTimestamp: unixTimestampSeconds(),
          trayIconFileName
        }
      }

      try {
        let thumbBuffer
        if (lib?.sharp) thumbBuffer = await lib.sharp.default(coverBuffer).resize(252, 252).jpeg({ quality: 80 }).toBuffer()
        else if (lib?.jimp) {
          const jimg = await (lib.jimp.Jimp || lib.jimp.default).read(coverBuffer)
          thumbBuffer = await jimg.resize({ w: 252, h: 252 }).getBuffer('image/jpeg')
        }

        if (thumbBuffer) {
          const thumbUpload = await encryptedStream(thumbBuffer, 'thumbnail-sticker-pack', { mediaKey: stickerPackUpload.mediaKey })
          const thumbUploadResult = await conn.waUploadToServer(thumbUpload.encWriteStream || thumbUpload.encFilePath, {
            fileEncSha256B64: thumbUpload.fileEncSha256.toString('base64'),
            mediaType: 'thumbnail-sticker-pack'
          })
          Object.assign(m.stickerPackMessage, {
            thumbnailDirectPath: thumbUploadResult.directPath,
            thumbnailSha256: thumbUpload.fileSha256,
            thumbnailEncSha256: thumbUpload.fileEncSha256,
            thumbnailHeight: 252,
            thumbnailWidth: 252,
            imageDataHash: crypto.createHash('sha256').update(thumbBuffer).digest('base64')
          })
        }
      } catch {}

      m.stickerPackMessage.contextInfo = content.contextInfo || {}
      if (options.quoted) {
        m.stickerPackMessage.contextInfo = {
          ...m.stickerPackMessage.contextInfo,
          stanzaId: options.quoted.key.id,
          participant: options.quoted.key.participant || options.quoted.key.remoteJid,
          quotedMessage: options.quoted.message
        }
      }

      const messageId = options.messageId || crypto.randomBytes(16).toString('hex').toUpperCase()
      await conn.relayMessage(jid, m, { messageId })
      return { key: { remoteJid: jid, fromMe: true, id: messageId }, message: m }
    }

    // Default Fallback
    return originalSendMessage(jid, content, options)
  }

  // ─── Legacy Methods ───

  conn.sendButtons = (jid, content, options) => conn.sendMessage(jid, { ...content }, options)
  conn.sendList = (jid, content, options) => conn.sendMessage(jid, { list: content }, options)
  conn.sendProduct = (jid, content, options) => conn.sendMessage(jid, { product: content }, options)
  conn.sendOrder = (jid, content, options) => conn.sendMessage(jid, { order: content }, options)
  conn.sendAlbum = (jid, medias, options) => conn.sendMessage(jid, { album: medias, ...options }, options)
  conn.sendEvent = (jid, content, options) => conn.sendMessage(jid, { event: content }, options)
  conn.sendAIRich = (jid, builder, options) => builder.send(jid, options)

  conn.sendStatusMentions = async (content, jids = []) => {
    const userJid = jidNormalizedUser(conn.user?.id || '')
    let allUsers = new Set()
    allUsers.add(userJid)

    for (const id of jids) {
      const isGroup = isJidGroup(id)
      const isPrivate = isJidUser(id)
      if (isGroup) {
        try {
          const metadata = await conn.groupMetadata(id)
          const participants = metadata.participants.map(p => jidNormalizedUser(p.id))
          participants.forEach(j => allUsers.add(j))
        } catch (error) {
          console.error(`Error getting metadata for group ${id}: ${error}`)
        }
      } else if (isPrivate) {
        allUsers.add(jidNormalizedUser(id))
      }
    }

    const uniqueUsers = Array.from(allUsers)
    const getRandomHexColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')

    const isMedia = content.image || content.video || content.audio
    const isAudio = !!content.audio

    const messageContent = { ...content }

    if (isMedia && !isAudio) {
      if (messageContent.text) {
        messageContent.caption = messageContent.text
        delete messageContent.text
      }
      delete messageContent.ptt
      delete messageContent.font
      delete messageContent.backgroundColor
      delete messageContent.textColor
    }
    if (isAudio) {
      delete messageContent.text
      delete messageContent.caption
      delete messageContent.font
      delete messageContent.textColor
    }

    const font = !isMedia ? (content.font ?? Math.floor(Math.random() * 9)) : undefined
    const textColor = !isMedia ? (content.textColor ?? getRandomHexColor()) : undefined
    const backgroundColor = (!isMedia || isAudio) ? (content.backgroundColor ?? getRandomHexColor()) : undefined
    const ptt = isAudio ? (typeof content.ptt === 'boolean' ? content.ptt : true) : undefined

    let msg
    try {
      msg = await generateWAMessage(STORIES_JID, messageContent, {
        logger: conn.logger,
        userJid,
        getUrlInfo: text => getUrlInfo(text, {
          thumbnailWidth: 200,
          fetchOpts: { timeout: 3000 },
          logger: conn.logger,
          uploadImage: conn.waUploadToServer
        }),
        upload: async (encStream, opts) => {
          return await conn.waUploadToServer(encStream, { ...opts })
        },
        options: {},
        font,
        textColor,
        backgroundColor,
        ptt
      })
    } catch (error) {
      console.error(`Error generating status message:`, error)
      throw error
    }

    await conn.relayMessage(STORIES_JID, msg.message, {
      messageId: msg.key.id,
      statusJidList: uniqueUsers,
      additionalNodes: [{
        tag: 'meta',
        attrs: {},
        content: [{
          tag: 'mentioned_users',
          attrs: {},
          content: jids.map(jid => ({
            tag: 'to',
            attrs: { jid: jidNormalizedUser(jid) }
          }))
        }]
      }]
    })

    for (const id of jids) {
      try {
        const normalizedId = jidNormalizedUser(id)
        const isPrivate = isJidUser(normalizedId)
        const type = isPrivate ? 'statusMentionMessage' : 'groupStatusMentionMessage'
        const protocolMessage = {
          [type]: {
            message: {
              protocolMessage: {
                key: msg.key,
                type: 25
              }
            }
          },
          messageContextInfo: {
            messageSecret: crypto.randomBytes(32)
          }
        }
        const statusMsg = await generateWAMessageFromContent(normalizedId, protocolMessage, {})
        await conn.relayMessage(normalizedId, statusMsg.message, {
          additionalNodes: [{
            tag: 'meta',
            attrs: isPrivate ? { is_status_mention: 'true' } : { is_group_status_mention: 'true' }
          }]
        })
        await delay(2000)
      } catch (error) {
        console.error(`Error sending status mention to ${id}:`, error)
      }
    }

    return msg
  }

  // ─── AIRich Helpers (Internal) ───

  const extractIE = (text, { extract = true, hyperlink = true, citation = true, latex = true } = {}) => {
    if (!extract) return { text, ie: [] }
    let ie = [], result = '', last = 0, citation_index = 1, hyperlink_index = 0, latex_index = 0, stack = []
    for (let i = 0; i < text.length; i++) {
      if (text[i] == '[' && text[i - 1] != '\\') {
        stack.push(i)
      } else if (text[i] == ']' && (text[i + 1] == '(' || text[i + 1] == '<')) {
        let start = stack.pop()
        if (start == null) continue
        let open = text[i + 1], close = open == '(' ? ')' : '>', type = open == '(' ? 'link' : 'latex', end = i + 2, depth = 1
        while (end < text.length && depth) {
          if (text[end] == open && text[end - 1] != '\\') depth++
          else if (text[end] == close && text[end - 1] != '\\') depth--
          end++
        }
        if (depth) continue
        let raw = text.slice(start + 1, i).trim(), url = text.slice(i + 2, end - 1).trim(), key, tag, data
        if (type == 'latex') {
          if (!latex) continue
          let [txt = '', width = null, height = null, font_height = null, padding = null] = raw.split('|')
          key = `NIXEL_LATEX_${latex_index++}`
          tag = `{{${key}}}${txt || 'image'}{{/${key}}}`
          data = { type: 'latex', ie: { key, text: txt, url, width, height, font_height, padding } }
        } else if (raw) {
          if (!hyperlink) continue
          key = `NIXEL_HYPERLINK_${hyperlink_index++}`
          tag = `{{${key}}}${url}{{/${key}}}`
          data = { type: 'hyperlink', ie: { key, text: raw, url } }
        } else {
          if (!citation) continue
          key = `NIXEL_CITATION_${citation_index - 1}`
          tag = `{{${key}}}${url}{{/${key}}}`
          data = { type: 'citation', ie: { reference_id: citation_index++, key, text: '', url } }
        }
        result += text.slice(last, start) + tag
        last = end
        ie.push(data)
        i = end - 1
      }
    }
    result += text.slice(last)
    return { text: result, ie }
  }

  const newLayout = (name, data) => ({
    view_model: {
      [Array.isArray(data) ? 'primitives' : 'primitive']: data,
      __typename: `GenAI${name}LayoutViewModel`
    }
  })

  const aiRichTokenizer = (code, lang = 'javascript') => {
    const keywordsMap = {
      javascript: new Set(['break','case','catch','continue','debugger','delete','do','else','finally','for','function','if','in','instanceof','new','return','switch','this','throw','try','typeof','var','void','while','with','true','false','null','undefined','class','const','let','super','extends','export','import','yield','static','constructor','async','await','get','set'])
    }
    const TYPE_MAP = { 0: 'DEFAULT', 1: 'KEYWORD', 2: 'METHOD', 3: 'STR', 4: 'NUMBER', 5: 'COMMENT' }
    const keywords = keywordsMap[lang] || new Set()
    const tokens = []
    let i = 0
    const push = (content, type) => {
      if (!content) return
      const last = tokens[tokens.length - 1]
      if (last && last.highlightType === type) last.codeContent += content
      else tokens.push({ codeContent: content, highlightType: type })
    }
    while (i < code.length) {
      const c = code[i]
      if (/\s/.test(c)) { let s = i; while (i < code.length && /\s/.test(code[i])) i++; push(code.slice(s, i), 0); continue }
      if (c === '/' && code[i + 1] === '/') { let s = i; i += 2; while (i < code.length && code[i] !== '\n') i++; push(code.slice(s, i), 5); continue }
      if (c === '"' || c === "'" || c === '`') {
        let s = i, q = c; i++
        while (i < code.length) {
          if (code[i] === '\\' && i + 1 < code.length) i += 2
          else if (code[i] === q) { i++; break }
          else i++
        }
        push(code.slice(s, i), 3); continue
      }
      if (/[0-9]/.test(c)) { let s = i; while (i < code.length && /[0-9.]/.test(code[i])) i++; push(code.slice(s, i), 4); continue }
      if (/[a-zA-Z_$]/.test(c)) {
        let s = i
        while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++
        const word = code.slice(s, i)
        let type = 0
        if (keywords.has(word)) type = 1
        else { let j = i; while (j < code.length && /\s/.test(code[j])) j++; if (code[j] === '(') type = 2 }
        push(word, type); continue
      }
      push(c, 0); i++
    }
    return {
      codeBlock: tokens,
      unified_codeBlock: tokens.map(t => ({ content: t.codeContent, type: TYPE_MAP[t.highlightType] }))
    }
  }

  const toTableMetadata = (arr) => {
    if (!Array.isArray(arr) || !arr.every(row => Array.isArray(row) && row.every(cell => typeof cell === 'string'))) {
      throw new TypeError('Table must be a nested array of strings')
    }
    const [header, ...rows] = arr
    const maxLen = Math.max(header.length, ...rows.map(r => r.length))
    const normalize = r => [...r, ...Array(maxLen - r.length).fill('')]
    const unified_rows = [
      { is_header: true, cells: normalize(header) },
      ...rows.map(r => ({ is_header: false, cells: normalize(r) }))
    ]
    const rowsMeta = unified_rows.map(r => ({ items: r.cells, ...(r.is_header ? { isHeading: true } : {}) }))
    return { title: '', rows: rowsMeta, unified_rows }
  }

  conn.sendAIRich = async (jid, builder = {}, options = {}) => {
    const {
      title = '',
      footer = '',
      forwarded = true,
      contextInfo = {},
      extraPayload = {},
      richResponseSources = []
    } = builder

    const submessages = builder._submessages || []
    const sections = builder._sections || []

    const allSections = footer ? [
      ...sections,
      newLayout('Single', {
        text: footer,
        __typename: 'GenAIMetadataTextPrimitive'
      })
    ] : [...sections]

    const forward = forwarded ? {
      forwardingScore: 1,
      isForwarded: true,
      forwardedAiBotMessageInfo: { botJid: '0@bot' },
      forwardOrigin: 4
    } : {}

    const quoted = options.quoted
    const qObj = quoted ? {
      stanzaId: quoted?.key?.id,
      participant: quoted?.key?.participant || quoted?.key?.remoteJid,
      quotedType: 0,
      quotedMessage: quoted?.message
    } : {}

    const payload = {
      messageContextInfo: {
        deviceListMetadata: {},
        deviceListMetadataVersion: 2,
        botMetadata: {
          messageDisclaimerText: title,
          richResponseSourcesMetadata: { sources: richResponseSources }
        }
      },
      ...extraPayload,
      botForwardedMessage: {
        message: {
          richResponseMessage: {
            messageType: 1,
            submessages,
            unifiedResponse: {
              data: Buffer.from(JSON.stringify({
                response_id: crypto.randomUUID(),
                sections: allSections
              })).toString('base64')
            },
            contextInfo: {
              ...forward,
              ...qObj,
              ...contextInfo
            }
          }
        }
      }
    }

    const msg = generateWAMessageFromContent(jid, payload, {
      userJid: conn.user?.id,
      quoted: options.quoted
    })

    return await conn.relayMessage(jid, msg.message, {
      messageId: msg.key.id,
      ...options
    })
  }

  conn.createAIRich = (options = {}) => {
    const builder = {
      _title: options.title || '',
      _footer: options.footer || '',
      _contextInfo: options.contextInfo || {},
      _extraPayload: options.extraPayload || {},
      _submessages: [],
      _sections: [],
      _richResponseSources: [],

      setTitle(title) { this._title = title; return this },
      setFooter(footer) { this._footer = footer; return this },
      setContextInfo(obj) { this._contextInfo = obj; return this },
      addPayload(obj) { Object.assign(this._extraPayload, obj); return this },

      addText(text, { hyperlink = true, citation = true, latex = true } = {}) {
        const extractedIE = extractIE(text, { hyperlink, citation, latex })
        const inline_entities = extractedIE.ie.map(({ type, ie }) => {
          if (type == 'hyperlink') return { key: ie.key, metadata: { display_name: ie.text, is_trusted: true, url: ie.url, __typename: 'GenAIInlineLinkItem' } }
          if (type == 'citation') return { key: ie.key, metadata: { reference_id: ie.reference_id, reference_url: ie.url, reference_title: e.url, reference_display_name: ie.url, sources: [], __typename: 'GenAISearchCitationItem' } }
          if (type == 'latex') return { key: ie.key, metadata: { latex_expression: ie.text, latex_image: { url: ie.url, width: Number(ie.width) || 100, height: Number(ie.height) || 100 }, font_height: Number(ie.font_height) || 83.333333333333, padding: Number(ie.padding) || 15, __typename: 'GenAILatexItem' } }
        })
        this._submessages.push({ messageType: 2, messageText: extractedIE.text })
        this._sections.push(newLayout('Single', { text: extractedIE.text, ...(inline_entities.length && { inline_entities }), __typename: 'GenAIMarkdownTextUXPrimitive' }))
        return this
      },

      addCode(language, code) {
        const meta = aiRichTokenizer(code, language)
        this._submessages.push({ messageType: 5, codeMetadata: { codeLanguage: language, codeBlocks: meta.codeBlock } })
        this._sections.push(newLayout('Single', { language, code_blocks: meta.unified_codeBlock, __typename: 'GenAICodeUXPrimitive' }))
        return this
      },

      addTable(table) {
        const meta = toTableMetadata(table)
        this._submessages.push({ messageType: 4, tableMetadata: { title: meta.title, rows: meta.rows } })
        this._sections.push(newLayout('Single', { rows: meta.unified_rows, __typename: 'GenATableUXPrimitive' }))
        return this
      },

      addSource(sources = []) {
        if (sources.every(item => typeof item === 'string')) sources = [sources]
        const source = sources.map(([profile_url, url, text]) => ({
          source_type: 'THIRD_PARTY',
          source_display_name: text ?? '',
          source_subtitle: 'AI',
          source_url: url ?? '',
          favicon: { url: profile_url ?? '', mime_type: 'image/jpeg', width: 16, height: 16 }
        }))
        this._sections.push(newLayout('Single', { sources: source, __typename: 'GenAISearchResultPrimitive' }))
        return this
      },

      addImage(imageUrl) {
        const imageUrls = (Array.isArray(imageUrl) ? imageUrl : [imageUrl]).map(url => ({
          imagePreviewUrl: url, imageHighResUrl: url, sourceUrl: 'https://fiora.nixel.my.id/'
        }))
        this._submessages.push({ messageType: 1, gridImageMetadata: { gridImageUrl: { imagePreviewUrl: Array.isArray(imageUrl) ? imageUrl[0] : imageUrl }, imageUrls } })
        imageUrls.forEach(({ imagePreviewUrl }) => {
          this._sections.push(newLayout('Single', { media: { url: imagePreviewUrl, mime_type: 'image/png' }, imagine_type: 'IMAGE', status: { status: 'READY' }, __typename: 'GenAIImaginePrimitive' }))
        })
        return this
      },

      addVideo(videoUrl) {
        const videoUrls = (Array.isArray(videoUrl) ? videoUrl : [videoUrl]).map(item => {
          const [url, duration = 0] = item.split('|')
          return { videoPreviewUrl: url, videoHighResUrl: url, duration: Number(duration) || 0, sourceUrl: 'https://fiora.nixel.my.id/' }
        })
        this._submessages.push({ messageType: 2, messageText: '[ CANNOT_LOAD_VIDEO ]' })
        videoUrls.forEach(({ videoPreviewUrl, duration }) => {
          this._sections.push(newLayout('Single', { media: { url: videoPreviewUrl, mime_type: 'video/mp4', duration }, imagine_type: 'ANIMATE', status: { status: 'READY' }, __typename: 'GenAIImaginePrimitive' }))
        })
        return this
      },

      addReels(reelsItems = []) {
        if (!Array.isArray(reelsItems)) reelsItems = [reelsItems]
        this._submessages.push({ messageType: 9, contentItemsMetadata: { contentType: 1, itemsMetadata: reelsItems.map(item => ({ reelItem: { title: item.username ?? '', profileIconUrl: item.profileIconUrl ?? item.profile_url ?? '', thumbnailUrl: item.thumbnailUrl ?? item.thumbnail ?? '', videoUrl: item.videoUrl ?? item.url ?? '' } })) } })
        reelsItems.forEach((item, idx) => {
          this._richResponseSources.push({ provider: 'NIXEL', thumbnailCDNURL: item.thumbnailUrl ?? item.thumbnail ?? '', sourceProviderURL: item.videoUrl ?? item.url ?? '', sourceQuery: '', faviconCDNURL: item.profileIconUrl ?? item.profile_url ?? '', citationNumber: idx + 1, sourceTitle: item.username ?? '' })
        })
        this._sections.push(newLayout('HScroll', reelsItems.map(item => ({ reels_url: item.videoUrl ?? item.url ?? '', thumbnail_url: item.thumbnailUrl ?? item.thumbnail ?? '', creator: item.username ?? item.title ?? '', avatar_url: item.profileIconUrl ?? item.profile_url ?? '', reels_title: item.reels_title ?? item.title ?? '', likes_count: item.likes_count ?? item.like ?? 0, shares_count: item.shares_count ?? item.share ?? 0, view_count: item.view_count ?? item.view ?? 0, reel_source: item.reel_source ?? item.source ?? 'IG', is_verified: !!(item.is_verified || item.verified), __typename: 'GenAIReelPrimitive' }))))
        return this
      },

      addProduct(data = {}) {
        const items = Array.isArray(data) ? data : [data]
        this._submessages.push({ messageType: 2, messageText: '[ CANNOT_LOAD_PRODUCT ]' })
        const product = items.map(item => ({ title: item.title, brand: item.brand, price: item.price, sale_price: item.sale_price, product_url: item.product_url ?? item.url, image: { url: item.image_url ?? item.image }, additional_images: [{ url: item.icon_url ?? item.icon }], __typename: 'GenAIProductItemCardPrimitive' }))
        this._sections.push(newLayout(Array.isArray(data) ? 'HScroll' : 'Single', Array.isArray(data) ? product : product[0]))
        return this
      },

      addPost(data = {}) {
        const posts = Array.isArray(data) ? data : [data]
        this._submessages.push({ messageType: 2, messageText: '[ CANNOT_LOAD_POST ]' })
        const primitives = posts.map(p => ({ title: p.title ?? '', subtitle: p.subtitle ?? '', username: p.username ?? '', profile_picture_url: p.profile_picture_url ?? p.profile_url ?? '', is_verified: !!(p.is_verified || p.verified), thumbnail_url: p.thumbnail_url ?? p.thumbnail ?? '', post_caption: p.post_caption ?? p.caption ?? '', likes_count: p.likes_count ?? p.like ?? 0, comments_count: p.comments_count ?? p.comment ?? 0, shares_count: p.shares_count ?? p.share ?? 0, post_url: p.post_url ?? p.url ?? '', post_deeplink: p.post_deeplink ?? p.deeplink ?? '', source_app: p.source_app || p.source || 'INSTAGRAM', footer_label: p.footer_label ?? p.footer ?? '', footer_icon: p.footer_icon ?? p.icon ?? '', is_carousel: posts.length > 1, orientation: p.orientation ?? 'LANDSCAPE', post_type: p.post_type ?? 'VIDEO', __typename: 'GenAIPostPrimitive' }))
        this._sections.push(newLayout('HScroll', primitives))
        return this
      },

      addTip(text) {
        this._submessages.push({ messageType: 2, messageText: text })
        this._sections.push(newLayout('Single', { text, __typename: 'GenAIMetadataTextPrimitive' }))
        return this
      },

      addSuggest(suggestion) {
        const suggest = (Array.isArray(suggestion) ? suggestion : [suggestion]).map(text => ({ prompt_text: text, prompt_type: 'SUGGESTED_PROMPT', __typename: 'GenAIFollowUpSuggestionPillPrimitive' }))
        this._sections.push(newLayout('ActionRow', suggest))
        return this
      },

      async send(jid, opts = {}) {
        return await conn.sendAIRich(jid, this, opts)
      }
    }

    return builder
  }

  return conn
}
