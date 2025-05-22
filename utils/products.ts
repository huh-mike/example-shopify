export interface StorefrontConfig {
    endpoint: string;
    token: string;
}

export interface GraphQLRequest<V = Record<string, unknown>> {
    query: string;          // GraphQL string
    variables?: V;          // $variables object
}

export async function storefront<
    V = Record<string, unknown>,
    R = unknown
>(
    { query, variables }: GraphQLRequest<V>,
    cfg: StorefrontConfig = {
        endpoint: process.env.NEXT_PUBLIC_API_URL!,
        token:     process.env.NEXT_PUBLIC_ACCESS_TOKEN!,
    },
): Promise<R> {
    const res = await fetch(cfg.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': cfg.token,
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
        // gives you 4xx / 5xx info instead of silent undefineds
        throw new Error(`Shopify Storefront error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<R>;
}