const rules = new Intl.PluralRules("en-US");

export function pluralize(count: number, forms: Partial<Record<Intl.LDMLPluralRule, string>>) {
    const rule = rules.select(count);
    return forms[rule] ?? forms.other;
}
