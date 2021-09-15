//chrome.storage.local.clear();
chrome.storage.local.get(
    ["moveTabs", "effectWindows", "effectTabGroups", "exclusionArray"],
    ({
        moveTabs = true,
        effectWindows = false,
        effectTabGroups = false,
        exclusionArray = [],
    }) => {
        document.getElementById("moveTabs").checked = moveTabs;
        document.getElementById("effectWindows").checked = effectWindows;
        document.getElementById("effectTabGroups").checked = effectTabGroups;
        createHTMLList(exclusionArray);
        chrome.storage.local.set({
            moveTabs,
            effectWindows,
            effectTabGroups,
            exclusionArray,
        });
    }
);

const submit = document.getElementById("submit");
const exclusionBox = document.getElementById("exclusionArray");

function isPropertyEnabled(id) {
    return document.getElementById(id).checked;
}

function createHTMLList(exclusionArray) {
    const htmlList = exclusionArray.reduce(
        (acc, item) => `${acc}<li>${item}</li>`,
        ""
    );
    document.getElementById("exclusions").innerHTML = htmlList;
    exclusionBox.value = "";
}

function submitChanges() {
    const settingFields = ["moveTabs", "effectWindows", "effectTabGroups"];
    const [moveTabs, effectWindows, effectTabGroups] =
        settingFields.map(isPropertyEnabled);
    chrome.storage.local.set({ moveTabs, effectWindows, effectTabGroups });
}

submit.addEventListener("click", () => {
    submitChanges();
});

exclusionBox.addEventListener("keyup", (event) => {
    if (event.code === "Enter") {
        if (/\s/.test(exclusionBox.value) || !exclusionBox.value) {
            return;
        }
        chrome.storage.local.get(
            { exclusionArray: [] },
            ({ exclusionArray: oldExclusionArray }) => {
                if (oldExclusionArray.includes(exclusionBox.value)) {
                    exclusionBox.value = "";
                    return;
                }
                const exclusionArray = [
                    ...oldExclusionArray,
                    exclusionBox.value,
                ];
                chrome.storage.local.set({ exclusionArray });
                createHTMLList(exclusionArray);
            }
        );
    }
});
