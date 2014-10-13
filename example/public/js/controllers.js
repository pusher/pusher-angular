'use strict';

var pCControllers = angular.module('pusherCollabControllers', ['pusherCollabServices']);

pCControllers.controller('CollaborationCtrl', [
  '$scope',
  '$pusher',
  '$http',
  '$state',
  'channelManager',
  function ($scope, $pusher, $http, $state, channelManager) {
    var channel;
    var textzone = document.getElementById('textzone');

    $scope.members = channelManager.getMembers();

    $scope.sendUpdate = function (event) {
      channel = channelManager.get();
      var num = channelManager.getChannelNum();
      if (channel) {
        $http.post('/text-update', { channelNum: num, text: event.srcElement.value, socket_id: channel.client.connection.baseConnection.socket_id });
      }
    }

    $scope.$watch('text', function () {
      var r = 0;
      var temp = $scope.text.replace(/\s/g,' ');
      temp = temp.split(' ');
      for (var i = 0; i < temp.length; i++) {
        if (temp[i].length > 0)
          r++;
      };

      $scope.words = r;
      $scope.characters = $scope.text.length;
    });

    $scope.paragraphs = 0;
    $scope.words = 0;
    $scope.characters = 0;
    $scope.allCharacters = 0;
  }
]);

pCControllers.controller('SetupCtrl', [
  '$scope',
  '$pusher',
  '$http',
  '$state',
  'channelManager',
  function ($scope, $pusher, $http, $state, channelManager) {
    $scope.channel1ReadOnly = false;
    $scope.channel2ReadOnly = false;
    $scope.channel3ReadOnly = false;


    $scope.$watch('channel1ReadOnly', function() {
      if ($scope.channel1ReadOnly) {
        channelManager.set(1, $scope.username);
        $state.go('collaborate');
      }
    })

    $scope.$watch('channel2ReadOnly', function() {
      if ($scope.channel2ReadOnly) {
        channelManager.set(2, $scope.username);
        $state.go('collaborate');
      }
    })

    $scope.$watch('channel3ReadOnly', function() {
      if ($scope.channel3ReadOnly) {
        channelManager.set(3, $scope.username);
        $state.go('collaborate');
      }
    })
  }
]);
