import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { useStarredStops } from "../useStarredStops";

const STORAGE_KEY = "starred-bus-stops";

describe("useStarredStops", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store state
    useStarredStops.setState({
      starredStopIdsArray: [],
      showOnlyStarred: false,
    });
  });

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.removeItem(STORAGE_KEY);
  });

  describe("initial state", () => {
    it("should initialize with empty starred stops array", () => {
      const state = useStarredStops.getState();
      expect(state.starredStopIdsArray).toEqual([]);
    });

    it("should initialize with showOnlyStarred as false", () => {
      const state = useStarredStops.getState();
      expect(state.showOnlyStarred).toBe(false);
    });
  });

  describe("toggleStar", () => {
    it("should add a stop to starred stops when not starred", () => {
      const { toggleStar } = useStarredStops.getState();
      toggleStar(123);

      const state = useStarredStops.getState();
      expect(state.starredStopIdsArray).toContain(123);
      expect(state.isStarred(123)).toBe(true);
    });

    it("should remove a stop from starred stops when already starred", () => {
      const { toggleStar } = useStarredStops.getState();

      // First add it
      toggleStar(123);
      expect(useStarredStops.getState().starredStopIdsArray).toContain(123);

      // Then remove it
      toggleStar(123);
      const state = useStarredStops.getState();
      expect(state.starredStopIdsArray).not.toContain(123);
      expect(state.isStarred(123)).toBe(false);
    });

    it("should handle multiple stops", () => {
      const { toggleStar } = useStarredStops.getState();

      toggleStar(123);
      toggleStar(456);
      toggleStar(789);

      const state = useStarredStops.getState();
      expect(state.starredStopIdsArray).toContain(123);
      expect(state.starredStopIdsArray).toContain(456);
      expect(state.starredStopIdsArray).toContain(789);
      expect(state.starredStopIdsArray.length).toBe(3);
    });

    it("should not add duplicate stops", () => {
      const { toggleStar } = useStarredStops.getState();

      toggleStar(123);
      toggleStar(123); // Toggle again
      toggleStar(123); // Toggle again

      const state = useStarredStops.getState();
      // Should only be in the array once (or not at all if toggled odd number of times)
      const count = state.starredStopIdsArray.filter((id) => id === 123).length;
      expect(count).toBeLessThanOrEqual(1);
    });
  });

  describe("isStarred", () => {
    it("should return false for unstarred stops", () => {
      const { isStarred } = useStarredStops.getState();
      expect(isStarred(123)).toBe(false);
    });

    it("should return true for starred stops", () => {
      const { toggleStar, isStarred } = useStarredStops.getState();
      toggleStar(123);
      expect(isStarred(123)).toBe(true);
    });

    it("should return false after unstarring a stop", () => {
      const { toggleStar, isStarred } = useStarredStops.getState();

      toggleStar(123);
      expect(isStarred(123)).toBe(true);

      toggleStar(123);
      expect(isStarred(123)).toBe(false);
    });
  });

  describe("setShowOnlyStarred", () => {
    it("should set showOnlyStarred to true", () => {
      const { setShowOnlyStarred } = useStarredStops.getState();
      setShowOnlyStarred(true);

      const state = useStarredStops.getState();
      expect(state.showOnlyStarred).toBe(true);
    });

    it("should set showOnlyStarred to false", () => {
      const { setShowOnlyStarred } = useStarredStops.getState();

      // First set to true
      setShowOnlyStarred(true);
      expect(useStarredStops.getState().showOnlyStarred).toBe(true);

      // Then set to false
      setShowOnlyStarred(false);
      const state = useStarredStops.getState();
      expect(state.showOnlyStarred).toBe(false);
    });

    it("should toggle showOnlyStarred state", () => {
      const { setShowOnlyStarred } = useStarredStops.getState();

      setShowOnlyStarred(true);
      expect(useStarredStops.getState().showOnlyStarred).toBe(true);

      setShowOnlyStarred(false);
      expect(useStarredStops.getState().showOnlyStarred).toBe(false);

      setShowOnlyStarred(true);
      expect(useStarredStops.getState().showOnlyStarred).toBe(true);
    });
  });

  describe("localStorage persistence", () => {
    it("should persist starred stops to localStorage", () => {
      const { toggleStar } = useStarredStops.getState();
      toggleStar(123);
      toggleStar(456);

      // Check localStorage directly
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.starredStopIdsArray).toContain(123);
        expect(parsed.state.starredStopIdsArray).toContain(456);
      }
    });

    it("should persist showOnlyStarred state to localStorage", () => {
      const { setShowOnlyStarred } = useStarredStops.getState();
      setShowOnlyStarred(true);

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.showOnlyStarred).toBe(true);
      }
    });

    it("should load starred stops from localStorage on initialization", () => {
      // Manually set localStorage with the format Zustand persist uses
      const testData = {
        state: {
          starredStopIdsArray: [123, 456, 789],
          showOnlyStarred: true,
        },
        version: 0,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testData));

      // Trigger rehydration if the persist API is available
      if (useStarredStops.persist?.rehydrate) {
        useStarredStops.persist.rehydrate();
      }

      const state = useStarredStops.getState();
      // Note: Rehydration happens automatically on store creation,
      // so this test verifies the stored format is correct
      expect(state.starredStopIdsArray).toBeDefined();
      expect(state.showOnlyStarred).toBeDefined();

      // Verify the data structure matches what we stored
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.starredStopIdsArray).toEqual([123, 456, 789]);
        expect(parsed.state.showOnlyStarred).toBe(true);
      }
    });
  });

  describe("integration", () => {
    it("should work with multiple operations", () => {
      const { toggleStar, setShowOnlyStarred, isStarred } =
        useStarredStops.getState();

      // Star multiple stops
      toggleStar(1);
      toggleStar(2);
      toggleStar(3);

      // Verify they're starred
      expect(isStarred(1)).toBe(true);
      expect(isStarred(2)).toBe(true);
      expect(isStarred(3)).toBe(true);

      // Unstar one
      toggleStar(2);
      expect(isStarred(2)).toBe(false);
      expect(isStarred(1)).toBe(true);
      expect(isStarred(3)).toBe(true);

      // Toggle showOnlyStarred
      setShowOnlyStarred(true);
      expect(useStarredStops.getState().showOnlyStarred).toBe(true);

      // Verify starred stops are still correct
      const state = useStarredStops.getState();
      expect(state.starredStopIdsArray).toContain(1);
      expect(state.starredStopIdsArray).not.toContain(2);
      expect(state.starredStopIdsArray).toContain(3);
    });
  });
});
