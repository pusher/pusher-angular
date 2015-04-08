'use strict';

var pCServices = angular.module('pusherCollabServices', []);

pCDirectives.factory('channelManager', ['$pusher', function($pusher) {
  var channel, cNum;

  return {
    get: function () {
      return channel;
    },
    set: function (channelNum, username) {
      cNum = channelNum;
      var client = new Pusher('YOUR_APP_KEY', { auth: { params: { username: username}} });
      var pusher = $pusher(client);
      channel = pusher.subscribe('presence-collaborate-' + channelNum);
      return channel;
    },
    getChannelNum: function () {
      return cNum;
    },
    getMembers: function () {
      return channel.members;
    }
  }
}]);
