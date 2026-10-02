// Galois Field GF(2^8) and Reed-Solomon Error Correction for QR Code

// Precomputed GF(256) exp and log tables (primitive polynomial 0x11d)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(() => {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    EXP_TABLE[i + 255] = val;
    LOG_TABLE[val] = i;
    val = (val << 1) ^ (val & 0x80 ? 0x11d : 0);
  }
})();

export function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

export function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = EXP_TABLE[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

export function rsCalculate(data: Uint8Array, numEcBytes: number): Uint8Array {
  const gen = rsGeneratorPoly(numEcBytes);
  const result = new Uint8Array(numEcBytes);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0];
    for (let j = 0; j < numEcBytes - 1; j++) {
      result[j] = result[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    result[numEcBytes - 1] = gfMul(gen[numEcBytes], factor);
  }

  return result;
}

export interface QrVersionSpec {
  version: number;
  totalBytes: number;
  dataBytes: number;
  ecBytesPerBlock: number;
  blocks: number;
  alignmentPositions: number[];
}

// Low (L) error correction specs for versions 3 to 7 (sufficient for 50-150 bytes URI)
export const QR_SPECS: Record<number, QrVersionSpec> = {
  3: { version: 3, totalBytes: 70, dataBytes: 55, ecBytesPerBlock: 15, blocks: 1, alignmentPositions: [6, 22] },
  4: { version: 4, totalBytes: 100, dataBytes: 80, ecBytesPerBlock: 20, blocks: 1, alignmentPositions: [6, 26] },
  5: { version: 5, totalBytes: 134, dataBytes: 108, ecBytesPerBlock: 26, blocks: 1, alignmentPositions: [6, 30] },
  6: { version: 6, totalBytes: 172, dataBytes: 136, ecBytesPerBlock: 18, blocks: 2, alignmentPositions: [6, 34] },
  7: { version: 7, totalBytes: 196, dataBytes: 156, ecBytesPerBlock: 20, blocks: 2, alignmentPositions: [6, 22, 38] },
};

export function selectQrVersion(dataByteLength: number): QrVersionSpec {
  // +3 bytes overhead for Byte Mode indicator (4 bits) + length (8 bits) + terminator (4 bits)
  const required = dataByteLength + 3;
  for (const v of [3, 4, 5, 6, 7]) {
    if (QR_SPECS[v].dataBytes >= required) {
      return QR_SPECS[v];
    }
  }
  return QR_SPECS[7];
}
