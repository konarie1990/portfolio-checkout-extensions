import '@shopify/ui-extensions/preact';
import { render } from "preact";
import { useState, useEffect } from "preact/hooks";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [lines, setLines] = useState(shopify.lines.value);
  // @ts-ignore
  const [settings, setSettings] = useState(shopify.settings?.value || {});
  const [adding, setAdding] = useState(false);
  const [productData, setProductData] = useState(null);
  const [status, setStatus] = useState("loading");

  const variantId = settings.gift_variant_id || "";

  useEffect(() => {
    const unsubLines = shopify.lines.subscribe(setLines);
    // @ts-ignore
    const unsubSettings = shopify.settings?.subscribe(setSettings) || (() => { });

    return () => {
      unsubLines();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    // 1. Create a flag to track if this specific render is still valid
    let ignore = false;

    if (!variantId) {
      setStatus("error");
      return;
    }

    async function fetchVariantData() {
      try {
        const { data, errors } = await shopify.query(
          `query getVariant($id: ID!) {
            node(id: $id) {
              ... on ProductVariant {
                title
                image {
                  url
                }
                product {
                  title
                  description
                }
              }
            }
          }`,
          { variables: { id: variantId } }
        );

        // 2. If the component unmounted or re-rendered, abort the state update
        if (ignore) return;

        const responseData = data;
        if (errors || !responseData?.node) {
          setStatus("error");
          return;
        }

        setProductData(responseData.node);
        setStatus("success");
      } catch (error) {
        // 3. Only set error state if still mounted
        if (!ignore) {
          setStatus("error");
        }
      }
    }

    fetchVariantData();

    // 4. Cleanup function: runs when component unmounts or before next effect runs
    return () => {
      ignore = true;
    };
  }, [variantId]);

  if (!variantId) {

    return null; // Fails silently, renders nothing
  }

  if (status === "loading") {
    // Returning null prevents a flicker of "Loading..." text before the component is ready
    return null;
  }

  if (status === "error" || !productData) {
    console.error(`Free Gift Extension: Failed to load product data for ID: ${variantId}`);
    return null; // Fails silently, renders nothing
  }

  // @ts-ignore
  const hasGift = lines.some((line) => line.merchandise.id === variantId);

  async function handleAddGift() {
    setAdding(true);
    await shopify.applyCartLinesChange({
      type: "addCartLine",
      merchandiseId: variantId,
      quantity: 1,
    });
    setAdding(false);
  }

  const customHeading = String(settings.custom_heading || "Free Gift Eligible!");
  const extraDescriptionText = settings.extra_description;

  const displayTitle = String(productData?.product?.title || "Free Gift");
  const displayDescription = String(productData?.product?.description || "Add this to your order for free.");
  const displayImage = String(productData?.image?.url || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png");

  return (
    <s-banner heading={customHeading}>

      {/* 
        s-grid replaces InlineLayout in the new web components.
        - "64px" restricts the image container to a thumbnail size.
        - "1fr" allows the text stack to fill the remaining middle space.
        - "auto" shrinks the button container to exactly the width of the button.
      */}
      <s-grid gridTemplateColumns="64px 1fr auto" alignItems="center" gap="base">

        <s-image src={displayImage} alt={displayTitle} aspectRatio="1" borderRadius="base" />

        {/* Outer stack uses gap="base" to act as padding between the upper text and the divider */}
        {/* @ts-ignore */}
        <s-stack direction="column" gap="base">

          {/* Inner stack 1: Keeps the Title and Description tightly packed together */}
          {/* @ts-ignore */}
          <s-stack direction="column" gap="none">
            <s-text type="emphasis">{displayTitle}</s-text>
            <s-text>{displayDescription}</s-text>
          </s-stack>

          {/* Inner stack 2: Conditionally renders the divider and extra text with its own spacing */}
          {extraDescriptionText && (
            /* @ts-ignore */
            <s-stack direction="column" gap="base">
              <s-divider />
              <s-text appearance="subdued">{extraDescriptionText}</s-text>
            </s-stack>
          )}

        </s-stack>

        <s-button variant="primary" onClick={handleAddGift} loading={adding} disabled={hasGift}>
          {hasGift ? "Added" : "Add"}
        </s-button>

      </s-grid>

    </s-banner>
  );
}