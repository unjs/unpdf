export function resolveAliases(_aliases: Record<string, string>) {
  // Sort aliases from specific to general (ie. fs/promises before fs)
  const aliases = Object.fromEntries(
    Object.entries(_aliases).sort(
      ([a], [b]) =>
        b.split("/").length - a.split("/").length || b.length - a.length,
    ),
  );

  // Resolve alias values in relation to each other
  for (const key in aliases) {
    for (const alias in aliases) {
      if (aliases[key].startsWith(alias)) {
        aliases[key] = aliases[alias] + aliases[key].slice(alias.length);
      }
    }
  }

  return aliases;
}
