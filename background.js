chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === "install") {
		chrome.storage.sync.set({ "enabled": true });
	}
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message && !isNaN(request.message)) { 
		chrome.action.setBadgeText({ text: request.message.toString() });
	}
});

chrome.management.onEnabled.addListener((extensionInfo) => {
	if (extensionInfo.id == chrome.runtime.id) {
		enableExtension();
	}
});

chrome.management.onDisabled.addListener((extensionInfo) => {
	if (extensionInfo.id == chrome.runtime.id) {
		disableExtension();
	}
});

chrome.action.onClicked.addListener((tab) => {
	chrome.storage.sync.get(null, function (options) {
		if (options.enabled) {
			disableExtension();
		}
		else if (!options.enabled) {
			enableExtension();
		}
	});
});

function disableExtension() {
	chrome.storage.sync.set({ enabled: false }, () => {
		chrome.action.setIcon({
			path: {
				"16": "off16.png",
				"32": "off32.png",
				"48": "off48.png",
				"128": "off128.png"
			}
		});
		chrome.action.setBadgeText({ text: "" });
		chrome.action.setTitle({ title: chrome.i18n.getMessage('show')});
	});
}

function enableExtension() {
	chrome.storage.sync.set({ enabled: true }, () => {
		chrome.action.setIcon({
			path: {
				"16": "on16.png",
				"32": "on32.png",
				"48": "on48.png",
				"128": "on128.png"
			}
		});
		chrome.action.setBadgeText({ text: "" });
		chrome.action.setTitle({ title: chrome.i18n.getMessage('hide')});
	});

}