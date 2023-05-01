//https://www.youtube.com/feed/subscriptions
let partsTreated = 0;
let shortsCleaned = 0;
let pageManagerObserver;
let subscriptionPageObserver;

class TrackedMutationObserver extends MutationObserver {
    instances = [];

    constructor(...args) {
        super(...args);
    }

    observe(...args) {
        super.observe(...args);
        this.instances.push(this);
    }

    disconnect() {
        super.disconnect();
        this.instances = this.instances.splice(
            this.instances.findIndex((instance) => instance === this),
            1
        );
    }

    getActive() {
        return this.instances.size > 0 ? true : false;
    }
}

function waitUntil(conditionFunction, millisecondsInterval) {
    const retryCountLimit = 10;
    let retryCount = 0;

    return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
            if (conditionFunction) {
                clearInterval(timer);
                resolve();
            }

			
            retryCount++;

            if (retryCount >= retryCountLimit) {
                clearInterval(timer);
                reject(new Error("WaitUntil() retry count exceeded"));
            }
        }, millisecondsInterval);
    });
}

function subscriptionFeedListener() {
    let totalParts = document.getElementsByTagName("ytd-item-section-renderer").length;
    if (totalParts > 0) {
        chrome.storage.sync.get(null, function (options) {
            if (options.enabled) {
                cleanShortsFromFeed(totalParts, partsTreated, true);
            } else {
                cleanShortsFromFeed(totalParts, partsTreated, false);
            }
			chrome.runtime.sendMessage({ message: shortsCleaned });
        });
    } else {
        shortsCleaned = 0;
		chrome.runtime.sendMessage({ message: shortsCleaned });
    }
}

/**
 *
 * @param {number} feedSplitByDays
 * @param {number} feedPartNumber
 * @param {number} shortsDetected
 * @param {boolean} state
 */
function cleanShortsFromFeed(total, treated, state) {
    const shortsDetected = document.querySelectorAll('a#thumbnail[href*="shorts/"]');
    if (state) {
        if (treated < total) {
            shortsDetected.forEach((short) => {
                if (!short.parentElement.parentElement.parentElement.hidden) {
                    short.parentElement.parentElement.parentElement.hidden = true;
                    shortsCleaned = shortsCleaned + 1;
                }
            });
        }
    } else {
        shortsDetected.forEach((short) => {
            if (short.parentElement.parentElement.parentElement.hidden) {
                short.parentElement.parentElement.parentElement.hidden = false;
            }
        });
		shortsCleaned = 0;
		total = 0;
    }
    partsTreated = total;
}

window.addEventListener("load", function () {
    const pageManager = document.querySelector("ytd-page-manager");
    pageManagerObserver = new TrackedMutationObserver(pageManagerListener);
    pageManagerObserver.observe(pageManager, { childList: true });
});

async function pageManagerListener() {
	if (location.origin === "https://www.youtube.com" && location.pathname.startsWith("/feed/subscriptions")) {
        await waitUntil(document.querySelector("ytd-item-section-renderer"), 2000);
		subscriptionFeedListener();
        const subscriptionPage = document.querySelector("div#contents.ytd-section-list-renderer");
        subscriptionPageObserver = new TrackedMutationObserver(subscriptionFeedListener);
        subscriptionPageObserver.observe(subscriptionPage, { childList: true });
    } else {
        if (subscriptionPageObserver && subscriptionPageObserver.getActive()) subscriptionPageObserver.disconnect();
        chrome.runtime.sendMessage({ message: "" });
    }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync" && (changes.enabled.newValue || !changes.enabled.newValue)) {
        subscriptionFeedListener();
    }
});
