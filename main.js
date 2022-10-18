const listenSubscriptionFeed = () => {
	if (location.origin === "https://www.youtube.com" && location.pathname === "/feed/subscriptions") {
		const subscriptionFeed = document.querySelector('div#contents');
		if (subscriptionFeed) {
			cleanShortsFromFeed();
			const config = { childList: true };
			const observer = new MutationObserver(cleanShortsFromFeed);
			observer.observe(subscriptionFeed, config);
		}
	}
};

const cleanShortsFromFeed = () => {
	chrome.storage.sync.get(null, function (options) {
		if (options.enabled) {
			chrome.runtime.sendMessage({ message: 0 });
			document.querySelectorAll('a#thumbnail[href*="shorts/"]').forEach((short, index) => {
				short.parentElement.parentElement.parentElement.hidden = true;
				chrome.runtime.sendMessage({ message: index + 1 });
			});
		}
		else if (!options.enabled) {
			document.querySelectorAll('a#thumbnail[href*="shorts/"]').forEach((short, index) => {
				short.parentElement.parentElement.parentElement.hidden = false;
				chrome.runtime.sendMessage({ message: 0 });
			});
		}
	});
};

window.addEventListener("load", function () {
	const targetNode = document.querySelector('body');
	const config = { childList: true, subtree: true };
	const observer = new MutationObserver(listenSubscriptionFeed);
	observer.observe(targetNode, config);
});


chrome.storage.onChanged.addListener((changes, namespace) => {
	if (namespace === "sync" && (changes.enabled.newValue || !changes.enabled.newValue)) {
		cleanShortsFromFeed();
	}
});