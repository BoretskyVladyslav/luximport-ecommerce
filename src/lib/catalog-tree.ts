export type CatalogCategory = {
  _id: string;
  title: string;
  slug?: string;
  sortOrder?: number;
  _createdAt: string;
  parent?: { _id: string };
};

export type TreeChild = CatalogCategory;

export type CatalogTaxonomyHit = {
  _id: string;
  parent?: { _id: string } | null;
};

export function normalizeCatalogId(id: string): string {
  return id.replace(/^drafts\./, "");
}

export function compareSortOrder(
  a: { sortOrder?: number; _createdAt: string },
  b: { sortOrder?: number; _createdAt: string },
) {
  const ao = a.sortOrder ?? 99;
  const bo = b.sortOrder ?? 99;
  if (ao !== bo) return ao - bo;
  return b._createdAt.localeCompare(a._createdAt);
}

function allNodes(
  categories: CatalogCategory[],
  subcategories: CatalogCategory[],
): CatalogCategory[] {
  return [...categories, ...subcategories];
}

function childrenByParent(
  categories: CatalogCategory[],
  subcategories: CatalogCategory[],
): Map<string, CatalogCategory[]> {
  const map = new Map<string, CatalogCategory[]>();
  for (const node of allNodes(categories, subcategories)) {
    const parentId = node.parent?._id
      ? normalizeCatalogId(node.parent._id)
      : null;
    if (!parentId) continue;
    const list = map.get(parentId) ?? [];
    list.push(node);
    map.set(parentId, list);
  }
  for (const list of Array.from(map.values())) {
    list.sort(compareSortOrder);
  }
  return map;
}

export function childrenOf(
  parentId: string,
  categories: CatalogCategory[],
  subcategories: CatalogCategory[],
): CatalogCategory[] {
  return (
    childrenByParent(categories, subcategories).get(
      normalizeCatalogId(parentId),
    ) ?? []
  );
}

export function listRootCategories(
  categories: CatalogCategory[],
  subcategories: CatalogCategory[],
): CatalogCategory[] {
  const indexed = new Set(categories.map((c) => normalizeCatalogId(c._id)));
  const roots = categories.filter((c) => !c.parent?._id);
  const orphanSubs = subcategories.filter((s) => {
    const pid = s.parent?._id ? normalizeCatalogId(s.parent._id) : null;
    return !pid || !indexed.has(pid);
  });
  return [...roots, ...orphanSubs].sort(compareSortOrder);
}

export function collectDescendantIds(
  rootId: string,
  categories: CatalogCategory[],
  subcategories: CatalogCategory[],
): string[] {
  const ids = new Set<string>([normalizeCatalogId(rootId)]);
  const byParent = childrenByParent(categories, subcategories);
  const stack = [normalizeCatalogId(rootId)];
  while (stack.length) {
    const id = stack.pop();
    if (!id) continue;
    for (const child of byParent.get(id) ?? []) {
      const childId = normalizeCatalogId(child._id);
      if (ids.has(childId)) continue;
      ids.add(childId);
      stack.push(childId);
    }
  }
  return Array.from(ids);
}

export function collectAncestorIds(
  nodeId: string,
  categories: CatalogCategory[],
  subcategories: CatalogCategory[],
): string[] {
  const byId = new Map(
    allNodes(categories, subcategories).map((n) => [
      normalizeCatalogId(n._id),
      n,
    ]),
  );
  const out: string[] = [];
  const seen = new Set<string>();
  let current = byId.get(normalizeCatalogId(nodeId));
  while (current?.parent?._id) {
    const pid = normalizeCatalogId(current.parent._id);
    if (seen.has(pid)) break;
    seen.add(pid);
    out.push(pid);
    current = byId.get(pid);
  }
  return out;
}

export function findCatalogNodeBySlug(
  slug: string,
  categories: CatalogCategory[],
  subcategories: CatalogCategory[],
): CatalogCategory | undefined {
  const value = slug.trim();
  if (!value) return undefined;
  const nodes = allNodes(categories, subcategories);
  return (
    nodes.find((c) => c.slug === value) ??
    nodes.find((c) => normalizeCatalogId(c._id) === normalizeCatalogId(value))
  );
}

export function productMatchesCategoryIds(
  categoryRefs: Array<CatalogTaxonomyHit | null> | null | undefined,
  idSet: Set<string>,
): boolean {
  if (!categoryRefs?.length || idSet.size === 0) return false;
  return categoryRefs.some((c) => {
    if (!c?._id) return false;
    if (idSet.has(normalizeCatalogId(c._id))) return true;
    if (c.parent?._id && idSet.has(normalizeCatalogId(c.parent._id))) {
      return true;
    }
    return false;
  });
}

export function listDescendantsPreorder(
  parentId: string,
  categories: CatalogCategory[],
  subcategories: CatalogCategory[],
  depth: number,
): { node: TreeChild; depth: number }[] {
  const out: { node: TreeChild; depth: number }[] = [];
  for (const node of childrenOf(parentId, categories, subcategories)) {
    out.push({ node, depth });
    out.push(
      ...listDescendantsPreorder(
        node._id,
        categories,
        subcategories,
        depth + 1,
      ),
    );
  }
  return out;
}
