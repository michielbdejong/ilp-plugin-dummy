'use strict'

const co = require('co')
const ILP = require('ilp')
const DummyLedgerPlugin = require('.')

const sender = ILP.createSender({
  _plugin: DummyLedgerPlugin,
  account: 'https://localhost/ledger/accounts/alice',
  password: 'alice'
})

const receiver = ILP.createReceiver({
  _plugin: DummyLedgerPlugin,
  account: 'https://localhost/ledger/accounts/bob',
  password: 'bobbob',
  // A callback can be specified to review incoming payments.
  // This is required when using PSK.
  reviewPayment: (payment, transfer) => {
    if (+transfer.amount > 100) {
      return Promise.reject(new Error('payment is too big!'))
    }
  }
})

co(function * () {
  yield receiver.listen()
  receiver.on('incoming', (transfer, fulfillment) => {
    console.log('received transfer:', transfer)
    console.log('fulfilled transfer hold with fulfillment:', fulfillment)
  })
  // The user of this module is responsible for communicating the
  // PSK parameters from the recipient to the sender
  const pskParams = receiver.generatePskParams()

  // Note the payment is created by the sender
  const request = sender.createRequest({
    destinationAmount: '10',
    destinationAccount: pskParams.destinationAccount,
    sharedSecret: pskParams.sharedSecret
  })
  console.log('request:', request)

  const paymentParams = yield sender.quoteRequest(request)
  console.log('paymentParams', paymentParams)

  const result = yield sender.payRequest(paymentParams)
  console.log('sender result:', result)
}).catch((err) => {
  console.log(err)
})