/**
 * Upsert into options local storage namespace
 * Local Stoarge objects key is based on the Object key passed in
 * @param {Object} val
 */
export const updateOptions = async (updatedValues) => {
    const { options } = await getLocalStorageKey('options');
    const updatedOptions = {
        ...options,
        ...updatedValues,
    };
    setLocalStorageValue({ options: updatedOptions });
};

/**
 * Read from local storage in async instead of using callbacks
 * Pass in a single string key or an array of keys to retrieve multiple values
 *
 * @param {string|array<string>} key
 * @returns {object}
 */
export const getLocalStorageKey = (key) => {
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
export const setLocalStorageValue = (val) => chrome.storage.local.set(val);
