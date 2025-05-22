import Image from "next/image";
import Header from "@/components/navbar";
import {storefront} from "@/utils/products";

const productsQuery = `
 query Products {
  products(first: 6) {
    edges {
      node {
        title
        handle
        description
        priceRange {
          minVariantPrice {
            amount
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
      }
    }
  }
}
`

type ProductsResponse = {
  data: {
    products: {
      edges: Array<{
        node: {
          title: string;
          handle: string;
          description: string[];
          priceRange: {
            minVariantPrice: { amount: string };
          };
          images: {
            edges: Array<{
              node: { transformedSrc: string; altText: string | null };
            }>;
          };
        };
      }>;
    };
  };
};

export const revalidate = 3600;

export default async function Home() {
  const { data } = await storefront<{}, ProductsResponse>({ query: productsQuery });
  const products = data.products.edges.map(({ node }) => ({
    id: node.handle,                               // or node.id if you queried it
    name: node.title,
    href: `/products/${node.handle}`,              // build a product URL
    price: `S$${(+node.priceRange.minVariantPrice.amount).toFixed(2)}`,
    description: node.description,
    imageSrc: node.images.edges[0]?.node.transformedSrc ?? '/placeholder.jpg',
    imageAlt: node.images.edges[0]?.node.altText ?? node.title,
  }));
  const staticProducts = [
    {
      id: 1,
      name: 'Focus Paper Refill',
      href: '#',
      price: '$13',
      description: '3 sizes available',
      imageSrc: 'https://fastly.picsum.photos/id/1070/600/600.jpg?hmac=WdshjrfPzYB1b5i82jm_qYAORJjBjhd2lNyC6c1rFdw',
      imageAlt: 'Person using a pen to cross a task off a productivity paper card.',
    },
    {
      id: 2,
      name: 'Productivity Planner',
      href: '#',
      price: '$22',
      description: 'Undated weekly layout',
      imageSrc: 'https://fastly.picsum.photos/id/868/600/600.jpg?hmac=z_O3S-q7nYD9UC8Ki10KwUY2xnLgKFnHqkSWLu37YQ8',
      imageAlt: 'Open planner on a desk with a pen placed on top.',
    },
    {
      id: 3,
      name: 'Task Management Notebook',
      href: '#',
      price: '$18',
      description: 'Hardcover, 120 pages',
      imageSrc: 'https://fastly.picsum.photos/id/783/600/600.jpg?hmac=zpPpcRXoJELFXXp2dyVDwa6dd82RJ7s8v5M_4uEw8vU',
      imageAlt: 'Notebook with task checklists written and highlighted.',
    },
  ];

  return(
      <div className="bg-gray-100">
        <Header/>
        <main className="mt-16 mx-auto max-w-7xl px-4 md:mt-24 ">
          <div className="flex flex-col justify-center text-center h-[50vh]">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 md:text-6xl">
              <span className="block xl:inline">Get more orders</span>{' '}
              <span className="block text-indigo-600 xl:inline">with less worry</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 md:mt-5 md:text-lg md:max-w-3xl">
              Level up your sales with our most advanced and innovative marketing solutions. We provide branding, digital marketing, advertising & media, and campaign management solutions with the lowest prices you have ever seen in Singapore.
            </p>
            <div className="mt-5 max-w-md mx-auto flex justify-center md:mt-8">
              <div className="rounded-md shadow">
                <a
                    href="#"
                    className="w-full flex items-center justify-center px-4 py-2 divide-x divide-white/40 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-3 md:text-lg md:px-6"
                >
                  <span className='pr-2 md:pr-6'>Get Consultation</span>
                  <span className='pl-2 md:pl-6 font-bold'>S$29</span>
                </a>
              </div>
              <div className="mt-3 rounded-md shadow md:mt-0 md:ml-3">
              </div>
            </div>
          </div>

          {/* Products */}

          <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
            <h2 id="products-heading" className="sr-only">
              Products
            </h2>
            <h2 className='text-3xl font-extrabold text-gray-900 mb-8'>
              Featured Products
            </h2>

            <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:gap-x-8">
              {products.map((product) => (
                  <a key={product.id} href={product.href} className="group">
                    <div className="w-full aspect-w-1 aspect-h-1 rounded-lg overflow-hidden sm:aspect-w-2 sm:aspect-h-3">
                      <img
                          src={product.imageSrc}
                          alt={product.imageAlt}
                          className="w-full h-full object-center object-cover group-hover:opacity-75"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-base font-medium text-gray-900">
                      <h3>{product.name}</h3>
                      <p>{product.price}</p>
                    </div>
                    <p className="mt-1 text-sm italic text-gray-500">{product.description}</p>
                  </a>
              ))}
            </div>
          </div>


        </main>
        <footer className="bg-gray-100 mt-16">
          <hr className="border-t border-gray-300" />
          <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} GoodMarketing. All rights reserved.</p>
            <div className="mt-4 space-x-4">
              <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-600">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
  )
}
