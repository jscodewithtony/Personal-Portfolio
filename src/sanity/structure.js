import { singletonTypes } from "./schemaTypes";

// Custom desk structure: the two singletons (navigation,
// homepageContent) get pinned, title-only entries with no "create new"
// affordance and no delete action, since exactly one of each must
// always exist. Every other type lists normally underneath.
export const structure = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Navigation")
        .id("navigation")
        .child(
          S.document().schemaType("navigation").documentId("navigation")
        ),
      S.listItem()
        .title("Homepage Content")
        .id("homepageContent")
        .child(
          S.document()
            .schemaType("homepageContent")
            .documentId("homepageContent")
        ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => !singletonTypes.has(item.getId())
      ),
    ]);

// Hides the default "+" new-document action for singleton types in
// every other menu (search, the global new-document button) so an
// editor can't accidentally create a second navigation/homepageContent
// document.
export function isSingletonType(type) {
  return singletonTypes.has(type);
}
