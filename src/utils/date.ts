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
