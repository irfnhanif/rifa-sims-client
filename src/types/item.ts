export interface Item {
  id: string;
  name: string;
  barcode: string;
  description: string;
}

export interface ItemStock {
  id: string;
  item: Item;
  stockQuantity: number;
  minThreshold: number;
}

export interface CreateItemRequest {
  name: string;
  barcode: string;
  description: string;
  currentStock: number;
  threshold: number;
}
