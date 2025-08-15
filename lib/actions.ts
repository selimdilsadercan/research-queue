import Client, { Environment } from "./client";

// Function to fetch metadata using your existing client
export const fetchWebsiteMetadata = async (
  url: string
): Promise<{
  title: string;
  description: string;
  favicon: string;
  image?: string;
  type?: string;
}> => {
  try {
    console.log("Fetching metadata for URL:", url);

    // Use your existing client
    const client = new Client(Environment("staging"));
    console.log("Client created with staging environment");

    const response = await client.website.GetURLInfo({ url });
    console.log("API Response:", response);

    if (response.error) {
      throw new Error(response.error);
    }

    return {
      title: response.title || "Untitled",
      description: response.description || "",
      favicon:
        response.favicon ||
        `https://www.google.com/s2/favicons?domain=${
          new URL(url).hostname
        }&sz=64`,
      image:
        response.images && response.images.length > 0
          ? response.images[0]
          : undefined,
      type: response.platform || "website", // Use backend's platform detection
    };
  } catch (error) {
    console.error("Error fetching metadata with client:", error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Try direct fetch as fallback
    try {
      console.log("Trying direct fetch as fallback...");
      const response = await fetch(
        `https://staging-website-info-api-mxa2.encr.app/url-info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Direct fetch response:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        title: data.title || "Untitled",
        description: data.description || "",
        favicon:
          data.favicon ||
          `https://www.google.com/s2/favicons?domain=${
            new URL(url).hostname
          }&sz=64`,
        image:
          data.images && data.images.length > 0 ? data.images[0] : undefined,
        type: data.platform || "website", // Use backend's platform detection
      };
    } catch (fallbackError) {
      console.error("Direct fetch also failed:", fallbackError);
    }

    // Return fallback values
    const domain = new URL(url).hostname;
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    return {
      title: "Untitled",
      description: "",
      favicon,
      type: "website",
    };
  }
};
