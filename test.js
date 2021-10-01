const {
    constructUrl,
    hasDuplicates,
    getOptions,
    getTabPosition,
    getLocalStorageKey,
} = require('./background');

describe('constructUrl', () => {
    it('should return a URL without a hash', () => {
        const url =
            'https://developer.chrome.com/docs/extensions/reference/tabs/#method-move';
        const hashlessUrl = constructUrl(url);
        expect(hashlessUrl).toBe(
            'https://developer.chrome.com/docs/extensions/reference/tabs/'
        );
    });
    it('should throw Invalid Url given an empty string', () => {
        const url = '';
        expect(() => {
            constructUrl(url);
        }).toThrowError('Invalid URL: ');
    });
});

describe('hasDuplicates', () => {
    it('should return false', async () => {
        const optionData = {
            options: {
                moveTabs: true,
                effectWindows: false,
                effectTabGroups: false,
                exclusions: [],
            },
        };
        const key = 'options';
        chrome.storage.local.get.mockImplementation((key, callback) => {
            callback(optionData);
        });
        chrome.tabs.query.mockReturnValue([]);
        const duplicateCheck = await hasDuplicates(
            210,
            'https://www.google.com/',
            1,
            -1
        );
        expect(duplicateCheck).toBe(false);
    });
});

describe('getOptions', () => {
    it('should return an object with options values', async () => {
        const opt = {
            moveTabs: true,
            effectWindows: false,
            effectTabGroups: false,
            exclusions: [],
        };
        const optionData = {
            options: {
                moveTabs: true,
                effectWindows: false,
                effectTabGroups: false,
                exclusions: [],
            },
        };
        const key = 'options';
        chrome.storage.local.get.mockImplementation((key, callback) => {
            callback(optionData);
        });
        const options = await getOptions();
        expect(options).toStrictEqual(opt);
    });
});

describe('getLocalStorageKey', () => {
    beforeEach(() => {
        const optionData = {
            options: {
                moveTabs: true,
                effectWindows: false,
                effectTabGroups: false,
                exclusions: [],
            },
        };
        chrome.storage.local.get.mockImplementation((key, callback) => {
            if (key[0] === 'options') {
                callback(optionData);
            } else {
                callback({});
            }
        });
    });
    it('should return an empty object given an empty string', async () => {
        const options = await getLocalStorageKey('');
        expect(options).toStrictEqual({});
    });
    it('should return an empty object given option is key', async () => {
        const options = await getLocalStorageKey('option');
        expect(options).toStrictEqual({});
    });
    it('should return an object of options with options values given options is key', async () => {
        const optionData = {
            options: {
                moveTabs: true,
                effectWindows: false,
                effectTabGroups: false,
                exclusions: [],
            },
        };
        const options = await getLocalStorageKey('options');
        expect(options).toStrictEqual(optionData);
    });
});

describe('getTabPosition', () => {
    it('should return 1', async () => {
        chrome.tabs.get.mockReturnValue({ index: 1 });
        const tabPosition = await getTabPosition(10);
        expect(tabPosition).toBe(1);
    });
});
