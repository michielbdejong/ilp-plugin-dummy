'use strict'

const EventEmitter2 = require('eventemitter2');

class InvalidFieldsError extends Error { constructor (message) { super(message); this.name = 'InvalidFieldsError' } }
class TransferNotFoundError extends Error { constructor (message) { super(message); this.name = 'TransferNotFoundError' } }
class MissingFulfillmentError extends Error { constructor (message) { super(message); this.name = 'MissingFulfillmentError' } }
class NotAcceptedError extends Error { constructor (message) { super(message); this.name = 'NotAcceptedError' } }
class AlreadyRolledBackError extends Error { constructor (message) { super(message); this.name = 'AlreadyRolledBackError' } }
class AlreadyFulfilledError extends Error { constructor (message) { super(message); this.name = 'AlreadyFulfilledError' } }
class DuplicateIdError extends Error { constructor (message) { super(message); this.name = 'DuplicateIdError' } }
class TransferNotConditionalError extends Error { constructor (message) { super(message); this.name = 'TransferNotConditionalError' } }
class NoSubscriptionsError extends Error { constructor (message) { super(message); this.name = 'NoSubscriptionsError' } }

// used to emit event on the other end when faking sendMessage/sendTransfer
var instances = {};
function register(instance) {
    instances[instance.opts.account] = instance;
}
function other(instance) {
  var me = instance.opts.account;
  for (var account in instances) {
    if (account === me) {
      continue;
    }
    return instances[account];
  }
}

// the ledger should allow the sender to see which fulfillment the receiver submitted
var fulfillments = {};
var transfers = {};

module.exports = class PluginDummy extends EventEmitter2 {
  constructor(opts) {
    console.log('CALLED: constructor', opts.account, { opts });
    super();
    this.opts = opts;
    this._connected = false;
    register(this);
  }
  connect(opts) {
    console.log('CALLED: connect', this.opts.account, { opts });
    this._connected = true;
    this.emit('connect');
    return Promise.resolve(null);
  }

  disconnect() {
    console.log('CALLED: disconnect', this.opts.account);
    this._connected = false;
    this.emit('disconnect');
    return Promise.resolve(null);
  }

  isConnected() {
    console.log('CALLED: isConnected', this.opts.account);
    return this._connected;
  }

  getInfo() {
    console.log('CALLED: getInfo', this.opts.account);
    return {
      prefix: 'g.testing.dummy.',
      precision: 19,
      scale: 9,
      currencyCode: 'USD',
      currencySymbol: '$',
      connectors: [ 'g.testing.dummy.conn2', 'g.testing.dummy.conn3' ]
    };
  }

  getAccount() {
    console.log('CALLED: getAccount', this.opts.account);
    if (!this._connected) {
      throw new Error('not connected');
    }
    return 'g.testing.dummy.conn1';
  }

  getBalance() {
    console.log('CALLED: getBalance', this.opts.account);
    if (!this._connected) {
      return Promise.reject(new Error('not connected'));
    }
    return Promise.resolve('1000');
  }

  getFulfillment(transferId) {
    console.log('CALLED: getFulfillment', this.opts.account, { transferId });
    if (typeof fulfillments[transferId] === 'undefined') {
      return Promise.reject(new MissingFulfillmentError());
    }
    return Promise.resolve(fulfillments[transferId]);
  }
  
  sendTransfer(transfer) {
    console.log('CALLED: sendTransfer', this.opts.account, JSON.stringify(transfer, null, 2));
    transfers[transfer.id] = transfer;
    this.emit('outgoing_prepare', transfer);
    setTimeout(() => {
      other(this).emit('incoming_prepare', transfer);
    });
    return Promise.resolve(null);
  }

  sendMessage(message) {
    console.log('CALLED: sendMessage', this.opts.account, JSON.stringify(message, null, 2));
    // there is no event for outgoing_message.
    setTimeout(() => {
      other(this).emit('incoming_message', message);
    });
    return Promise.resolve(null);
  }

  fulfillCondition(transferId, fulfillment)  {
    console.log('CALLED: fulfillCondition', this.opts.account, { transferId, fulfillment });
    var transfer = transfers[transferId];
    fulfillments[transferId] = fulfillment;
    this.emit('incoming_fulfill', transfer, fulfillment);
    setTimeout(() => {
      other(this).emit('outgoing_fulfill', transfer, fulfillment);
    });
    return Promise.resolve(null);
  }

  rejectIncomingTransfer(transferId, rejectMessage) {
    console.log('CALLED: rejectIncomingTransfer', this.opts.account, { transferId, rejectMessage });
    this.emit('incoming_reject', transfer);
    setTimeout(() => {
      other(this).emit('outgoing_reject', transfer);
    }, 0);
    return Promise.resolve(null);
  }
};
