async function deductWallet(job) {
  // TODO: deduct cost from user's wallet when job is submitted
}

async function issueRefund(job) {
  // TODO: refund user's wallet when job is cancelled or failed
}

async function moveJobToHistory(job) {
  // TODO: archive completed/cancelled/failed job to history collection
}

module.exports = { deductWallet, issueRefund, moveJobToHistory };
