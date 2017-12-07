# Pusher Angular Library

[![Build Status](https://travis-ci.org/pusher/pusher-angular.svg?branch=master)](https://travis-ci.org/pusher/pusher-angular)
[![Coverage Status](https://img.shields.io/coveralls/pusher/pusher-angular.svg)](https://coveralls.io/r/pusher/pusher-angular?branch=master)

This library is an open source client that allows you to connect to [Pusher](http://pusher.com/). It keeps largely the same API as the [pusher-js library](http://github.com/pusher/pusher-js/), with a few differences.

## Usage overview

The following topics are covered:

* Initialisation
* Subscribing to channels (public, private, and presence)
* Binding to events
    * Globally
    * Per-channel
    * Bind to everything
* Presence channel members
* Connection


## Initialisation

The first step is to make sure that you have all of the required libraries available to your app before you begin. You'll need something like this in your `index.html` (or similar):

````html
<!-- AngularJS -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.0/angular.min.js"></script>

<!-- pusher-js -->
<script src="//js.pusher.com/3.0/pusher.min.js"></script>

<!-- pusher-angular -->
<script src="//cdn.jsdelivr.net/npm/pusher-angular@latest/lib/pusher-angular.min.js"></script>

<!-- pusher-angular (backup CDN)
<script src="//cdnjs.cloudflare.com/ajax/libs/pusher-angular/1.0.0/pusher-angular.min.js"></script>
-->
````

If you'd like you can use Bower to install pusher-angular using the following command:

````bash
bower install pusher-angular --save
````

With that in place, to start using the Angular library you first need to create a Pusher client in exactly the same way that you create one using the [pusher-js library](http://github.com/pusher/pusher-js/), which is as follows:

````javascript
var pusher = new Pusher(API_KEY);
````

There are a number of configuration parameters which can be set for the Pusher client, which can be passed as an object to the Pusher constructor, i.e.:

````javascript
var pusher = new Pusher(API_KEY, {
  authEndpoint: "http://example.com/pusher/auth"
});
````

This is all documented in full [here](http://github.com/pusher/pusher-js/).

When you've created a Pusher client you then need to pass that client to a `$pusher` object inside your Angular controller, service, etc:

````javascript
angular.module('myApp').controller('MyController', ['$scope', '$pusher',
  function($scope, $pusher) {
    var client = new Pusher(API_KEY);
    var pusher = $pusher(client);
}]);
````

You can also see here that you need to inject the `$pusher` service into any controllers, services, etc where you'd like to use Pusher in an Angular context.

To make the `$pusher` service available to be used throughout your app you need to ensure that the `pusher-angular` module is included in your app. You do this by having the following in your app:

````javascript
angular.module('myApp', ['pusher-angular'])
````

Note that you can choose to define just one Pusher client, should you prefer, and then use that as the client throughout your Angular app. You can do this by simply instantiating a client as follows:

````javascript
window.client = new Pusher('API_KEY');
````

and then instantiating instances of `$pusher` in your Angular app using the standard:

````javascript
var pusher = $pusher(client);
````

Make sure that you define client before then referencing it in your Angular app though.

This is all of the setup required to have Pusher available in your Angular app. The content below will explain how you can utilise Pusher in an Angular app.



## Subscribing to channels

### Public channels

The default method for subscribing to a channel involves invoking the `subscribe` method of your `$pusher` object (named `pusher` throughout the examples provided here):

````javascript
var my_channel = pusher.subscribe('my-channel');
````

This returns a Channel object which events can be bound to.

### Private channels

Private channels are created in exactly the same way as normal channels, except that they reside in the 'private-' namespace. This means prefixing the channel name:

````javascript
var my_private_channel = pusher.subscribe('private-my-channel');
````

### Presence channels

Presence channels are again created in exactly the same way as normal channels, except that they reside in the 'presence-' namespace. This means prefixing the channel name:

````javascript
var my_presence_channel = pusher.subscribe('presence-my-channel');
````

It is possible to access channels by name, through the `channel` function:

````javascript
channel = pusher.channel('private-my-channel');
````

It is possible to access all subscribed channels through the `allChannels` function:

````javascript
var channels = pusher.allChannels();
console.group('Pusher - subscribed to:');
for (var i = 0; i < channels.length; i++) {
    var channel = channels[i];
    console.log(channel.name);
}
console.groupEnd();
````

## Binding to events

Events can be bound to at 2 levels, the global, and per channel. They take a very similar form to the way events are handled in jQuery. Note that this is one area in which the API differs to pusher-js. In pusher-angular, a call to `bind` will return a decorated version of the callback / handler that you pass as a parameter. You will need to assign this to a variable if you wish to unbind the handler from the object in the future. This is explained in the docs for unbinding below.

### Global events

You can attach behaviour to these events regardless of the channel the event is broadcast to. The following is an example of an app that binds to new comments from any channel:

````javascript
var client = new Pusher(API_KEY);
var pusher = $pusher(client);
pusher.subscribe('my-channel');
pusher.bind('new-comment',
  function(data) {
    // add comment into page
  }
);
````

### Per-channel events

These are bound to a specific channel, and mean that you can reuse event names in different parts of your client application. The following might be an example of a stock tracking app where several channels are opened for different companies:

````javascript
var client = new Pusher(API_KEY);
var pusher = $pusher(client);
var my_channel = pusher.subscribe('my-channel');
my_channel.bind('new-price',
  function(data) {
    // update with new price
  }
);
````

### Binding to everything

It is possible to bind to all events at either the global or channel level by using the method `bind_all`. This is used for debugging, but may have other utilities.

### Unbind event handlers

Remove previously-bound handlers from an object. Only handlers that match all of the provided arguments (`eventName`, `handler` or `context`) are removed.

````javascript
var handler = function() { console.log('testing'); };
var decoratedHandler = my_channel.bind('new-comment', handler);

channel.unbind('new-comment', decoratedHandler); // removes just `decoratedHandler` for the `new-comment` event
channel.unbind('new-comment'); // removes all handlers for the `new-comment` event
channel.unbind(null, decoratedHandler); // removes `decoratedHandler` for all events
channel.unbind(null, null, context); // removes all handlers for `context`
channel.unbind(); // removes all handlers on `channel`
````

The same API applies to unbinding handlers from the client object.

## Presence channel members

All presence channels have a members object that contains information about all of the members in the channel. More specific information can be found in the [Pusher docs](http://pusher.com/docs/client_api_guide/client_presence_channels#channel_members).

In this library the `members` object is setup to automatically reflect changes in members of the channel. That means if you had the following code in a controller:

````javascript
angular.module('myApp').controller('MyController', ['$scope', '$pusher',
  function($scope, $pusher) {
    var client = new Pusher(API_KEY);
    var pusher = $pusher(client);

    var presence = pusher.subscribe('presence-test');
    $scope.members = presence.members;
}]);
````

and the following HTML in your view:

````html
<div ng-controller='MyController'>
  {{members.count}}
  {{members.members}}
</div>
````

your view would update the members count and the members list whenever there was a member added or removed from the channel.


## Connection

You can bind to specific events on your `$pusher` objects connection, such as `state_change`, using the following code:

````javascript
var client = new Pusher(API_KEY);
var pusher = $pusher(client);

pusher.connection.bind('state_change', function (states) {
  // var previous = states.previous ...
})
````

Similarly to the client and channel, you can also bind to all events on a connection using the `bind_all` method. That looks like this:

````javascript
var client = new Pusher(API_KEY);
var pusher = $pusher(client);

pusher.connection.bind_all(function (eventName, data) {
  // if (eventName == 'state_change') { ...
})
````


## Contributing

If you'd like to contribute to the library then fork it, hack away at it, improve it, test it, and then make a pull request.

You can make sure that your changes / improvements don't break anything by running the unit tests. To run them just run `karma start` and then you can go ahead and make changes to the library and the tests and watch the tests run again to see if they're still passing.

You can generate the minimized file as following:

```bash
uglifyjs lib/pusher-angular.js -m -o lib/pusher-angular.min.js
```

## Support

If you have questions that aren't answered here or in the code's inline documentation then feel free to email [hamilton@pusher.com](mailto:hamilton@pusher.com) or get in touch with [Pusher support](http://pusher.com/about/contact).
