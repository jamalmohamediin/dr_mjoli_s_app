const DEFAULT_PATIENT_STICKER_WEBHOOK_TARGET =
  "https://n8n.naiminvestments.com/webhook/41f8b413-1859-4f43-ae33-228ecad27268";

const getHeaderValue = (headers, name) => {
  if (!headers) {
    return "";
  }

  const lowerName = String(name || "").toLowerCase();
  const matchedKey = Object.keys(headers).find(
    (key) => String(key || "").toLowerCase() === lowerName,
  );

  return matchedKey ? String(headers[matchedKey] || "") : "";
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type, accept",
      },
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
    };
  }

  const target =
    process.env.PATIENT_STICKER_WEBHOOK_PROXY_TARGET ||
    process.env.VITE_N8N_PATIENT_STICKER_WEBHOOK_URL ||
    DEFAULT_PATIENT_STICKER_WEBHOOK_TARGET;

  if (!target) {
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: "Patient sticker extraction target is not configured",
      }),
    };
  }

  try {
    const contentType = getHeaderValue(event.headers, "content-type");
    const accept = getHeaderValue(event.headers, "accept");
    const requestHeaders = {};

    if (contentType) {
      requestHeaders["content-type"] = contentType;
    }

    if (accept) {
      requestHeaders.accept = accept;
    }

    const bodyBuffer =
      typeof event.body === "string"
        ? Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8")
        : undefined;

    const response = await fetch(target, {
      method: "POST",
      headers: requestHeaders,
      body: bodyBuffer,
    });

    const responseContentType =
      response.headers.get("content-type") || "application/json";
    const responseBuffer = Buffer.from(await response.arrayBuffer());
    const isJsonResponse =
      responseContentType.includes("application/json") ||
      responseContentType.startsWith("text/");

    return {
      statusCode: response.status,
      headers: {
        "content-type": responseContentType,
        "access-control-allow-origin": "*",
      },
      body: isJsonResponse
        ? responseBuffer.toString("utf8")
        : responseBuffer.toString("base64"),
      isBase64Encoded: !isJsonResponse,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error:
          error && error.message
            ? error.message
            : "Patient sticker extraction proxy failed",
      }),
    };
  }
};
