

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPageContent") {
        // Collect only visible text from <body>
        const bodyText = document.body.innerText || "";

        sendResponse({ text: bodyText });
    }
    // Return true to make sendResponse asynchronous (if needed)
});
