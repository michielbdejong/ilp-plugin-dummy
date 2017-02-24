'use strict'

const co = require('co')
const ILP = require('ilp')
const DummyLedgerPlugin = require('.')

const sender = ILP.createSender({
  _plugin: DummyLedgerPlugin,
  prefix: 'ilpdemo.red.',
  account: 'https://red.ilpdemo.org/ledger/accounts/alice',
  password: 'alice'
})

const receiver = ILP.createReceiver({
  _plugin: DummyLedgerPlugin,
  prefix: 'ilpdemo.blue.',
  account: 'https://blue.ilpdemo.org/ledger/accounts/bob',
  password: 'bobbob'
})

co(function * () {
  yield receiver.listen()
  receiver.on('incoming', (transfer, fulfillment) => {
    console.log('received transfer:', transfer)
    console.log('fulfilled transfer hold with fulfillment:', fulfillment)
  })

  const request = receiver.createRequest({
    amount: '10',
  })
  console.log('request:', request)

  // Note the user of this module must implement the method for
  // communicating payment requests from the recipient to the sender
  const paymentParams = yield sender.quoteRequest(request)
  console.log('paymentParams', paymentParams)

  const result = yield sender.payRequest(paymentParams)
  console.log('sender result:', result)
}).catch((err) => {
  console.log(err)
})
