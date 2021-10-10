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
    it('should return false given it is the only tab open', async () => {
        const optionData = {
            options: {
                moveTabs: true,
                effectWindows: false,
                effectTabGroups: false,
                exclusions: [],
            },
        };
        chrome.storage.local.get.mockImplementation((key, callback) => {
            callback(optionData);
        });
        chrome.tabs.query.mockReturnValue([
            {
                id: 1,
                url: 'https://www.google.com/',
                windowId: 1,
                groupId: -1,
            },
        ]);
        const duplicateCheck = await hasDuplicates(
            1,
            'https://www.google.com/',
            1,
            -1
        );
        expect(duplicateCheck).toBe(false);
    });
    it('should return true given two identical urls existing', async () => {
        const optionData = {
            options: {
                moveTabs: true,
                effectWindows: false,
                effectTabGroups: false,
                exclusions: [],
            },
        };
        chrome.storage.local.get.mockImplementation((key, callback) => {
            callback(optionData);
        });
        chrome.tabs.query.mockReturnValue([
            {
                id: 1,
                url: 'https://www.google.com/',
                windowId: 1,
                groupId: -1,
            },
            {
                id: 2,
                url: 'https://www.google.com/',
                windowId: 1,
                groupId: -1,
            },
        ]);
        const duplicateCheck = await hasDuplicates(
            2,
            'https://www.google.com/',
            1,
            -1
        );
        expect(duplicateCheck).toBe(true);
    });
    describe('exclusions', () => {
        beforeEach(() => {
            const optionData = {
                options: {
                    moveTabs: true,
                    effectWindows: false,
                    effectTabGroups: false,
                    exclusions: ['google'],
                },
            };
            chrome.storage.local.get.mockImplementation((key, callback) => {
                callback(optionData);
            });
        })
        it('should return false given two identical urls, but an exclusion', async () => {
            chrome.tabs.query.mockReturnValue([
                {
                    id: 1,
                    url: 'https://www.google.com/',
                    windowId: 1,
                    groupId: -1,
                },
                {
                    id: 2,
                    url: 'https://www.google.com/',
                    windowId: 1,
                    groupId: -1,
                },
            ]);
            const duplicateCheck = await hasDuplicates(
                2,
                'https://www.google.com/',
                1,
                -1
            );
            expect(duplicateCheck).toBe(false);
        })
        it('should return false given no identical urls, but an exclusion', async () => {
            chrome.tabs.query.mockReturnValue([
                {
                    id: 1,
                    url: 'https://www.youtube.com/',
                    windowId: 1,
                    groupId: -1,
                },
                {
                    id: 2,
                    url: 'https://www.google.com/',
                    windowId: 1,
                    groupId: -1,
                },
            ]);
            const duplicateCheck = await hasDuplicates(
                2,
                'https://www.google.com/',
                1,
                -1
            );
            expect(duplicateCheck).toBe(false);
        })
    })
    describe('windowId is true', () => {
        beforeEach(() => {
            const optionData = {
                options: {
                    moveTabs: true,
                    effectWindows: true,
                    effectTabGroups: false,
                    exclusions: [],
                },
            };
            chrome.storage.local.get.mockImplementation((key, callback) => {
                callback(optionData);
            });
        })
        it('should return true given two identical urls but same windowId', async () => {
            chrome.tabs.query.mockReturnValue([
                {
                    id: 1,
                    url: 'https://www.google.com/',
                    windowId: 1,
                    groupId: -1,
                },
                {
                    id: 2,
                    url: 'https://www.google.com/',
                    windowId: 1,
                    groupId: -1,
                },
            ]);
            const duplicateCheck = await hasDuplicates(
                2,
                'https://www.google.com/',
                1,
                -1
            );
            expect(duplicateCheck).toBe(true);
        })
        it('should return true given two identical urls but different windowIds', async () => {
            chrome.tabs.query.mockReturnValue([
                {
                    id: 1,
                    url: 'https://www.google.com/',
                    windowId: 2,
                    groupId: -1,
                },
                {
                    id: 2,
                    url: 'https://www.google.com/',
                    windowId: 1,
                    groupId: -1,
                },
            ]);
            const duplicateCheck = await hasDuplicates(
                2,
                'https://www.google.com/',
                1,
                -1
            );
            expect(duplicateCheck).toBe(true);
        })
        it('should return false given no identical urls but different windowIds', async () => {
            chrome.tabs.query.mockReturnValue([
                {
                    id: 1,
                    url: 'https://www.google.com/',
                    windowId: 1,
                    groupId: -1,
                },
                {
                    id: 2,
                    url: 'https://www.youtube.com/',
                    windowId: 2,
                    groupId: -1,
                },
            ]);
            const duplicateCheck = await hasDuplicates(
                2,
                'https://www.youtube.com/',
                2,
                -1
            );
            expect(duplicateCheck).toBe(false);
        })
    })
});

describe('getOptions', () => {
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
