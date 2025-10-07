

document.getElementById("downloadModel").addEventListener("click", () => {

    initializePromptAPI();
});

document.getElementById("loadContent").addEventListener("click", () => {
    document.getElementById("loadContent").disabled = true;
    document.getElementById("sendText").disabled = true;

    generateText()
        .catch((e) => console.log(e.message))
        .then(() => {
            document.getElementById("loadContent").disabled = false;
            document.getElementById("sendText").disabled = false;
        });

});

document.getElementById("sendText").addEventListener("click", () => {
    document.getElementById("loadContent").disabled = true;
    document.getElementById("sendText").disabled = true;
    sendReply().catch((e) => console.log(e.message))
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
        initialPrompt = [
            {
                role: 'system',
                content:
                    'You are to summarize article in third person just like Julius Caesar would do.',
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


    chrome.storage.local.set({ initialPrompts: initialPrompt }, function () {
    });

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

    let initialPrompt = [

        {
            role: 'system',
            content:
                'You are to summarize article in third person just like Julius Caesar would do.',
        },

    ];


    const session = await LanguageModel.create({
        initialPrompts: [
            {
                role: 'system',
                content:
                    'You are to summarize article in third person just like Julius Caesar would do.',
            },
        ],
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
        )
            .then(
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
document.getElementById('openModalBtn').onclick = function () {
    document.getElementById('myModal').style.display = 'block';
};
document.getElementById('closeModalBtn').onclick = function () {
    document.getElementById('myModal').style.display = 'none';
};
window.onclick = function (event) {
    if (event.target == document.getElementById('myModal')) {
        document.getElementById('myModal').style.display = 'none';
    }
};

async function updateEmotions() {
    let emotions = await getStorageVal("emotionn");

    const emotionHTML = document.getElementById('emotionName').value;

    console.log(typeof emotions);

    console.log(emotions);

    if (emotions !== null && typeof emotions === 'object' && Object.keys(emotions).length !== 0) {
        emotions = [...emotions];
    } else {
        emotions = [{ emotion: emotionHTML, debug: 1 }];
    }


    emotions = [{ emotion: emotionHTML, debug: 1 }];
    console.log(emotions);

    chrome.storage.local.set({ emotionn: emotions }, function () {
    });

    // emotions.forEach(element => {
    //     console.log(element.emotions);
    // });

}

// document.getElementById('submitEmotionName').addEventListener("click", () => {
//     updateEmotions();


// });


async function updateInitialPrompt() {
    let initialPrompt = document.getElementById('initialPrompt').value;

    chrome.storage.local.set({ initialPrompt: initialPrompt }, function () {
    });

    document.getElementById("displayInitialPrompt").innerText = initialPrompt;

}


document.getElementById('initialPromptButton').addEventListener("click", () => {
    updateInitialPrompt();
});



async function init() {
    let initialPrompt = await getStorageVal("initialPrompt");
    document.getElementById("displayInitialPrompt").innerText = initialPrompt.initialPrompt;
}

init();