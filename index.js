
/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter;
var Adapter = require('socket.io-adapter');

/**
 * Module exports.
 */

module.exports = PAdapter;

/**
 * Memory adapter constructor.
 *
 * @param {Namespace} nsp
 * @api public
 */

function PAdapter(nsp){
    Adapter.call(this, nsp);
}


PAdapter.prototype= Object.create(Adapter.prototype);
PAdapter.prototype.constructor = PAdapter;

/**
 * Adds a socket from a room.
 *
 * @param {String} socket id
 * @param {String} room name
 * @param {Function} callback
 * @api public
 */

PAdapter.prototype.add = function(id, room, fn){
    this.sids[id] = this.sids[id] || {};
    this.sids[id][room] = true;
    this.rooms[room] = this.rooms[room] || {};
    this.rooms[room][id] = true;
    if (fn) process.nextTick(fn.bind(null, null));
};

/**
 * Removes a socket from a room.
 *
 * @param {String} socket id
 * @param {String} room name
 * @param {Function} callback
 * @api public
 */

PAdapter.prototype.del = function(id, room, fn){
    this.sids[id] = this.sids[id] || {};
    this.rooms[room] = this.rooms[room] || {};
    delete this.sids[id][room];
    delete this.rooms[room][id];
    if (this.rooms.hasOwnProperty(room) && !keys(this.rooms[room]).length) {
        delete this.rooms[room];
    }

    if (fn) process.nextTick(fn.bind(null, null));
};

/**
 * Removes a socket from all rooms it's joined.
 *
 * @param {String} socket id
 * @api public
 */

PAdapter.prototype.delAll = function(id, fn){
    var rooms = this.sids[id];
    if (rooms) {
        for (var room in rooms) {
            if (rooms.hasOwnProperty(room)) {
                delete this.rooms[room][id];
            }

            if (this.rooms.hasOwnProperty(room) && !keys(this.rooms[room]).length) {
                delete this.rooms[room];
            }
        }
    }
    delete this.sids[id];
};

/**
 * Broadcasts a packet.
 *
 * Options:
 *  - `flags` {Object} flags for this packet
 *  - `except` {Array} sids that should be excluded
 *  - `rooms` {Array} list of rooms to broadcast to
 *
 * @param {Object} packet object
 * @api public
 */

PAdapter.prototype.broadcast = function(packet, opts){
    var rooms = opts.rooms || [];
    var except = opts.except || [];
    var ids = {};
    var self = this;
    var socket;

    packet.nsp = this.nsp.name;
    if (rooms.length) {
        for (var i = 0; i < rooms.length; i++) {
            var room = self.rooms[rooms[i]];
            if (!room) continue;
            for (var id in room) {
                if (room.hasOwnProperty(id)) {
                    if (ids[id] || ~except.indexOf(id)) continue;
                    socket = self.nsp.connected[id];
                    if (socket) {
                        socket.emit.apply(socket,packet);
                        ids[id] = true;
                    }
                }
            }
        }
    } else {
        for (var id in self.sids) {
            if (self.sids.hasOwnProperty(id)) {
                if (~except.indexOf(id)) continue;
                socket = self.nsp.connected[id];
                if (socket) {
                    socket.emit.apply(socket,packet);
                }
            }
        }
    }
};
