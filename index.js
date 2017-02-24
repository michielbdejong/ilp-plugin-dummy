'use strict'

const EventEmitter2 = require('eventemitter2');

class MissingFulfillmentError extends Error { constructor (message) { super(message); this.name = 'MissingFulfillmentError' } }

// singleton data structure faking the ledger (doesn't work if sender and receiver live in different processes):
var ledger = {
  instances: {},
  transfers: {},
  fulfillments: {},
};
 
function other(me) {
  for (var account in ledger.instances) {
    if (account === me) {
      continue;
    }
    return ledger.instances[account];
  }
}

module.exports = class PluginDummy extends EventEmitter2 {
  constructor(opts) {
    super();
    this.account = opts.account;
    this._connected = false;
    ledger.instances[this.account] = this;
  }
  connect(opts) {
    this._connected = true;
    this.emit('connect');
    return Promise.resolve(null);
  }

  disconnect() {
    this._connected = false;
    this.emit('disconnect');
    return Promise.resolve(null);
  }

  isConnected() {
    return this._connected;
  }

  getInfo() {
    return {
      prefix: 'g.testing.dummy.',
      precision: 19,
      scale: 9,
      currencyCode: 'USD',
      currencySymbol: '$',
      connectors: []
    };
  }

  getAccount() {
    if (!this._connected) {
      throw new Error('not connected');
    }
    return this.account;
  }

  getBalance() {
    if (!this._connected) {
      return Promise.reject(new Error('not connected'));
    }
    return Promise.resolve('1000');
  }

  getFulfillment(transferId) {
    if (typeof ledger.fulfillments[transferId] === 'undefined') {
      return Promise.reject(new MissingFulfillmentError());
    }
    return Promise.resolve(ledger.fulfillments[transferId]);
  }
  
  sendTransfer(transfer) {
    ledger.transfers[transfer.id] = transfer;
    this.emit('outgoing_prepare', transfer);
    setTimeout(() => {
      other(this.account).emit('incoming_prepare', transfer);
    });
    return Promise.resolve(null);
  }

  sendMessage(message) {
    // there is no event for outgoing_message.
    setTimeout(() => {
      other(this.account).emit('incoming_message', message);
    });
    return Promise.resolve(null);
  }

  fulfillCondition(transferId, fulfillment)  {
    var transfer = ledger.transfers[transferId];
    ledger.fulfillments[transferId] = fulfillment;
    this.emit('incoming_fulfill', transfer, fulfillment);
    setTimeout(() => {
      other(this.account).emit('outgoing_fulfill', transfer, fulfillment);
    });
    return Promise.resolve(null);
  }

  rejectIncomingTransfer(transferId, rejectMessage) {
    this.emit('incoming_reject', transfer);
    setTimeout(() => {
      other(this.account).emit('outgoing_reject', transfer);
    }, 0);
    return Promise.resolve(null);
  }
};
