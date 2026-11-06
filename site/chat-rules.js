// Words and patterns kept out of chat and wishes. Runs in each visitor's browser, before sending and on arrival.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CHURCH_RULES = factory();
}(typeof self !== 'undefined' ? self : this, function () {
// Rules for the Zen garden chat. Add words to BLOCKED as moderators find them.
// A word list catches only the obvious: see the manual on moderation.
const MAX_LENGTH = 300;

const BLOCKED = [
  // Money and scams, the main risk in a spiritual setting.
  'chuyển khoản', 'công đức', 'cúng dường', 'số tài khoản', 'stk', 'momo', 'donate', 'quyên góp',
  'cá độ', 'tài xỉu', 'vay tiền', 'đầu tư sinh lời',
  // Abuse. Extend this list before launch with a Vietnamese moderator.
  'đm', 'dm', 'đụ', 'địt', 'lồn', 'cặc', 'đéo',
];

const LINK = /(https?:\/\/|www\.|\b[\w-]+\.(com|vn|net|org|io|me|xyz|info)\b|t\.me\/|zalo\.me)/i;
const PHONE = /(\+?84|0)[\s.\-]?\d(?:[\s.\-]?\d){7,9}/;
const EMAIL = /[\w.+-]+@[\w-]+\.\w+/;

function normalize(text) {
  return text.toLocaleLowerCase('vi').replace(/\s+/g, ' ');
}

function containsWord(haystack, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'u').test(haystack);
}

function cleanChat(input) {
  if (typeof input !== 'string') return { ok: false, reason: 'empty' };
  // Control characters out; spaces tidied. The browser shows this as plain text.
  const text = input.replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return { ok: false, reason: 'empty' };
  if (text.length > MAX_LENGTH) return { ok: false, reason: 'long' };
  if (LINK.test(text)) return { ok: false, reason: 'link' };
  if (PHONE.test(text) || EMAIL.test(text)) return { ok: false, reason: 'contact' };
  const lower = normalize(text);
  if (BLOCKED.some((w) => containsWord(lower, w))) return { ok: false, reason: 'blocked' };
  return { ok: true, text };
}

return { cleanChat, BLOCKED, MAX_LENGTH };
}));
