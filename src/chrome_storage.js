/**
 * Read from local storage in async instead of using callbacks
 * Pass in a single string key or an array of keys to retrieve multiple values
 *
 * @param {string|array<string>} key
 * @returns {object}
 */
 const getLocalStorageKey = (key) => {
    let storageKey = key;
    if (typeof storageKey !== 'array') storageKey = [storageKey];

    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(storageKey, resolve);
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Set an object in local storage to the given value
 * Local Stoarge objects key is based on the Object key passed in
 * @param {Object} val
 */
const setLocalStorageValue = (val) => chrome.storage.local.set(val);

module.exports = {
    getLocalStorageKey,
    setLocalStorageValue,
}
