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

module.exports = class PluginDummy extends EventEmitter2 {
  constructor(opts) {
    console.log('CALLED: constructor', { opts });
    super();
    this.opts = opts;
    this._fulfillments = {};
    this._connected = false;
  }
  connect(opts) {
    console.log('CALLED: connect', { opts });
    this._connected = true;
    this.emit('connect');
    return Promise.resolve(null);
  }

  disconnect() {
    console.log('CALLED: disconnect');
    this._connected = false;
    this.emit('disconnect');
    return Promise.resolve(null);
  }

  isConnected() {
    console.log('CALLED: isConnected');
    return this._connected;
  }

  getInfo() {
    console.log('CALLED: getInfo');
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
    console.log('CALLED: getAccount');
    if (!this._connected) {
      return Promise.reject(new Error('not connected'));
    }
    return Promise.resolve('g.testing.dummy.conn1');
  }

  getBalance() {
    console.log('CALLED: getBalance');
    if (!this._connected) {
      return Promise.reject(new Error('not connected'));
    }
    return Promise.resolve('1000');
  }

  getFulfillment(transferId) {
    console.log('CALLED: getFulfillment', { transferId });
    if (typeof this._fulfillments[transferId] === 'undefined') {
      return Promise.reject(new MissingFulfillmentError());
    }
    return Promise.resolve(this._fulfillments[transferId]);
  }
  
  sendTransfer(transfer) {
    console.log('CALLED: sendTransfer', JSON.stringify(transfer, null, 2));
    this.emit('incoming_prepare', transfer);
    return Promise.resolve(null);
  }

  sendMessage(message) {
    console.log('CALLED: sendMessage', JSON.stringify(message, null, 2));
    this.emit('incoming_message', message);
    return Promise.resolve(null);
  }

  fulfillCondition(transferId, fulfillment)  {
    console.log('CALLED: fulfillCondition', { transferId, fulfillment });
    this._fulfillments[transferId] = fulfillment;
    this.emit('incoming_fulfill', transfer);
    return Promise.resolve(null);
  }

  rejectIncomingTransfer(transferId, rejectMessage) {
    console.log('CALLED: rejectIncomingTransfer', { transferId, rejectMessage });
    this.emit('incoming_reject', transfer);
    return Promise.resolve(null);
  }
};
