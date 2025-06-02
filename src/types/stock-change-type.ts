export const StockChangeType = {
  IN: "IN",
  OUT: "OUT",
  MANUAL_EDIT: "MANUAL_EDIT",
  AUTO_EDIT: "AUTO_EDIT",
  CREATE: "CREATE",
  DELETE: "DELETE",
} as const;

export type StockChangeType =
  (typeof StockChangeType)[keyof typeof StockChangeType];
