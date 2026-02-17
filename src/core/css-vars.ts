export type CSSVarEntry = {
  name: string;
  value: string;
  isColor: boolean;
};

const isColorValue = (value: string): boolean => {
  if (/^(#|rgb|hsl|oklch|oklab|lch|lab|color\(|hwb)/.test(value)) return true;
  const el = document.createElement('span');
  el.style.color = value;
  return el.style.color !== '';
};

export const harvestCSSVars = (el: Element): CSSVarEntry[] => {
  const seen = new Set<string>();
  const entries: CSSVarEntry[] = [];
  const computed = getComputedStyle(el);

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }

    const walk = (ruleList: CSSRuleList) => {
      for (const rule of Array.from(ruleList)) {
        if (rule instanceof CSSStyleRule) {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (prop.startsWith('--') && !seen.has(prop)) {
              seen.add(prop);
              const resolved = computed.getPropertyValue(prop).trim();
              if (resolved) {
                entries.push({
                  name: prop,
                  value: resolved,
                  isColor: isColorValue(resolved),
                });
              }
            }
          }
        } else if ('cssRules' in rule) {
          walk((rule as CSSGroupingRule).cssRules);
        }
      }
    };

    walk(rules);
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
};
