import { cacheTag, updateTag } from "next/cache";

// Cached queries ("use cache: remote") are tagged by org and by the kind of
// data they read. Server actions expire the kinds they change, so a page only
// refetches after its data was updated (or after the default 15-minute
// revalidation, which covers changes made outside server actions).
//
// - orders:  orders, items, splits, replacements, windows (incl. winner/paid)
// - menu:    menu items, categories, shops (prices feed every spend number)
// - members: users and memberships (names, roles, split-summary access)
export type OrgDataKind = "orders" | "menu" | "members";

function orgTag(organizationId: string, kind: OrgDataKind) {
  return `org:${organizationId}:${kind}`;
}

/** Call inside a "use cache" function. */
export function tagOrgData(organizationId: string, ...kinds: OrgDataKind[]) {
  cacheTag(...kinds.map((kind) => orgTag(organizationId, kind)));
}

/** Call from a server action after a write; the next read refetches. */
export function expireOrgData(organizationId: string, ...kinds: OrgDataKind[]) {
  kinds.forEach((kind) => updateTag(orgTag(organizationId, kind)));
}
