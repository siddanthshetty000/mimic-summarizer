

document.getElementById("downloadModel").addEventListener("click", () => {

    initializePromptAPI().catch((e) => {
        console.log(e.message);
        document.getElementById('LocalModelStatus').style.backgroundColor = "red";
    });
});

document.getElementById("loadContent").addEventListener("click", () => {
    document.getElementById("loadContent").disabled = true;
    document.getElementById("sendText").disabled = true;
    document.getElementById("userText").innerHTML = "";

    generateText()
        .catch((e) => {
            console.log(e.message);
            document.getElementById("loadContent").disabled = false;
            document.getElementById("sendText").disabled = false;
        })
        .then(() => {
            document.getElementById("loadContent").disabled = false;
            document.getElementById("sendText").disabled = false;
        });

});

document.getElementById("sendText").addEventListener("click", () => {
    document.getElementById("loadContent").disabled = true;
    document.getElementById("sendText").disabled = true;
    sendReply().catch((e) => {
        console.log(e.message);
        document.getElementById("loadContent").disabled = false;
        document.getElementById("sendText").disabled = false;
    })
        .then(() => {
            document.getElementById("loadContent").disabled = false;
            document.getElementById("sendText").disabled = false;
        });

});

async function getStorageVal(name) {
    return await chrome.storage.local.get([name]);
}


async function sendReply() {
    let initialPrompt = [];
    let tmpVal = await getStorageVal('initialPrompts');

    tmpVal = tmpVal.initialPrompts;

    const contentVal = document.getElementById("content").innerHTML;

    if (tmpVal) {
        initialPrompt = [...tmpVal];
    } else {

        let initialText = await getStorageVal('initialPrompt');

        initialPrompt = [
            {
                role: 'system',
                content: initialText.initialPrompt,
            },

        ];
    }

    const session = await LanguageModel.create({
        initialPrompts: initialPrompt
    });

    const userText = document.getElementById('userText').value;

    let addedContent = "";
    const result = await session.promptStreaming(
        userText
    );

    for await (const chunk of result) {
        addedContent += chunk;

        document.getElementById("content").innerHTML = addedContent || "No content found.";
    }

    initialPrompt = [...initialPrompt, {
        role: 'user',
        content: userText
    }, {
        role: 'assistant',
        content: addedContent
    }];


    chrome.storage.local.set({ initialPrompts: initialPrompt });

    return result;
}


async function generateText() {

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, { action: "getPageContent" }, response => {
            if (chrome.runtime.lastError) {
                document.getElementById("content").textContent =
                    "Error: " + chrome.runtime.lastError.message;
            } else {
                contentData = response?.text
            }
        });
    });


    let initialText = await getStorageVal('initialPrompt');

    let initialPrompt = [
        {
            role: 'system',
            content: initialText.initialPrompt,
        },
    ];

    const session = await LanguageModel.create({
        initialPrompts: initialPrompt
    });

    let addedContent = "";

    const result = session.promptStreaming(
        contentData
    );

    for await (const chunk of result) {
        addedContent += chunk;
        document.getElementById("content").innerHTML = addedContent || "No content found.";
    }

    initialPrompt = [...initialPrompt, {
        role: 'user',
        content: contentData
    }, {
        role: 'assistant',
        content: addedContent
    }];

    chrome.storage.local.set({ initialPrompts: initialPrompt }, function () {
    });

    return result;
}

async function initializePromptAPI() {


    if (navigator.userActivation.isActive) {

        let availability = await LanguageModel.availability();

        if (availability === "available") {
            document.getElementById('LocalModelStatus').style.backgroundColor = "green";
            return;
        } else {
            document.getElementById('LocalModelStatus').style.backgroundColor = "orange";
        }

        session = await LanguageModel.create({
            "output_language": "en",
            monitor(m) {
                m.addEventListener("downloadprogress", e => {
                    console.log(`Downloaded ${e.loaded * 100}%`);
                });
            }
        }).catch(
            document.getElementById('LocalModelStatus').style.backgroundColor = "red"
        ).then(
            document.getElementById('LocalModelStatus').style.backgroundColor = "green"
        );
    }
}



document.querySelector('.dropbtn').addEventListener('click', function () {
    document.querySelector('.dropdown').classList.toggle('show');
});

window.onclick = function (event) {
    if (!event.target.matches('.dropbtn')) {
        document.querySelector('.dropdown').classList.remove('show');
    }
};

// Simple modal open/close handler
document.getElementById('openInitialPromptBtn').onclick = function () {
    document.getElementById('initialPromptModal').style.display = 'block';
};
document.getElementById('closeInitailPromptModalBtn').onclick = function () {
    document.getElementById('initialPromptModal').style.display = 'none';
};
window.onclick = function (event) {
    if (event.target == document.getElementById('initialPromptModal')) {
        document.getElementById('initialPromptModal').style.display = 'none';
    }
};

// Simple modal API handler
// document.getElementById('openAPIBtn').onclick = function () {
//     document.getElementById('externalAPIModal').style.display = 'block';
// };
// document.getElementById('closeExternalAPIModalBtn').onclick = function () {
//     document.getElementById('externalAPIModal').style.display = 'none';
// };
// window.onclick = function (event) {
//     if (event.target == document.getElementById('externalAPIModal')) {
//         document.getElementById('externalAPIModal').style.display = 'none';
//     }
// };

document.getElementById('clearContext').addEventListener('click', () => {
    chrome.storage.local.remove("initialPrompts");
    document.getElementById('content').innerText = "";
});


async function updateInitialPrompt() {
    let initialPrompt = document.getElementById('initialPrompt').value;

    chrome.storage.local.set({ initialPrompt: initialPrompt });

    document.getElementById("displayInitialPrompt").innerText = initialPrompt;

}

async function updateApiPrompt() {
    let webUrl = document.getElementById('webUrl').value;
    let apiKey = document.getElementById('apiKey').value;
    chrome.storage.local.set({ webUrl: webUrl });
    chrome.storage.local.set({ apiKey: apiKey });

    document.getElementById("displayWebUrl").innerText = webUrl;
    document.getElementById("displayApiKey").innerText = apiKey;
}

const useApiCheckbox = document.getElementById('useApi');

useApiCheckbox.addEventListener('change', function () {
    const isChecked = this.checked;

    chrome.storage.local.set({ useWebApi: isChecked });

});



document.getElementById('initialPromptButton').addEventListener("click", () => {
    updateInitialPrompt();
});

document.getElementById('updateApiButton').addEventListener("click", () => {
    updateApiPrompt();
});

async function init() {
    try {
        let initialPrompt = await getStorageVal("initialPrompt");
        let webUrl = await getStorageVal("webUrl");
        let apiKey = await getStorageVal("apiKey");
        let setLastText = await getStorageVal("initialPrompts");
        let useWebApi = await getStorageVal("useWebApi");

        if (initialPrompt && 'initialPrompt' in initialPrompt) {
            document.getElementById("displayInitialPrompt").innerText = initialPrompt.initialPrompt;
        } else {
            document.getElementById("displayInitialPrompt").innerText = '';
        }
        if (webUrl && 'webUrl' in webUrl) {
            document.getElementById("displayWebUrl").innerText = webUrl.webUrl;
        } else {
            document.getElementById("displayWebUrl").innerText = '';
        }
        if (apiKey && 'apiKey' in apiKey) {
            document.getElementById("displayApiKey").innerText = apiKey.apiKey;
        } else {
            document.getElementById("displayApiKey").innerText = '';
        }
        if (setLastText && setLastText.initialPrompts) {
            document.getElementById("content").innerText = setLastText.initialPrompts.slice(-1)[0].content;
        } else {
            document.getElementById("content").innerText = '';
        }
        document.getElementById("useApi").checked = useWebApi.useWebApi;
    } catch (e) {
        document.getElementById("content").innerText = e.message;
    }
}

init();