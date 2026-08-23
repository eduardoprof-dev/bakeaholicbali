(function initBakeaholicMetaPixel(window, document) {
  "use strict";
  const pixelId = "1091370950045158";
  if (!window.fbq) {
    const fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  window.fbq("init", pixelId);

  function createEventId(name) {
    const random = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${name.toLowerCase()}_${random}`;
  }

  function sendServerEvent(name, parameters, eventId) {
    const sourceUrl = `${window.location.origin}${window.location.pathname}`;
    window.fetch("/api/meta/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: name, eventId, sourceUrl, customData: parameters }),
      keepalive: true
    }).catch(() => {});
  }

  function sendFunnelEvent(event) {
    window.fetch("/api/funnel/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true
    }).catch(() => {});
  }

  window.BakeaholicAnalytics = {
    track(name, parameters = {}, eventId = "") {
      const resolvedEventId = eventId || createEventId(name);
      window.fbq("track", name, parameters, { eventID: resolvedEventId });
      sendServerEvent(name, parameters, resolvedEventId);
      return resolvedEventId;
    },
    funnel(event) {
      sendFunnelEvent(event);
    },
    purchase(order) {
      if (!order?.id || !order?.pricing) return;
      const storageKey = `meta-purchase:${order.id}`;
      try {
        if (window.sessionStorage.getItem(storageKey)) return;
        window.sessionStorage.setItem(storageKey, "1");
      } catch (_error) {}
      this.track("Purchase", {
        currency: "IDR",
        value: Number(order.pricing.total || 0),
        content_ids: (order.items || []).map((item) => item.itemId || item.id).filter(Boolean),
        content_type: "product",
        num_items: Number(order.itemCount || 0)
      }, `purchase_${order.id}`);
    }
  };
  window.BakeaholicAnalytics.funnel("page_view");
  window.BakeaholicAnalytics.track("PageView");
})(window, document);
