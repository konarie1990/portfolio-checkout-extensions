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
  /** @type {[any, any]} */
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
    let ignore = false;

    if (!variantId) {
      console.warn("Free Gift Extension: No gift_variant_id configured in extension settings.");
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

        if (ignore) return;

        /** @type {any} */
        const responseData = data;
        if (errors || !responseData?.node) {
          console.error("Free Gift Extension GraphQL Error:", errors);
          setStatus("error");
          return;
        }

        setProductData(responseData.node);
        setStatus("success");
      } catch (error) {
        if (!ignore) {
          console.error("Free Gift Extension Fetch Exception:", error);
          setStatus("error");
        }
      }
    }

    fetchVariantData();

    return () => {
      ignore = true;
    };
  }, [variantId]);

  if (!variantId || status === "loading" || status === "error" || !productData) {
    return null;
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
    <s-box background="subdued" padding="base" border="base" borderRadius="base">
      <s-stack direction="block" gap="base">
        
        {/* Header Title with Info Icon */}
        <s-stack direction="inline" gap="small-200" alignItems="center">
          <s-icon type="info" tone="info" />
          <s-text type="strong">{customHeading}</s-text>
        </s-stack>

        <s-grid gridTemplateColumns="64px 1fr auto" alignItems="center" gap="base">
          <s-image src={displayImage} alt={displayTitle} aspectRatio="1" borderRadius="base" />

          <s-stack direction="block" gap="base">
            <s-stack direction="block" gap="none">
              <s-text type="emphasis">{displayTitle}</s-text>
              <s-text>{displayDescription}</s-text>
            </s-stack>

            {extraDescriptionText && (
              <s-stack direction="block" gap="base">
                <s-divider />
                <s-text tone="subdued">{extraDescriptionText}</s-text>
              </s-stack>
            )}
          </s-stack>

          <s-button variant="primary" onClick={handleAddGift} loading={adding} disabled={hasGift}>
            {hasGift ? "Added" : "Add"}
          </s-button>
        </s-grid>

      </s-stack>
    </s-box>
  );
}