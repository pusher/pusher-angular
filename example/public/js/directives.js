'use strict';

var pCDirectives = angular.module('pusherCollabDirectives', ['pusherCollabServices']);

pCDirectives.directive('collaborate', ['$pusher', 'channelManager', function($pusher, channelManager) {
  var linker = function(scope, elem, attrs) {
    scope.text = '';

    var channel = channelManager.get();

    function sortNumber(a, b) {
      return a - b;
    }

    channel.bind('pusher:subscription_succeeded', function (members) {
      if (channel.members.count > 1) {
        channel.trigger('client-joined', channel.members.me.id);
      }
    });

    channel.bind('client-joined', function (id) {
      var ids = [];
      for (var member in channel.members.members) {
        ids.push(member);
      }
      if (ids.indexOf(id) !== -1) { ids.splice(ids.indexOf(id), 1); }
      if (channel.members.me.id !== ids.sort(sortNumber)[0]) {
        channel.trigger('client-catchup', { id: id, text: scope.text });
      }
    });

    channel.bind('client-catchup', function (data) {
      if (data.id == channel.members.me.id) {
        scope.text = data.text;
      }
    });

    if (channel) {
      channel.bind('update', function (text) {
        if (elem.value !== text) {
          scope.text = text;
        }
      });
    }
  }
  return {
    restrict: 'A',
    link: linker
  }
}]);
