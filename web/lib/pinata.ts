/**
 * Pinata IPFS integration helper.
 * Supports PINATA_JWT or PINATA_API_KEY/PINATA_API_SECRET.
 */

interface PinataMetadataAttribute {
  trait_type: string;
  value: string | number;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: PinataMetadataAttribute[];
}

export async function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string | null> {
  const jwt = process.env.PINATA_JWT;
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;

  if (!jwt && (!apiKey || !apiSecret)) {
    console.warn("Pinata API credentials missing. Falling back to mock IPFS URI.");
    return null;
  }

  try {
    console.log("[Pinata IPFS] Preparing to upload metadata JSON for:", metadata.name);
    console.log("[Pinata IPFS] Metadata Payload:", JSON.stringify(metadata, null, 2));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt.trim()}`;
    } else {
      headers["pinata_api_key"] = apiKey!.trim();
      headers["pinata_secret_api_key"] = apiSecret!.trim();
    }

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers,
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `ticket_${metadata.name.replace(/[^a-zA-Z0-9]/g, "_")}.json`,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as { IpfsHash: string };
    if (!data.IpfsHash) {
      throw new Error("Pinata response missing IpfsHash");
    }

    const ipfsUrl = `ipfs://${data.IpfsHash}`;
    console.log("[Pinata IPFS] Upload successful! IPFS URI:", ipfsUrl);
    return ipfsUrl;
  } catch (error) {
    console.error("Failed to upload metadata to Pinata IPFS:", error);
    return null;
  }
}
