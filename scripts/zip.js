"use strict";
/* Minimal dependency-free ZIP writer (deflate) used by build.js. */
const zlib = require("zlib");
const core = require("../src/core.js");
function zip(entries, date) {
  const d = date || new Date(Date.UTC(2026, 0, 1, 0, 0, 0)), chunks = [], central = []; let offset = 0;
  const t = ((d.getUTCHours() & 31) << 11) | ((d.getUTCMinutes() & 63) << 5) | ((d.getUTCSeconds() >> 1) & 31);
  const dt = (((d.getUTCFullYear() - 1980) & 127) << 9) | (((d.getUTCMonth() + 1) & 15) << 5) | (d.getUTCDate() & 31);
  for (const e of entries) {
    const name = Buffer.from(e.name, "utf8"), raw = e.data, comp = zlib.deflateRawSync(raw, { level: 9 }), useDeflate = comp.length < raw.length, body = useDeflate ? comp : raw, crc = core.crc32(raw);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(useDeflate ? 8 : 0, 8); lh.writeUInt16LE(t, 10); lh.writeUInt16LE(dt, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(name.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(useDeflate ? 8 : 0, 10); ch.writeUInt16LE(t, 12); ch.writeUInt16LE(dt, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(offset, 42);
    chunks.push(lh, name, body); central.push(Buffer.concat([ch, name])); offset += 30 + name.length + body.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat(chunks.concat([cd, end]));
}
module.exports = { zip };
