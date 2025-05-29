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
  id: string;
  name: string;
  barcode: string;
  description: string;
  stockQuantity: number;
  minThreshold: number;
}
