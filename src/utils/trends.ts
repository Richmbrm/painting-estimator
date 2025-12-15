export interface TrendColor {
    id: string;
    name: string;
    brand: string;
    hex: string; // Approximate hex code for display
    description: string;
    season: string;
}

export const WINTER_TRENDS: TrendColor[] = [
    {
        id: 'trend_true_joy',
        name: 'True Joy™',
        brand: 'Dulux',
        hex: '#ffcc00', // Vibrant Yellow
        description: 'Dulux Colour of the Year 2025. A sunny yellow to bring optimism to winter days.',
        season: 'Winter 2025'
    },
    {
        id: 'trend_cola',
        name: 'Cola',
        brand: 'Farrow & Ball',
        hex: '#4a3c31', // Deep Brown
        description: 'A deep, dark brown with red undertones. Perfect for cosy winter snugs.',
        season: 'Winter 2025'
    },
    {
        id: 'trend_brave_ground',
        name: 'Brave Ground™',
        brand: 'Dulux',
        hex: '#9e8e78', // Earthy Neutral
        description: 'An earthy neutral that brings a sense of stability and calm.',
        season: 'Winter 2025'
    },
    {
        id: 'trend_marmelo',
        name: 'Marmelo',
        brand: 'Farrow & Ball',
        hex: '#d67e3e', // Burnt Orange
        description: 'A mellow burnt orange, adding warmth and "new nostalgia" to any room.',
        season: 'Winter 2025'
    }
];
