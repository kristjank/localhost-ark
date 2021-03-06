const Client = require('@arkecosystem/client');
const crypto = require('@arkecosystem/crypto');

const version = 2;

async function createAndPostTransaction (
  sender,
  passphrase,
  recipient,
  tacoApiUri,
  params = {}
) {
  const client = new Client(tacoApiUri, version);
  const { price = 0 } = params;

  const senderWallet = await getWallet(sender)
  const recipientWallet = await getWallet(recipient)

  try {
    const transaction = await postTransaction({
      recipient: recipientWallet.address,
      senderPublicKey: senderWallet.address,
      amount: price,
      passphrase
    });
    return transaction;
  } catch (error) {
    throw error;
  }

  async function getWallet(address) {
    try {
      const { data } = await client.resource('wallets').get(address)
      return data.data
    } catch (error) {
      throw error;
    }
  }

  async function postTransaction ({ amount, recipient, senderPublicKey, passphrase }) {
    try {
      const transaction = crypto.transactionBuilder
        .transfer()
        .amount(amount)
        .vendorField(JSON.stringify(params))
        .recipientId(recipient)
        .senderPublicKey(senderPublicKey)
        .sign(passphrase)
        .getStruct();

      await client.resource('transactions').create({ transactions: [transaction] });
      return transaction;
    } catch (error) {
      throw new Error(
        `An error has occured while posting the transaction: ${error}`
      );
    }
  }
}

async function fetchTransactions(tacoApiUri, sender) {
  const client = new Client(tacoApiUri, version);
  const { data: { data: transactions = [] } = {} } = await client.resource('transactions').all()
  const filteredTransactions = (transactions || []).filter(function (transaction) {
    return !!transaction.vendorField && transaction.sender === sender;
  });
  return filteredTransactions.map(function (transaction) {
    try {
      return { ...transaction, vendorField: JSON.parse(transaction.vendorField) }
    } catch (err) {
      return transaction;
    }
  });
}

module.exports = function buildTacoApiClient (config) {
  const { sender, passphrase, recipient, uri } = config;

  return {
    listTransactions: async function listTransactions() {
      try {
        return fetchTransactions(uri, sender);
      } catch (error) {
        throw error;
      }
    },
    postTransaction: async function postTransaction (params) {
      try {
        const transaction = await createAndPostTransaction(
          sender,
          passphrase,
          recipient,
          uri,
          params
        );
        return transaction;
      } catch (error) {
        throw error;
      }
    }
  };
};
