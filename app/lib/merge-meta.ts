import type { MetaFunction } from "react-router";

type TitleFunction = (args: { parentTitle: string }) => ReturnType<MetaFunction>;

type MergeMetaOptions = {
    filterTitleFromParent: boolean;
};

export function mergeMeta(
    fn: TitleFunction,
    options: MergeMetaOptions = { filterTitleFromParent: true },
): MetaFunction {
    return ({ matches }) => {
        const parentMeta = matches.flatMap(match => match.meta ?? []);
        const merge = options.filterTitleFromParent
            ? parentMeta.filter(meta => !("title" in meta))
            : parentMeta;
        return [
            ...merge,
            ...fn({ parentTitle: (parentMeta.find(m => "title" in m) as any).title }),
        ];
    };
}
