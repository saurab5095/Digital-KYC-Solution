let phashHistory = [];

function addPhash(phash) {
  if (typeof phash === "string" && phash.trim().length > 0) {
    phashHistory.push(phash.trim());
  }
}

function getAllPhashes() {
  return [...phashHistory];
}

module.exports = { addPhash, getAllPhashes };
