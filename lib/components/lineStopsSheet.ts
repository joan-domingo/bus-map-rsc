/**
 * Height of the stop sheet's header, which is all that shows when the sheet is
 * docked. The line page shortens the map by exactly this much so the docked
 * sheet covers nothing, so the two have to agree.
 *
 * This lives outside LineStopsSection.tsx because that file is a client
 * component: a server component importing a value from it gets a client
 * reference proxy, not the string, which silently stringifies into invalid CSS.
 */
export const STOPS_SHEET_PEEK = "4.5rem";
