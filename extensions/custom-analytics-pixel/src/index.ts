import { register } from "@shopify/web-pixels-extension";

register(({ analytics, browser, settings }) => {
  analytics.subscribe('checkout_completed', async (event) => {

    const hasSubscription = event.data.checkout.lineItems.some(
      (line) => line.sellingPlanAllocation !== null && line.sellingPlanAllocation !== undefined
    );

    const payload = {
      event_name: event.name,
      timestamp: event.timestamp,
      client_id: event.clientId,
      checkout_total: event.data.checkout.totalPrice.amount,
      currency: event.data.checkout.totalPrice.currencyCode,
      order_id: event.data.checkout.order?.id,
      has_subscription: hasSubscription
    };

    // Define Dark-Mode safe CSS
    const titleCSS = "color: #ffffff; background: #008060; font-size: 13px; font-weight: bold; padding: 4px 8px; border-radius: 4px;";
    const descCSS = "color: #9aa0a6; font-size: 12px; font-style: italic;";
    const linkCSS = "color: #8ab4f8; font-size: 12px; text-decoration: underline;";

    // Group everything under the green badge
    console.groupCollapsed("%c🤖 CUSTOM PIXEL PAYLOAD - CLICK ME!", titleCSS);
    console.log("%cThis is the Web Pixel API using Shopify Checkout Extensibility. We can put API Endpoints here to send data for A/B testing, GTM, additional data layers, etc.", descCSS);
    console.log("%chttps://shopify.dev/docs/api/pixels", linkCSS);
    console.log(payload); // The raw object stays fully interactive
    console.groupEnd();
  });
});