import { it, expect } from '@jest/globals';
import {
    constructUrl,
    hasDuplicates,
    getOptions,
    getTabPosition,
} from '../src/background.js';
import { getLocalStorageKey } from '../src/chrome_storage.js';

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
    const defaultMockTab = {
        url: 'https://www.google.com/',
        windowId: 1,
        groupId: -1,
    };
    const defaultMockTabs = [
        defaultMockTab,
        {
            ...defaultMockTab,
        },
    ];
    const makeTabList = (...newTabs) =>
        newTabs.map((tab = {}, id) => ({
            id: id + 1,
            ...defaultMockTab,
            ...tab,
        }));
    const mockDuplicateTabsQuery = (mockTabs = defaultMockTabs) =>
        chrome.tabs.query.mockReturnValue(mockTabs);
    describe('test helper func', () => {
        it('should return a defaulMockTab with id of 1', async () => {
            const tabs = makeTabList(defaultMockTab);
            const [firstTab] = tabs;
            expect(firstTab).toStrictEqual({ id: 1, ...defaultMockTab });
        });
        it('should return and id of 1', async () => {
            const tabs = makeTabList(defaultMockTab);
            const [{ id }] = tabs;
            expect(id).toBe(1);
        });
        it('should return and id of 1 and 2', async () => {
            const tabs = makeTabList(defaultMockTab, defaultMockTab);
            const [{ id: first }, { id: second }] = tabs;
            expect(first).toBe(1);
            expect(second).toBe(2);
        });
    });
    describe('base cases', () => {
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
                callback(optionData);
            });
        });
        it('should return false given it is the only tab open', async () => {
            const tabs = makeTabList(defaultMockTab);
            mockDuplicateTabsQuery(tabs);
            const [firstTab] = tabs;
            const duplicateCheck = await hasDuplicates(firstTab);
            expect(duplicateCheck).toBe(false);
        });
        it('should return true given two identical urls existing', async () => {
            const tabs = makeTabList(defaultMockTab, defaultMockTab);
            mockDuplicateTabsQuery(tabs);
            const [firstTab] = tabs;
            const duplicateCheck = await hasDuplicates(firstTab);
            expect(duplicateCheck).toBe(true);
        });
    });
    describe('exclusions', () => {
        beforeEach(() => {
            const optionData = {
                options: {
                    moveTabs: true,
                    effectWindows: false,
                    effectTabGroups: false,
                    exclusions: ['google', 'youtube'],
                },
            };
            chrome.storage.local.get.mockImplementation((key, callback) => {
                callback(optionData);
            });
        });
        it('should return false given two identical urls, but an exclusion', async () => {
            const tabs = makeTabList(defaultMockTab, defaultMockTab);
            mockDuplicateTabsQuery(tabs);
            const [firstTab] = tabs;
            const duplicateCheck = await hasDuplicates(firstTab);
            expect(duplicateCheck).toBe(false);
        });
        it('should return false given three identical urls, but an exclusion', async () => {
            const tabs = makeTabList(
                defaultMockTab,
                defaultMockTab,
                defaultMockTab
            );
            mockDuplicateTabsQuery(tabs);
            const [firstTab] = tabs;
            const duplicateCheck = await hasDuplicates(firstTab);
            expect(duplicateCheck).toBe(false);
        });
        it('should return false given no identical urls, but an exclusion', async () => {
            const tabs = makeTabList(defaultMockTab, {
                url: 'https://www.youtube.com/',
            });
            mockDuplicateTabsQuery(tabs);
            const [firstTab] = tabs;
            const duplicateCheck = await hasDuplicates(firstTab);
            expect(duplicateCheck).toBe(false);
        });
        it('should return false given two same urls and different windowIds, but an exclusion', async () => {
            const tabs = makeTabList(defaultMockTab, { windowId: 2 });
            mockDuplicateTabsQuery(tabs);
            const [firstTab] = tabs;
            const duplicateCheck = await hasDuplicates(firstTab);
            expect(duplicateCheck).toBe(false);
        });
        it('should return false given four urls, but two exclusions', async () => {
            const tabs = makeTabList(
                defaultMockTab,
                defaultMockTab,
                { url: 'https://www.youtube.com/' },
                { url: 'https://www.youtube.com/' }
            );
            mockDuplicateTabsQuery(tabs);
            const [firstTab] = tabs;
            const duplicateCheck = await hasDuplicates(firstTab);
            expect(duplicateCheck).toBe(false);
        });
    });
    describe('effectWindows is true', () => {
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
        });
        it('should return true given two identical urls but same windowId', async () => {
            const tabs = makeTabList(defaultMockTab, defaultMockTab);
            mockDuplicateTabsQuery(tabs);
            const [firstTab] = tabs;
            const duplicateCheck = await hasDuplicates(firstTab);
            expect(duplicateCheck).toBe(true);
        });
        it('should return true given two identical urls but different windowIds', async () => {
            const tabs = makeTabList(defaultMockTab, { windowId: 2 });
            mockDuplicateTabsQuery(tabs);
            const [firstTab] = tabs;
            const duplicateCheck = await hasDuplicates(firstTab);
            expect(duplicateCheck).toBe(true);
        });
        it('should return false given no identical urls but different windowIds', async () => {
            const tabs = makeTabList(defaultMockTab, {
                windowId: 2,
                url: 'https://www.youtube.com/',
            });
            mockDuplicateTabsQuery(tabs);
            const [firstTab] = tabs;
            const duplicateCheck = await hasDuplicates(firstTab);
            expect(duplicateCheck).toBe(false);
        });
    });
    describe('effectTabGroups is true', () => {
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
                callback(optionData);
            });
        });
        it('should return true given two identical urls but same groupId', async () => {
            const tabs = makeTabList(defaultMockTab, defaultMockTab);
            mockDuplicateTabsQuery(tabs);
            const [firstTab] = tabs;
            const duplicateCheck = await hasDuplicates(firstTab);
            expect(duplicateCheck).toBe(true);
        });
        it('should return false given two identical urls but different groupId', async () => {
            const tabs = makeTabList(defaultMockTab, { groupId: 2 });
            mockDuplicateTabsQuery(tabs);
            const [firstTab] = tabs;
            const duplicateCheck = await hasDuplicates(firstTab);
            expect(duplicateCheck).toBe(false);
        });
    });
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
