// QR Code Matrix Builder & Pattern Layout (RFC 18004)
import { rsCalculate, selectQrVersion, QrVersionSpec } from './qrMath';

const FORMAT_L_MASK0 = [true, true, true, false, true, true, true, true, true, false, false, false, true, false, false];

export function generateQrMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(text);
  const spec: QrVersionSpec = selectQrVersion(rawBytes.length);
  const size = spec.version * 4 + 17;

  // 1. Bitstream generation
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };

  pushBits(0b0010, 4); // Byte mode
  pushBits(rawBytes.length, 8); // Character count (8 bits for v1-9)
  for (const b of rawBytes) pushBits(b, 8);

  const totalDataBits = spec.dataBytes * 8;
  const termLen = Math.min(4, totalDataBits - bits.length);
  pushBits(0, termLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes = new Uint8Array(spec.dataBytes);
  for (let i = 0; i < bits.length / 8; i++) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) byteVal = (byteVal << 1) | bits[i * 8 + j];
    dataBytes[i] = byteVal;
  }

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  for (let i = bits.length / 8; i < spec.dataBytes; i++) {
    dataBytes[i] = padBytes[padIdx++ % 2];
  }

  // 2. Interleaving & Error Correction
  const blockSize = Math.floor(spec.dataBytes / spec.blocks);
  const allData: number[] = [];
  const allEc: Uint8Array[] = [];

  for (let b = 0; b < spec.blocks; b++) {
    const chunk = dataBytes.slice(b * blockSize, (b + 1) * blockSize);
    allEc.push(rsCalculate(chunk, spec.ecBytesPerBlock));
  }

  for (let i = 0; i < blockSize; i++) {
    for (let b = 0; b < spec.blocks; b++) allData.push(dataBytes[b * blockSize + i]);
  }
  for (let i = 0; i < spec.ecBytesPerBlock; i++) {
    for (let b = 0; b < spec.blocks; b++) allData.push(allEc[b][i]);
  }

  // 3. Matrix Setup
  const m: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  const setFinder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = r0 + r;
        const col = c0 + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        const isCore = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        if (!isCore) {
          m[row][col] = false;
        } else {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          m[row][col] = isBorder || isCenter;
        }
      }
    }
  };

  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (m[6][i] === null) m[6][i] = i % 2 === 0;
    if (m[i][6] === null) m[i][6] = i % 2 === 0;
  }

  // Alignment patterns
  for (const ar of spec.alignmentPositions) {
    for (const ac of spec.alignmentPositions) {
      if ((ar < 9 && ac < 9) || (ar < 9 && ac > size - 9) || (ar > size - 9 && ac < 9)) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          m[ar + r][ac + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        }
      }
    }
  }

  // Dark module & format reservations
  m[size - 8][8] = true;
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === null) m[8][i] = false;
    if (m[i][8] === null) m[i][8] = false;
    if (m[8][size - 1 - i] === null) m[8][size - 1 - i] = false;
    if (m[size - 1 - i][8] === null) m[size - 1 - i][8] = false;
  }

  // 4. Data bit placement with Mask 0 ((row + col) % 2 === 0)
  const bitStream: boolean[] = [];
  for (const byte of allData) {
    for (let i = 7; i >= 0; i--) bitStream.push(((byte >>> i) & 1) === 1);
  }

  let bitIdx = 0;
  let upwards = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const rows = upwards ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (m[r][c] === null) {
          const val = bitIdx < bitStream.length ? bitStream[bitIdx++] : false;
          const mask = (r + c) % 2 === 0;
          m[r][c] = val !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // 5. Place Format Info (Level L, Mask 0)
  const f = FORMAT_L_MASK0;
  for (let i = 0; i < 6; i++) m[8][i] = f[i];
  m[8][7] = f[6];
  m[8][8] = f[7];
  m[7][8] = f[8];
  for (let i = 9; i < 15; i++) m[14 - i][8] = f[i];

  for (let i = 0; i < 8; i++) m[size - 1 - i][8] = f[i];
  for (let i = 8; i < 15; i++) m[8][size - 15 + i] = f[i];

  return m.map((row) => row.map((cell) => cell ?? false));
}
