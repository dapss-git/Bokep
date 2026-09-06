import crypto from 'crypto';
import util from 'util';
import {
    proto
} from 'baileys';

const resolveEnum = (enumObj, value) => {
    if (!enumObj) return value;
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return value;
    return enumObj[value] ?? enumObj.UNKNOWN ?? value;
};

const messageMiddleware = [{
        types: [/^pollCreationMessage/i, 'eventMessage'],
        run(message) {
            message.messageContextInfo = message.messageContextInfo || {};
            if (!message.messageContextInfo.messageSecret) {
                message.messageContextInfo.messageSecret =
                    crypto.randomBytes(32).toString('base64');
            }
        }
    },
    {
        types: ['interactiveMessage', 'buttonsMessage'],
        run(message) {
            message.messageContextInfo = message.messageContextInfo || {};
            message.messageContextInfo.deviceListMetadata =
                message.messageContextInfo.deviceListMetadata || {};
        },
    },
    {
        types: ['buttonsMessage'],
        run(bm) {
            const BUTTON_TYPE =
                proto?.Message?.ButtonsMessage?.Button?.Type;
            const HEADER_TYPE =
                proto?.Message?.ButtonsMessage?.HeaderType;

            if (bm.headerType !== undefined) {
                bm.headerType =
                    resolveEnum(HEADER_TYPE, bm.headerType);
            }

            if (Array.isArray(bm.buttons)) {
                for (const btn of bm.buttons) {
                    if (btn?.type !== undefined) {
                        btn.type =
                            resolveEnum(BUTTON_TYPE, btn.type);
                    }
                }
            }
        }
    },
    {
        types: ['richResponseMessage'],
        run(rm) {
            const MESSAGE_TYPE =
                proto?.AIRichResponseMessageType
            const SUBMESSAGE_TYPE =
                proto?.AIRichResponseSubMessageType
            const HIGHLIGHT_TYPE =
                proto?.AIRichResponseCodeMetadata?.AIRichResponseCodeHighlightType

            if (rm.messageType !== undefined) {
                rm.messageType =
                    resolveEnum(MESSAGE_TYPE, rm.messageType);
            }

            if (Array.isArray(rm.submessages)) {
                for (const subm of rm.submessages) {

                    if (subm?.messageType !== undefined) {
                        subm.messageType =
                            resolveEnum(SUBMESSAGE_TYPE, subm.messageType);
                    }

                    const blocks = subm?.codeMetadata?.codeBlocks;

                    if (!Array.isArray(blocks)) continue;

                    for (const cb of blocks) {
                        if (cb?.highlightType !== undefined) {
                            cb.highlightType =
                                resolveEnum(HIGHLIGHT_TYPE, cb.highlightType);
                        }
                    }
                }
            }
        }
    }
];

const relayMiddleware = [{
        types: ['interactiveMessage', 'buttonsMessage'],
        options: {
            additionalNodes: [{
                tag: 'biz',
                attrs: {},
                content: [{
                    tag: 'interactive',
                    attrs: {
                        type: 'native_flow',
                        v: '1',
                    },
                    content: [{
                        tag: 'native_flow',
                        attrs: {
                            v: '9',
                            name: 'mixed',
                        },
                    }, ],
                }, ],
            }, ],
        },
    },
    {
        types: [/^pollCreationMessage/i],
        options: {
            additionalNodes: [{
                tag: 'meta',
                attrs: {
                    polltype: 'creation',
                },
            }, ],
        },
    },
    {
        types: ['eventMessage'],
        options: {
            additionalNodes: [{
                tag: 'meta',
                attrs: {
                    event_type: 'creation',
                },
            }, ],
        },
    },
];

function walkTree(message) {
    const relayOptions = {};

    const walk = (obj) => {
        if (!obj || typeof obj !== 'object') return;

        const type = getType(obj);

        if (type) {
            const node = obj[type];

            for (const mw of messageMiddleware) {
                if (mw.types.some(rule => matchType(type, rule))) {
                    mw.run(node, obj, type);
                }
            }

            for (const mw of relayMiddleware) {
                if (mw.types.some(rule => matchType(type, rule))) {
                    mergeOptions(relayOptions, mw.options);
                }
            }
        }

        for (const key in obj) {
            const value = obj[key];

            if (value && typeof value === 'object') {
                walk(value);
            }
        }
    };

    walk(message);

    return relayOptions;
}

const getType = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    return Object.keys(obj).find(k => k.endsWith('Message')) || null;
};

const handler = async (m, {
    conn,
    text,
    command
}) => {
    if (!m.quoted) return m.reply('Reply pesannya!');

    const msg = await (conn.loadMessage(m.quoted.id) || m.quoted.fakeObj);

    const type = m.quoted.type;
    const relayOptions = walkTree(msg.message);

    if (command === 'relay') {
        const relay = await conn.relayMessage(m.chat, msg.message, relayOptions);
        return m.reply(relay);
    }

    const raw = stringify(msg);
    const message = stringify(msg.message);
    const key = stringify(msg.key);
    const options = stringify(relayOptions);
    const participant = msg.key.remoteJid || msg.key.participant || '-';
    const msgId = msg.key?.id || '-';

    const relayCode = `=> conn.relayMessage(
  m.chat,
  ${message},
  ${options}
)`;

    const files = {
        raw,
        message,
        relay: relayCode
    };

    if (['raw', 'message', 'relay'].some(v => text.includes('--' + v))) {
        const exportType = text.includes('--raw') ?
            'raw' :
            text.includes('--message') ?
            'message' :
            'relay';

        if (text.includes('--file')) {
            return conn.sendMessage(
                m.chat, {
                    document: Buffer.from(files[exportType]),
                    fileName: `${exportType}.json`,
                    mimetype: 'application/json',
                }, {
                    quoted: m
                }
            );
        }

        return m.reply(files[exportType]);
    }

    new Button(conn)
        .setTitle(capitalize(type))
        .setBody(raw)
        .setMedia({
            document: Buffer.from(raw),
            mimetype: 'application/json',
            fileName: `${type}.json`,
        })
        .setParams({
            limited_time_offer: {
                text: 'Create Relay Message',
                url: 'https://wa.me/6282139672290',
                copy_code: global.botname,
                expiration_time: Date.now() + 60000,
            },
            bottom_sheet: {
                in_thread_buttons_limit: 3,
                divider_indices: [1, 2, 3, 4, 5, 6],
                list_title: 'Payload Options',
                button_title: 'Other',
            },
        })
        .addCopy('Copy Full Raw', raw)
        .addCopy('Copy Relay Code', relayCode)
        .addCopy('Copy Payload', message)
        .addCopy('Copy Key', key)
        .addCopy('Copy Sender', participant)
        .addCopy('Copy Message ID', msgId)
        .addCopy('Copy Options', options)
        .send(m.chat, {
            quoted: m
        });
};

handler.command = handler.help = ['crm', 'relay'];
handler.tags = 'owner';
handler.owner = true;

handler.register = true

export default handler;

function mergeOptions(target, source) {
    for (const key in source) {
        if (Array.isArray(source[key])) {
            target[key] = target[key] || [];
            target[key].push(...source[key]);
        } else if (typeof source[key] === 'object') {
            target[key] = target[key] || {};
            mergeOptions(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
}

function matchType(type, rule) {
    if (rule instanceof RegExp) return rule.test(type);
    return rule === type;
}

function stringify(obj) {
    return JSON.stringify(obj, (key, value) => {
        if (Buffer.isBuffer(value)) return value.toString('base64');
        if (value?.type === 'Buffer' && Array.isArray(value.data)) {
            return Buffer.from(value.data).toString('base64');
        }
        return value;
    }, 2);
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}