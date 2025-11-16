import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

const STORAGE_KEY = "starred-bus-stops";

interface StarredStopsState {
  starredStopIdsArray: number[];
  showOnlyStarred: boolean;
  toggleStar: (stopId: number) => void;
  isStarred: (stopId: number) => boolean;
  setShowOnlyStarred: (showOnlyStarred: boolean) => void;
}

export const useStarredStops = create<StarredStopsState>()(
  devtools(
    persist(
      (set, get) => ({
        starredStopIdsArray: [],
        showOnlyStarred: false,
        toggleStar: (stopId: number) => {
          set((state) => {
            const currentSet = new Set(state.starredStopIdsArray);
            if (currentSet.has(stopId)) {
              currentSet.delete(stopId);
            } else {
              currentSet.add(stopId);
            }
            return { starredStopIdsArray: Array.from(currentSet) };
          });
        },
        isStarred: (stopId: number) => {
          return get().starredStopIdsArray.includes(stopId);
        },
        setShowOnlyStarred: (showOnlyStarred: boolean) => {
          set({ showOnlyStarred });
        },
      }),
      {
        name: STORAGE_KEY,
      },
    ),
    { name: "starredStopsStore" },
  ),
);

