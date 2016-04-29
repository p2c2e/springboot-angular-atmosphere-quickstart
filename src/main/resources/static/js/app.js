'use strict';

(function() {
  var app = angular.module('toast', [ 'ngRoute' ]);
  app.config([ '$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
      controller : 'HomeController',
      templateUrl : 'templates/default.html'
    }).otherwise({
      redirectTo : '/'
    });
  } ]);

  app.controller('HomeController', [ '$scope', 'ToastService', '$http', function($scope, toastService, $http) {
    $scope.version = angular.version.full;
    $scope.messages = toastService.messages;
    $scope.lastmessage = "Nothing";
    $scope.processit = function() { 
    	$http.get("/broadcast/"+encodeURI($scope.lastmessage), { },
    	        function(response) { $scope.results = response; },
    	        function(failure) { console.log("failed :(", failure); });
    			$scope.lastmessage = ""; 
    	}
  } ]);

  app.factory('ToastService', [ '$rootScope', function($rootScope) {
    var messages = [];
    var websocketSocket = atmosphere;
    var websocketSubSocket;
    var websocketTransport = 'websocket';

    function getUrl() {
      var url = window.location.origin;
      if (url.indexOf('cfapps.io') > -1) {
        url = url + ':4443';
      }
      return url + '/websocket/toast';
    }
    
    var websocketRequest = {
      url : getUrl(),
      contentType : "application/json",
      transport : websocketTransport,
      trackMessageLength : true,
      withCredentials : true,
      reconnectInterval : 5000,
      enableXDR : true,
      timeout : 60000
    };

    websocketRequest.onOpen = function(response) {
      console.log('Trying to use transport: ' + response.transport);
      websocketTransport = response.transport;
    };

    websocketRequest.onClientTimeout = function(r) {
      setTimeout(function() {
        websocketSubSocket = websocketSocket.subscribe(websocketRequest);
      }, websocketRequest.reconnectInterval);
    };

    websocketRequest.onClose = function(response) {
      console.log('Server closed websocket connection. Changing transport to: '+ response.transport);
    };

    websocketRequest.onMessage = function(data) {
      $rootScope.$apply(function() {
        messages.push(data.responseBody);
      });
    };

    websocketSubSocket = websocketSocket.subscribe(websocketRequest);

    return {
      messages : messages
    };
  } ]);
})();