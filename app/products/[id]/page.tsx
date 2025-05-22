import { storefront } from "@/utils/products"; // Your existing storefront function
import Header from "@/components/navbar";     // Your existing Header component
import Image from 'next/image';
import { redirect } from 'next/navigation';

// GraphQL query to fetch a single product by its handle
const productByHandleQuery = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      descriptionHtml
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 1) {
        edges {
          node {
            transformedSrc
            altText
          }
        }
      }
      variants(first: 1) { # We'll use the first variant for simplicity
        edges {
          node {
            id # This is the merchandiseId for cart operations
            price {
                amount
                currencyCode
            }
            title # Variant title e.g., "Small / Red"
          }
        }
      }
    }
  }
`;

// GraphQL mutation to create a cart and get the checkout URL
const cartCreateMutation = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// --- TypeScript Types ---

// Generic type for Shopify GraphQL responses
type ShopifyGraphQLResponse<T> = {
    data: T | null;
    errors?: Array<{
        message: string;
        locations?: Array<{ line: number; column: number }>;
        path?: string[];
        extensions?: Record<string, any>;
    }>;
};

// Type for the data structure of a single product
type ProductDetailsData = {
    productByHandle: {
        id: string;
        title: string;
        descriptionHtml: string;
        priceRange: {
            minVariantPrice: {
                amount: string;
                currencyCode: string;
            };
        };
        images: {
            edges: Array<{
                node: {
                    transformedSrc: string;
                    altText: string | null;
                };
            }>;
        };
        variants: {
            edges: Array<{
                node: {
                    id: string; // This is the merchandiseId (gid for ProductVariant)
                    price: {
                        amount: string;
                        currencyCode: string;
                    };
                    title: string;
                };
            }>;
        };
    } | null;
};

// Type for the full response of the productByHandle query
type ProductDetailsPageResponse = ShopifyGraphQLResponse<ProductDetailsData>;

// Type for the data structure of the cartCreate mutation
type CartCreateData = {
    cartCreate: {
        cart: {
            id: string;
            checkoutUrl: string;
        } | null;
        userErrors: Array<{
            field: string[] | null;
            message: string;
        }>;
    } | null;
};

// Type for the full response of the cartCreate mutation
type CartCreateMutationResponse = ShopifyGraphQLResponse<CartCreateData>;


interface ProductPageParams {
    id: string; // This 'id' from params will be the product handle
}

// The props for the page component
interface PageProps {
    params: ProductPageParams;
}

export const revalidate = 3600; // Revalidate product data every hour

// SERVER ACTION
async function handleCheckout(variantId: string) {
    'use server';

    if (!variantId) {
        console.error("No variant ID provided to handleCheckout action.");
        return { error: "Variant ID is missing." };
    }

    const cartInput = {
        lines: [
            {
                merchandiseId: variantId,
                quantity: 1,
            },
        ],
    };

    try {
        const cartApiResponse = await storefront<
            { input: typeof cartInput },
            CartCreateMutationResponse
        >({
            query: cartCreateMutation,
            variables: { input: cartInput },
        });

        if (cartApiResponse.errors) {
            console.error("GraphQL errors during cart creation:", cartApiResponse.errors);
            return { error: "Failed to create cart due to GraphQL errors." };
        }

        const cartCreatePayload = cartApiResponse.data?.cartCreate;

        if (cartCreatePayload?.userErrors && cartCreatePayload.userErrors.length > 0) {
            console.error("User errors on cart creation:", cartCreatePayload.userErrors);
            const errorMessages = cartCreatePayload.userErrors.map(err => err.message).join("; ");
            console.error(`User-facing error: ${errorMessages}`);
            return { error: `Could not create cart: ${errorMessages}` };
        }

        if (cartCreatePayload?.cart?.checkoutUrl) {
            redirect(cartCreatePayload.cart.checkoutUrl);
        } else {
            console.error("Failed to create cart or get checkout URL. Payload:", cartCreatePayload);
            return { error: "Failed to get checkout URL." };
        }
    } catch (error: any) {
        // Check if the error is a redirect error more flexibly
        if (error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
            throw error; // Re-throw to let Next.js handle the redirect
        }
        // Log other errors
        console.error("Exception during checkout process (not a redirect):", error);
        return { error: "An unexpected error occurred during checkout." };
    }
}


export default async function ProductPage({ params: pageParamsProp }: PageProps) {
    const awaitedParams = await pageParamsProp;
    const { id: handle } = awaitedParams;

    const productResponse = await storefront<
        { handle: string },
        ProductDetailsPageResponse
    >({
        query: productByHandleQuery,
        variables: { handle },
    });

    if (productResponse.errors) {
        console.error("GraphQL errors fetching product:", productResponse.errors);
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
                <Header />
                <div className="mt-20 p-6 bg-white shadow-lg rounded-lg">
                    <h1 className="text-2xl font-bold text-red-600">Error Loading Product Data</h1>
                    <p className="text-gray-600 mt-2">We encountered an issue fetching the product details.</p>
                    <p className="text-sm text-gray-500 mt-4">Details: {productResponse.errors.map(e => e.message).join(', ')}</p>
                </div>
            </div>
        );
    }

    const product = productResponse.data?.productByHandle;

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
                <Header />
                <div className="mt-20 p-6 bg-white shadow-lg rounded-lg">
                    <h1 className="text-2xl font-bold text-gray-700">Product Not Found</h1>
                    <p className="text-gray-500 mt-2">Sorry, the product you are looking for does not exist or may have been removed.</p>
                </div>
            </div>
        );
    }

    const firstVariant = product.variants.edges[0]?.node;
    if (!firstVariant?.id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
                <Header />
                <div className="mt-20 p-6 bg-white shadow-lg rounded-lg">
                    <h1 className="text-2xl font-bold text-gray-700">Product Variant Not Available</h1>
                    <p className="text-gray-500 mt-2">This product currently has no valid variants available for purchase.</p>
                </div>
            </div>
        );
    }

    const image = product.images.edges[0]?.node;

    const handleCheckoutWithVariant = handleCheckout.bind(null, firstVariant.id);


    return (
        <div className="bg-white min-h-screen">
            <Header />

            <main className="max-w-4xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:max-w-7xl lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
                    <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        {image ? (
                            <Image
                                src={image.transformedSrc}
                                alt={image.altText || product.title}
                                width={600}
                                height={600}
                                className="w-full h-full object-center object-cover"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-200">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span className="ml-2">No image available</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{product.title}</h1>

                        <div className="mt-3">
                            <h2 className="sr-only">Product information</h2>
                            <p className="text-3xl text-gray-900">
                                {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: product.priceRange.minVariantPrice.currencyCode // Corrected this line
                                }).format(parseFloat(product.priceRange.minVariantPrice.amount))}
                            </p>
                        </div>

                        {firstVariant.title && firstVariant.title !== "Default Title" && (
                            <p className="mt-2 text-sm text-gray-500">Variant: {firstVariant.title}</p>
                        )}

                        <div className="mt-6">
                            <h3 className="sr-only">Description</h3>
                            <div
                                className="text-base text-gray-700 space-y-6 prose prose-indigo lg:prose-lg max-w-none"
                                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                            />
                        </div>

                        <form action={handleCheckoutWithVariant} className="mt-8">
                            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 ease-in-out sm:w-auto flex-grow sm:flex-grow-0"
                                >
                                    Checkout Now
                                </button>

                                <button
                                    type="button"
                                    className="w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 ease-in-out sm:w-auto flex-grow sm:flex-grow-0"
                                >
                                    ATC
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}