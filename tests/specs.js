'use strict';

describe('$pusher', function () {
  beforeEach(module('pusher-angular'))

  var $pusher, $rootScope;

  beforeEach(inject(function (_$pusher_, _$rootScope_) {
    $pusher = _$pusher_;
    $rootScope = _$rootScope_;
  }))

  var $p;
  var client;

  beforeEach(function () {
    function FakeBaseChannel(channelName) {
      this.name = channelName;
    }

    function FakePusherClient(apiKey) {
      this.apiKey = apiKey;
      this.connection = { bind_global: jasmine.createSpy('bind_global') };
      this.channels = {};
      this.callbacks = {};
      this.global_callbacks = [];
    }

    FakePusherClient.prototype = {
      bind: jasmine.createSpy('bind').and.callFake(function (eventName, callback) {
        this.callbacks[eventName] = callback;
      }),
      bind_global: jasmine.createSpy('bind_global').and.callFake(function (callback) {
        this.global_callbacks.push(callback);
      }),
      unbind: jasmine.createSpy('unbind').and.callFake(function (eventName, decoratedCallback) {
        if (this.callbacks[eventName] === decoratedCallback) {
          delete this.callbacks[eventName];
        }
      }),
      channel: function (channelName) { return this.channels[channelName]; },
      allChannels: jasmine.createSpy('allChannels').and.callFake(function () { return this.channels; }),
      subscribe: jasmine.createSpy('subscribe').and.callFake(function (channelName) {
        var ch = new FakeBaseChannel(channelName);
        this.channels[channelName] = ch;
        return ch;
      }),
      unsubscribe: jasmine.createSpy('unsubscribe'),
      disconnect: jasmine.createSpy('disconnect'),
      handleEvent: function (eventName, data) { this.callbacks[eventName](data); },
      handleGlobalEvent: function (payload) {
        for (var i = 0; i < this.global_callbacks.length; i++) {
          this.global_callbacks[i](payload.eventName, payload.data);
        }
      }
    }

    client = new FakePusherClient('123456789');
    $p = $pusher(client);

    spyOn($rootScope, '$digest');
  })

  describe('initialisation', function () {
    it('should accept a pusher client', function () {
      var $q;
      expect($q).toBeUndefined();

      $q = $pusher(client);
      expect($q).toBeDefined();
    });


    it('should not accept a string as the client', function () {
      var client = 'not a client object';

      expect(function () {
        $pusher(client);
      }).toThrowError('Invalid Pusher client object');
    });
  });

  describe('client', function () {
    it('should return the client', function () {
      expect($p.client).toEqual(client)
    });
  });

  describe('#subscribe', function () {
    it('should call subscribe on the client', function () {
      $p.subscribe('testChannel');
      expect(client.subscribe).toHaveBeenCalledWith('testChannel');
    });

    it('should return the channel object', function () {
      var channel = $p.subscribe('testChannel');
      expect(channel.name).toEqual('testChannel');
    });

    it('should reuse the channel if already subscribed to', function() {
      $p.subscribe('testChannel');
      $p.subscribe('testChannel');
      expect(client.subscribe.calls.count()).toBe(1);
    })
  });

  describe('#unsubscribe', function () {
    it('should call unsubscribe on the client', function () {
      $p.subscribe('testChannel');
      $p.unsubscribe('testChannel');
      expect(client.unsubscribe).toHaveBeenCalledWith('testChannel');
    });

    it('should not call unsubscribe on the client if the channel is not subscribed to', function () {
      $p.subscribe('testChannel');
      $p.unsubscribe('notASubscribedToChannel');
      expect(client.unsubscribe).not.toHaveBeenCalledWith('notASubscribedToChannel');
    });

    it('should only remove channels from the channels property if they are found', function () {
      $p.subscribe('testChannel');
      $p.subscribe('testChannel2');
      expect(Object.keys($p.channels).length).toEqual(2);
      delete $p.channels['testChannel2'];
      expect(Object.keys($p.channels).length).toEqual(1);
      $p.unsubscribe('testChannel2');
      expect(Object.keys($p.channels).length).toEqual(1);
    });

    it('should remove the channel from $pusher\'s channels', function () {
      $p.subscribe('testChannel');
      expect(Object.keys($p.channels).length).toEqual(1);
      $p.unsubscribe('testChannel');
      expect(Object.keys($p.channels).length).toEqual(0);
    });
  });

  describe('#bind', function () {
    it('should call bind on the client', function () {
      var callback = function () {};
      $p.bind('testEvent', callback);
      expect(client.bind).toHaveBeenCalled();
    });

    it('should setup the callback so that it is called appropriately', function () {
      var callback = jasmine.createSpy('callback');
      var payload = { message: 'test message' };
      $p.bind('testEvent', callback);
      client.handleEvent('testEvent', payload);
      expect(callback).toHaveBeenCalledWith(payload);
    });
  });

  describe('#unbind', function () {
    it('should call unbind on the client', function () {
      var callback = function() {};
      $p.unbind('testEvent', callback);
      expect(client.unbind).toHaveBeenCalled();
    });

    it('should remove the passed decoratedCallback from the client', function () {
      var callback = function() {};
      var decoratedCallback = $p.bind('test-event', callback);
      expect($p.client.callbacks['test-event']).toBeDefined();
      $p.unbind('test-event', decoratedCallback);
      expect($p.client.callbacks['test-event']).toBeUndefined();
    });
  });

  describe('#bind_global', function () {
    it('should call bind_global on the base client', function () {
      var callback = function () {};
      $p.bind_global(callback);
      expect(client.bind_global).toHaveBeenCalled();
    });

    it('should setup the callback so that it is called appropriately', function () {
      var callback = jasmine.createSpy('callback');
      var payload = { data: { message: 'test message' }, eventName: 'testMessage' };
      $p.bind_global(callback);
      $p.client.handleGlobalEvent(payload);
      expect(callback).toHaveBeenCalledWith(payload.eventName, payload.data);
    });
  });

  describe('#channel', function () {
    it('should return a channel object', function () {
      $p.subscribe('testChannel');
      var channel = $p.channel('testChannel');
      expect(channel.name).toEqual('testChannel');
    });

    it('should return undefined for a channel that\'s not subscried to', function () {
      $p.subscribe('testChannel');
      var channel = $p.channel('notSubscribed');
      expect(channel).toBeUndefined();
    });
  });

  describe('#allChannels', function () {
    it('should return an object containing the subscribed-to channels', function () {
      expect(Object.keys($p.allChannels()).length).toEqual(0);
      $p.subscribe('testChannel');
      expect(Object.keys($p.allChannels()).length).toEqual(1);
      $p.subscribe('testChannel2')
      expect(Object.keys($p.allChannels()).length).toEqual(2);
    });
  });

  describe('#disconnect', function () {
    it('should call disconnect on the client', function () {
      $p.disconnect();
      expect(client.disconnect).toHaveBeenCalled();
    });
  });

});


describe('$channel', function () {
  beforeEach(module('pusher-angular'))

  var $pusher, $channel, $rootScope;

  beforeEach(inject(function (_$pusher_, _$channel_, _$rootScope_) {
    $pusher = _$pusher_;
    $channel = _$channel_;
    $rootScope = _$rootScope_;
  }))

  var $p, $c, $d, client, channel, presence;

  beforeEach(function () {
    function FakeBaseChannel(channelName) {
      this.name = channelName;
      this.members = { me: { user_id: 1 } };
      this.callbacks = {};
      this.global_callbacks = [];
    }

    FakeBaseChannel.prototype = {
      bind: jasmine.createSpy('bind').and.callFake(function (eventName, callback) {
        this.callbacks[eventName] = callback;
      }),
      unbind: jasmine.createSpy('unbind').and.callFake(function (eventName, decoratedCallback) {
        if (this.callbacks[eventName] === decoratedCallback) {
          delete this.callbacks[eventName];
        }
      }),
      bind_global: jasmine.createSpy('bind_global').and.callFake(function (callback) {
        this.global_callbacks.push(callback);
      }),
      trigger: jasmine.createSpy('trigger'),
      handleEvent: function (eventName, data) { this.callbacks[eventName](data); },
      handleGlobalEvent: function (payload) {
        for (var i = 0; i < this.global_callbacks.length; i++) {
          this.global_callbacks[i](payload.eventName, payload.data);
        }
      }
    }

    function FakePusherClient(apiKey) {
      this.apiKey = apiKey;
      this.connection = { bind_global: jasmine.createSpy('bind_global') };
      this.channels = {};
    }

    FakePusherClient.prototype = {
      bind: jasmine.createSpy('bind'),
      channel: function (channelName) { return this.channels[channelName]; },
      allChannels: jasmine.createSpy('allChannels').and.callFake(function () { return this.channels; }),
      subscribe: jasmine.createSpy('subscribe').and.callFake(function (channelName) {
        var ch = new FakeBaseChannel(channelName);
        this.channels[channelName] = ch;
        return ch;
      }),
      unsubscribe: jasmine.createSpy('unsubscribe'),
      disconnect: jasmine.createSpy('disconnect')
    }

    client = new FakePusherClient('123456789');
    $p = $pusher(client);

    channel = new FakeBaseChannel('testChannel');
    $c = $channel(channel, $p);

    presence = new FakeBaseChannel('presence-test');
    $d = $channel(presence, $p);
  })

  describe('initialisation', function () {
    it('should accept a pusher channel and a pusher client', function () {
      var $d;
      expect($d).toBeUndefined();

      $d = $channel(channel, $p);
      expect($d).toBeDefined();
    });


    it('should not accept a string as the channel', function () {
      var channel = 'not a channel object';

      expect(function () {
        $channel(channel);
      }).toThrowError('Invalid Pusher channel object');
    });
  });

  describe('client', function () {
    it('should return the $pusher object', function () {
      expect($c.client).toEqual($p);
    });
  });

  describe('baseChannel', function () {
    it('should return the baseChannel object', function () {
      expect($d.baseChannel).toEqual(presence);
    });
  });

  describe('members', function () {
    it('should return a $members object', function () {
      expect($d.members.count).toEqual(0);
      expect($d.members.baseChannel).toEqual(presence);
    });

    it('should throw an error if called on a non-presence channel', function () {
      expect(function () {
        $c.members();
      }).toThrowError('Members object only exists for presence channels');
    });
  });

  describe('#bind', function () {
    it('should call bind on the channel', function () {
      var callback = function () {};
      $c.bind('testEvent', callback);
      expect(channel.bind).toHaveBeenCalled();
    });

    it('should setup the callback so that it is called appropriately', function () {
      var callback = jasmine.createSpy('callback');
      var payload = { message: 'test message' };
      $c.bind('testEvent', callback);
      channel.handleEvent('testEvent', payload);
      expect(callback).toHaveBeenCalledWith(payload);
    });
  });

  describe('#unbind', function () {
    it('should call unbind on the channel', function () {
      var callback = function() {};
      $c.unbind('testEvent', callback);
      expect(channel.unbind).toHaveBeenCalled();
    });

    it('should remove the passed decoratedCallback from the baseChannel', function () {
      var callback = function() {};
      var decoratedCallback = $c.bind('test-event', callback);
      expect($c.baseChannel.callbacks['test-event']).toBeDefined();
      $c.unbind('test-event', decoratedCallback);
      expect($c.baseChannel.callbacks['test-event']).toBeUndefined();
    });
  });

  describe('#bind_global', function () {
    it('should call bind_global on the base connection', function () {
      var callback = function () {};
      $c.bind_global(callback);
      expect(channel.bind_global).toHaveBeenCalled();
    });

    it('should setup the callback so that it is called appropriately', function () {
      var callback = jasmine.createSpy('callback');
      var payload = { data: { members: { user_id: 1 } }, eventName: 'pusher:subscription_succeeded' };
      $c.bind_global(callback);
      $c.baseChannel.handleGlobalEvent(payload);
      expect(callback).toHaveBeenCalledWith(payload.eventName, payload.data);
    });
  });

  describe('#trigger', function () {
    it('should call trigger on the channel', function () {
      var payload = { message: 'tigger test' };
      $d.trigger('client-test-event', payload);
      expect(presence.trigger).toHaveBeenCalledWith('client-test-event', payload);
    });

    it('should throw an error if called on a non-presence and non-private channel', function () {
      var payload = { message: 'tigger test' };
      expect(function () {
        $c.trigger('client-test-event', payload);
      }).toThrowError('Presence or private channel required');
    });

    it('should throw an error if event name is not correctly prefixed', function () {
      var payload = { message: 'tigger test' };
      expect(function () {
        $d.trigger('test-event', payload);
      }).toThrowError('Event name requires \'client-\' prefix');
    });
  });
});

describe('$members', function () {
  beforeEach(module('pusher-angular'))

  var $pusher, $channel, $members, $rootScope;

  beforeEach(inject(function (_$pusher_, _$channel_, _$members_, _$rootScope_) {
    $pusher = _$pusher_;
    $channel = _$channel_;
    $members = _$members_;
    $rootScope = _$rootScope_;
  }))

  var $p, $d, $m, client, channel, presence;

  beforeEach(function () {
    function FakeBaseMembers() {
      this.members = { 2: null };
      this.me = { user_id: 1 };
      this.count = 0;
    }

    FakeBaseMembers.prototype = {
      get: jasmine.createSpy('get').and.returnValue({ 1: null }),
      each: jasmine.createSpy('each').and.callFake(function (callback) {
        for(var member in this.members) {
          callback(member);
        }
      })
    }

    function FakeBaseChannel(channelName) {
      this.name = channelName;
      this.members = new FakeBaseMembers;
      this.callbacks = {};
    }

    FakeBaseChannel.prototype = {
      bind: jasmine.createSpy('bind').and.callFake(function (eventName, callback) {
        this.callbacks[eventName] = callback;
      }),
      trigger: jasmine.createSpy('trigger'),
      handleEvent: function (eventName, data) { this.callbacks[eventName](data); }
    }

    function FakePusherClient(apiKey) {
      this.apiKey = apiKey;
      this.connection = { bind_global: jasmine.createSpy('bind_global') };
      this.channels = {};
    }

    FakePusherClient.prototype = {
      bind: jasmine.createSpy('bind'),
      channel: function (channelName) { return this.channels[channelName]; },
      allChannels: jasmine.createSpy('allChannels').and.callFake(function () { return this.channels; }),
      subscribe: jasmine.createSpy('subscribe').and.callFake(function (channelName) {
        var ch = new FakeBaseChannel(channelName);
        this.channels[channelName] = ch;
        return ch;
      }),
      unsubscribe: jasmine.createSpy('unsubscribe'),
      disconnect: jasmine.createSpy('disconnect')
    }

    client = new FakePusherClient('123456789');
    $p = $pusher(client);

    presence = new FakeBaseChannel('presence-test');
    $d = $channel(presence, $p);

    $m = $members(presence.members, presence);

    spyOn($rootScope, '$digest');
  })

  describe('initialisation', function () {
    it('should accept a pusher channel members object and a channel', function () {
      var $n;
      expect($n).toBeUndefined();

      $n = $members(presence.members, presence);
      expect($n).toBeDefined();
    });


    it('should not accept a string as the members object', function () {
      var members = 'not a members object';

      expect(function () {
        $members(members, presence);
      }).toThrowError('Invalid Pusher channel members object');
    });
  });

  describe('baseMembers', function () {
    it('should return the baseMembers object', function () {
      expect($m.baseMembers).toEqual(presence.members);
    });
  });

  describe('baseChannel', function () {
    it('should return the baseChannel object', function () {
      expect($m.baseChannel).toEqual(presence);
    });
  });

  describe('should use the subscription_succeeded event to set members data', function () {
    beforeEach(function () {
      presence.handleEvent('pusher:subscription_succeeded', { me: { user_id: 1 }, count: 3, members: { 1: null, 2: null, 3: null }});
    })

    it('and return the members me object', function () {
      expect($m.me).toEqual({ user_id: 1});
    });

    it('and return the members count', function () {
      expect($m.count).toEqual(3);
    });

    it('and return the members members object', function () {
      expect($m.members).toEqual({ 1: null, 2: null, 3: null });
    });

    it('and trigger a $digest() on the $rootScope', function () {
      expect($rootScope.$digest).toHaveBeenCalled();
    });
  });

  describe('should use the member_added event to manage members data', function () {
    beforeEach(function () {
      presence.handleEvent('pusher:subscription_succeeded', { me: { user_id: 1 }, count: 3, members: { 1: null, 2: null, 3: null }});
      presence.handleEvent('pusher:member_added', { id: 4 , info: null });
    })

    it('and return the updated members object', function () {
      expect($m.members).toEqual({ 1: null, 2: null, 3: null, 4: null });
    });

    it('and return the updated members count', function () {
      expect($m.count).toEqual(4);
    });

    it('and handle members who have user info', function () {
      presence.handleEvent('pusher:member_added', { id: 5 , info: { email: 'hamilton@pusher.com' } });
      expect($m.members['5']).toEqual({ email: 'hamilton@pusher.com' });
    });

    it('and trigger a $digest() on the $rootScope', function () {
      expect($rootScope.$digest).toHaveBeenCalled();
    });
  });

  describe('should use the member_removed event to manage members data', function () {
    beforeEach(function () {
      presence.handleEvent('pusher:subscription_succeeded', { me: { user_id: 1 }, count: 3, members: { 1: null, 2: null, 3: null }});
      presence.handleEvent('pusher:member_removed', { id: 2 , info: null });
    })

    it('and return the updated members object', function () {
      expect($m.members).toEqual({ 1: null, 3: null });
    });

    it('and return the updated members count', function () {
      expect($m.count).toEqual(2);
    });

    it('and trigger a $digest() on the $rootScope', function () {
      expect($rootScope.$digest).toHaveBeenCalled();
    });
  });

  describe('#get', function () {
    it('should call get on the baseMembers object', function () {
      $m.get(1);
      expect($m.baseMembers.get).toHaveBeenCalledWith(1);
    });

    it('should return a members object for a present member', function () {
      expect($m.baseMembers.get(1)).toEqual({ 1: null });
    });
  });

  describe('#each', function () {
    it('should call each on the baseMembers object', function () {
      $m.each(function () {});
      expect($m.baseMembers.each).toHaveBeenCalled();
    });
  });

});

describe('$channel', function () {
  beforeEach(module('pusher-angular'))

  var $pusher, $channel, $connection, $rootScope;

  beforeEach(inject(function (_$pusher_, _$channel_, _$connection_, _$rootScope_) {
    $pusher = _$pusher_;
    $channel = _$channel_;
    $connection = _$connection_;
    $rootScope = _$rootScope_;
  }))

  var $p, $c, $conn, client, channel, connection;

  beforeEach(function () {
    function FakeBaseConnection() {
      this.socket_id = '40972.21412';
      this.callbacks = {};
      this.global_callbacks = [];
    }

    FakeBaseConnection.prototype = {
      bind: jasmine.createSpy('bind').and.callFake(function (eventName, callback) {
        this.callbacks[eventName] = callback;
      }),
      bind_global: jasmine.createSpy('bind_global').and.callFake(function (callback) {
        this.global_callbacks.push(callback);
      }),
      handleEvent: function (eventName, data) {
        this.callbacks[eventName](data);
      },
      handleGlobalEvent: function (payload) {
        for (var i = 0; i < this.global_callbacks.length; i++) {
          this.global_callbacks[i](payload.eventName, payload.data);
        }
      }
    }

    function FakeBaseChannel(channelName) {
      this.name = channelName;
      this.members = { me: { user_id: 1 } };
      this.callbacks = {};
    }

    FakeBaseChannel.prototype = {
      bind: jasmine.createSpy('bind').and.callFake(function (eventName, callback) {
        this.callbacks[eventName] = callback;
      }),
      trigger: jasmine.createSpy('trigger'),
      handleEvent: function (eventName, data) { this.callbacks[eventName](data); }
    }

    function FakePusherClient(apiKey) {
      this.apiKey = apiKey;
      this.connection = new FakeBaseConnection();
      this.channels = {};
    }

    FakePusherClient.prototype = {
      bind: jasmine.createSpy('bind'),
      channel: function (channelName) { return this.channels[channelName]; },
      allChannels: jasmine.createSpy('allChannels').and.callFake(function () { return this.channels; }),
      subscribe: jasmine.createSpy('subscribe').and.callFake(function (channelName) {
        var ch = new FakeBaseChannel(channelName);
        this.channels[channelName] = ch;
        return ch;
      }),
      unsubscribe: jasmine.createSpy('unsubscribe'),
      disconnect: jasmine.createSpy('disconnect')
    }

    client = new FakePusherClient('123456789');
    $p = $pusher(client);

    channel = new FakeBaseChannel('testChannel');
    $c = $channel(channel, $p);

    connection = new FakeBaseConnection();
    $conn = $connection(client.connection, client);
  })

  describe('initialisation', function () {
    it('should accept a pusher channel and a pusher client', function () {
      var $conn2;
      expect($conn2).toBeUndefined();

      $conn2 = $connection(client.connection, client);
      expect($conn2).toBeDefined();
    });


    it('should not accept a string as the connection', function () {
      var connection = 'not a connection object';

      expect(function () {
        $connection(connection);
      }).toThrowError('Invalid Pusher connection object');
    });
  });

  describe('connection', function () {
    it('should return the baseConnection object', function () {
      expect($conn.baseConnection).toEqual(connection);
    });
  });

  describe('baseClient', function () {
    it('should return the baseClient object', function () {
      expect($conn.baseClient).toEqual(client);
    });
  });

  describe('#bind', function () {
    it('should call bind on the base connection', function () {
      var callback = function () {};
      $conn.bind('pusher:subscription_succeeded', callback);
      expect(connection.bind).toHaveBeenCalled();
    });

    it('should setup the callback so that it is called appropriately', function () {
      var callback = jasmine.createSpy('callback');
      var data = { message: 'test message' };
      $conn.bind('pusher:subscription_succeeded', callback);
      $conn.baseConnection.handleEvent('pusher:subscription_succeeded', data);
      expect(callback).toHaveBeenCalledWith(data);
    });
  });

  describe('#bind_global', function () {
    it('should call bind_global on the base connection', function () {
      var callback = function () {};
      $conn.bind_global(callback);
      expect(connection.bind_global).toHaveBeenCalled();
    });

    it('should setup the callback so that it is called appropriately', function () {
      var callback = jasmine.createSpy('callback');
      var payload = { data: { message: 'test message' }, eventName: 'pusher:connected' };
      $conn.bind_global(callback);
      $conn.baseConnection.handleGlobalEvent(payload);
      expect(callback).toHaveBeenCalledWith(payload.eventName, payload.data);
    });
  });
});
