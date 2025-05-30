export interface Item {
  id: string;
  name: string;
  barcode: string;
  description: string;
}



export interface CreateItemRequest {
  name: string;
  barcode: string;
  description: string;
  currentStock: number;
  threshold: number;
}
