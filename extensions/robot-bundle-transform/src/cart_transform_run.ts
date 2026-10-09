import type {
  RunInput,
  FunctionRunResult,
  CartOperation,
} from "../generated/api";

export function run(input: RunInput): FunctionRunResult {
  const operations: CartOperation[] = [];

  input.cart.lines.forEach((line) => {
    // 1. Ensure merchandise is a ProductVariant
    if (line.merchandise.__typename !== "ProductVariant") return;

    // 2. Extract the bundle components metafield
    const componentsMetafield = line.merchandise.product.bundleComponents;
    if (!componentsMetafield?.value) return;

    // 3. Parse the JSON array of variant GIDs selected by the admin
    const childVariantIds: string[] = JSON.parse(componentsMetafield.value);

    // 4. Extract the discount metafield, default to 20% if left blank
    const discountMetafield = line.merchandise.product.bundleDiscount;
    const discountPercentage = discountMetafield?.value ? parseFloat(discountMetafield.value) : 20;

    // 5. Map the parsed IDs with the correct 'adjustment' wrapper
const expandedCartItems = childVariantIds.map((variantId) => ({
  merchandiseId: variantId,
  quantity: 1
}));

    // 6. Push the expand operation
    operations.push({
      lineExpand: {
        cartLineId: line.id,
        expandedCartItems
      }
    });
  });

  return { operations };
}