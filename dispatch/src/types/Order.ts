export interface Address {
  streetName: string;
  streetNumber: string;
  city: string;
  postalCode: string;
  country: string;
  state?: string;
  apartment?: string;
}

export interface MoneyValue {
  centAmount: number;
  currencyCode: string;
}

export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  price: MoneyValue;
  totalPrice: MoneyValue;
  variant: {
    attributes?: Array<{
      name: string;
      value: any;
    }>;
  };
}

export interface TaxedPrice {
  totalNet: MoneyValue;
  totalGross: MoneyValue;
  totalTax: MoneyValue;
}

export interface StateInfo {
  name: string;
  key: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  lastModifiedAt: string;
  totalPrice: MoneyValue;
  taxedPrice?: TaxedPrice;
  shippingAddress: Address;
  billingAddress?: Address;
  lineItems: LineItem[];
  orderState: string;
  shipmentState?: string;
  paymentState?: string;
  stateId?: string;
  state?: any;
  stateInfo?: StateInfo;
} 