import type { NextApiRequest, NextApiResponse } from 'next';

type PriceResult = {
    title: string;
    price: string;
    source: string;
    link: string;
    thumbnail?: string;
};

const MOCK_RESULTS: PriceResult[] = [
    {
        title: "Dulux Trade Vinyl Matt - Pure Brilliant White - 5L",
        price: "£42.00",
        source: "Mock Hardware Store",
        link: "#",
        thumbnail: "https://via.placeholder.com/100?text=Dulux+5L"
    },
    {
        title: "Dulux Retail Matt Emulsion - White - 2.5L",
        price: "£26.00",
        source: "Mock DIY Shop",
        link: "#",
        thumbnail: "https://via.placeholder.com/100?text=Dulux+2.5L"
    },
    {
        title: "Farrow & Ball Estate Emulsion - All White - 2.5L",
        price: "£59.00",
        source: "Mock Luxury Paints",
        link: "#",
        thumbnail: "https://via.placeholder.com/100?text=F&B+2.5L"
    }
];

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { query, location } = req.query;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const apiKey = process.env.SERPAPI_KEY;

    // 1. Fallback to Mock Data if no key is present
    if (!apiKey) {
        console.log('No SERPAPI_KEY found, returning mock data.');
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return res.status(200).json({ results: MOCK_RESULTS, isMock: true });
    }

    // 2. Real SerpApi Call
    try {
        const params = new URLSearchParams({
            engine: "google_shopping",
            q: query,
            google_domain: "google.co.uk",
            gl: "uk",
            hl: "en",
            api_key: apiKey,
            num: "10" // Limit results
        });

        if (location && typeof location === 'string') {
            params.append('location', location);
        }

        const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const shoppingResults = data.shopping_results || [];

        const results: PriceResult[] = shoppingResults.map((item: any) => ({
            title: item.title,
            price: item.price,
            source: item.source,
            link: item.link,
            thumbnail: item.thumbnail
        }));

        return res.status(200).json({ results, isMock: false });

    } catch (error: any) {
        console.error('SerpApi Error:', error);
        return res.status(500).json({ error: 'Failed to fetch prices', details: error.message });
    }
}
