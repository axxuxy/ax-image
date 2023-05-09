/**
 * Get a list all group.
 * @param list
 * @returns
 */
export function groupList<T>(list: Array<T>): Array<Array<T>> {
  const groups: Array<Array<T>> = [];
  const awaitGroups = [...list.map((item, index) => [index])];

  while (awaitGroups.length) {
    const group = awaitGroups.splice(0, 1)[0];
    groups.push(group.map((index) => list[index]));
    let last = group[group.length - 1];
    while (++last < list.length) {
      awaitGroups.push([...group, last]);
    }
  }
  return groups;
}

/**
 * Group object
 * @param object A object.
 */
export function groupObject<T extends Object>(object: T): Array<Partial<T>> {
  return groupList(
    (Object.keys(object) as Array<keyof typeof object>).map((key) => ({
      [key]: object[key],
    }))
  ).map((_) => Object.assign({}, ..._));
}
