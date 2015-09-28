'use strict';

angular.module('pusherCollaboration', [
  'pusherCollabControllers',
  'pusherCollabDirectives',
  'pusherCollabServices',
  'ui.router',
  'pusher-angular'
])
.config(['$urlRouterProvider', '$locationProvider', '$stateProvider',
  function($urlRouterProvider, $locationProvider, $stateProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
    .state('home', {
      url: '/',
      templateUrl: '/views/setup.html',
      controller: 'SetupCtrl'
    })
    .state('collaborate', {
      url: '/collaborate',
      templateUrl: '/views/text.html',
      controller: 'CollaborationCtrl'
    })
  }
]);
