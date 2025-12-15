export interface PaintProduct {
    id: string;
    name: string;
    brand: string;
    type: 'wall' | 'trim';
    pricePerLitre: number;
    coveragePerLitre: number; // m2/L
    description: string;
}

export const SUPPLIER_DATA: PaintProduct[] = [
    // --- Wall Paints ---
    {
        id: 'wall_economy',
        name: 'Matt Emulsion (Economy)',
        brand: 'Generic Store Brand',
        type: 'wall',
        pricePerLitre: 3.50,
        coveragePerLitre: 10,
        description: 'Basic contract matt for budget projects.'
    },
    {
        id: 'wall_standard',
        name: 'Vinyl Matt (Standard)',
        brand: 'Dulux / Crown',
        type: 'wall',
        pricePerLitre: 9.00,
        coveragePerLitre: 13,
        description: 'Durable, washable finish suitable for most rooms.'
    },
    {
        id: 'wall_premium',
        name: 'Estate Emulsion (Premium)',
        brand: 'Farrow & Ball',
        type: 'wall',
        pricePerLitre: 22.00,
        coveragePerLitre: 14,
        description: 'Signature chalky finish, exceptional depth of colour.'
    },

    // --- Trim Paints ---
    {
        id: 'trim_gloss',
        name: 'High Gloss (Standard)',
        brand: 'Dulux Trade',
        type: 'trim',
        pricePerLitre: 16.00,
        coveragePerLitre: 15,
        description: 'High shine, tough finish for wood and metal.'
    },
    {
        id: 'trim_satin',
        name: 'Satinwood (Standard)',
        brand: 'Dulux Trade',
        type: 'trim',
        pricePerLitre: 18.00,
        coveragePerLitre: 16,
        description: 'Mid-sheen finish, elegant and durable.'
    },
    {
        id: 'trim_eggshell',
        name: 'Eggshell (Premium)',
        brand: 'Farrow & Ball',
        type: 'trim',
        pricePerLitre: 28.00,
        coveragePerLitre: 12,
        description: 'Low sheen finish for woodwork and metal.'
    }
];

export function getProductById(id: string): PaintProduct | undefined {
    return SUPPLIER_DATA.find(p => p.id === id);
}
