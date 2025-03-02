import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const ADMIN_API_ACCESS_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN!;
const API_VERSION = "2025-01";

interface InventoryLevelNode {
  id: string;
  location: {
    id: string;
    name: string;
  };
  quantities: Array<{
    name: string;
    quantity: number;
  }>;
  item: {
    id: string;
    sku: string;
  };
}

interface InventoryItemNode {
  id: string;
  tracked: boolean;
  inventoryLevels: {
    edges: Array<{
      node: InventoryLevelNode;
    }>;
  };
}

interface VariantNode {
  id: string;
  title: string;
  sku: string;
  price: string;
  compareAtPrice?: string;
  inventoryQuantity: number;
  taxCode?: string;
  inventoryItem: InventoryItemNode;
}

interface ProductNode {
  id: string;
  title: string;
  descriptionHtml: string;
  handle: string;
  createdAt: string;
  updatedAt: string;
  vendor: string;
  productType: string;
  tags: string[];
  status: string;
  totalInventory: number;
  publishedAt: string;
  images: {
    edges: Array<{
      node: {
        id: string;
        url: string;
        altText?: string;
      };
    }>;
  };
  options: {
    id: string;
    name: string;
    values: string[];
  }[];
  variants: {
    edges: Array<{
      node: VariantNode;
    }>;
  };
}

async function fetchAllProducts() {
  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

  const query = `
  {
    products(first: 25) {
      edges {
        node {
          id
          title
          descriptionHtml
          handle
          createdAt
          updatedAt
          vendor
          productType
          tags
          status
          totalInventory
          publishedAt
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
          options {
            id
            name
            values
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                sku
                price
                compareAtPrice
                inventoryQuantity
                taxCode
                inventoryItem {
                  id
                  tracked
                  inventoryLevels(first: 10) {
                    edges {
                      node {
                        id
                        quantities(names: [
                          "available", 
                          "incoming", 
                          "committed",
                          "damaged",
                          "on_hand",
                          "quality_control",
                          "reserved",
                          "safety_stock"
                        ]) {
                          name
                          quantity
                        }
                        item {
                          id
                          sku
                        }
                        location {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`;

  try {
    const response = await axios.post<{ data: { products: { edges: Array<{ node: ProductNode }> } } }>(
      endpoint,
      { query },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": ADMIN_API_ACCESS_TOKEN,
        },
      }
    );

    return response.data.data.products.edges.map(edge => edge.node);
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

fetchAllProducts()
  .then(products => {
    console.log('Fetched products length:', products.length);
    console.log(JSON.stringify(products[0], null, 2));
  })
  .catch(err => console.error('Failed to fetch products:', err));
