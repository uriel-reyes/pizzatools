// Order type definition
interface Pizza {
  productName: string;
  ingredients: string[];
  quantity: number;
}

interface StateInfo {
  name: string;
  key: string;
}

interface Order {
  id: string;
  createdAt: string;
  lineItems: Pizza[];
  state?: {
    typeId: string;
    id: string;
  };
  stateInfo?: StateInfo;
  orderNumber?: string;
  totalItems?: number;
}

export default Order; 