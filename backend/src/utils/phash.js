function hexToBigInt(hex) {
  return BigInt('0x' + hex);
}

function phashDistance(phashA, phashB) {
  const a = hexToBigInt(phashA);
  const b = hexToBigInt(phashB);
  const x = a ^ b; 

  let count = 0n;
  let y = x;

  while (y > 0n) {
    count += y & 1n;
    y = y >> 1n;
  }

  return Number(count);
}

module.exports = { phashDistance };
