export function toYMD(date: Date, isUTC: boolean = false) {
  return (
    isUTC
      ? [
          date.getUTCFullYear(),
          (date.getUTCMonth() + 1).toString().padStart(2, "0"),
          date.getUTCDate().toString().padStart(2, "0"),
        ]
      : [
          date.getFullYear(),
          (date.getMonth() + 1).toString().padStart(2, "0"),
          date.getDate().toString().padStart(2, "0"),
        ]
  ).join("-");
}

export function toHMS(date: Date, isUTC = false) {
  return (
    isUTC
      ? [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
      : [date.getHours(), date.getMinutes(), date.getSeconds()]
  )
    .map((_) => _.toString().padStart(2, "0"))
    .join(":");
}

export function toYMDHMS(date: Date, isUTC = false) {
  return `${toYMD(date, isUTC)} ${toHMS(date, isUTC)}`;
}
