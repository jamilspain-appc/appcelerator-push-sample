var win = Ti.UI.createWindow({
	backgroundColor : 'white',
	layout : 'vertical',
	exitOnClose : true
});

var webview = Ti.UI.createWebView({
	url : 'https://www.tvlicensing.co.uk/'
});
win.add(webview);

win.addEventListener("open", subscribeToChannel);

win.open();

function subscribeToChannel() {

	// Require the module
	var CloudPush = require('ti.cloudpush');

	// Require the Cloud module
	var Cloud = require("ti.cloud");

	var deviceToken = null;

	// Process incoming push notifications
	CloudPush.addEventListener('callback', function(evt) {
		alert("Notification received: " + evt.payload);
	});

	// Check if the device is running iOS 8 or later
	if (Ti.Platform.name == "iPhone OS" && parseInt(Ti.Platform.version.split(".")[0]) >= 8) {

		// Wait for user settings to be registered before registering for push notifications
		Ti.App.iOS.addEventListener('usernotificationsettings', function registerForPush() {

			// Remove event listener once registered for push notifications
			Ti.App.iOS.removeEventListener('usernotificationsettings', registerForPush);

			Ti.Network.registerForPushNotifications({
				success : deviceTokenSuccess,
				error : deviceTokenError,
				callback : receivePush
			});
		});

		// Register notification types to use
		Ti.App.iOS.registerUserNotificationSettings({
			types : [Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT, Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND, Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE]
		});
	}

	// For iOS 7 and earlier
	else if (Ti.Platform.name == "iPhone OS" && parseInt(Ti.Platform.version.split(".")[0]) < 8) {
		Ti.Network.registerForPushNotifications({
			// Specifies which notifications to receive
			types : [Ti.Network.NOTIFICATION_TYPE_BADGE, Ti.Network.NOTIFICATION_TYPE_ALERT, Ti.Network.NOTIFICATION_TYPE_SOUND],
			success : deviceTokenSuccess,
			error : deviceTokenError,
			callback : receivePush
		});
	}

	// For Android
	else {

		CloudPush.retrieveDeviceToken({
			success : deviceTokenSuccess,
			error : deviceTokenError
		});
		
	}
}

// Enable push notifications for this device
// Save the device token for subsequent API calls
function deviceTokenSuccess(e) {
	deviceToken = e.deviceToken;

	// Subscribes the device to the 'news_alerts' channel
	// Specify the push type as either 'android' for Android or 'ios' for iOS
	Cloud.PushNotifications.subscribeToken({
		device_token : deviceToken,
		channel : 'news_alerts',
		type : Ti.Platform.name == 'android' ? 'android' : 'ios'
	}, function(e) {
		if (e.success) {
			alert('Subscribed');
		} else {
			alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
		}
	});

}

function deviceTokenError(e) {
	alert('Failed to register for push notifications! ' + e.error);
}

// Process incoming push notifications
function receivePush(e) {
	alert('Received push: ' + JSON.stringify(e));
}