import { PaintProduct } from './supplier_data';

export interface RoomDimensions {
    width: number; // meters
    length: number; // meters
    height: number; // meters
}

export interface EstimationResult {
    totalWallArea: number; // sq meters
    paintableArea: number; // sq meters (after deductions)

    wallPaint: {
        litresNeeded: number;
        cost: number;
        product: PaintProduct;
    };

    trimPaint?: {
        litresNeeded: number;
        cost: number;
        product: PaintProduct;
    };

    totalEstimatedCost: number;
}

const DOOR_DEDUCTION = 2.0; // sq meters
const WINDOW_DEDUCTION = 1.5; // sq meters

export function calculatePaintEstimate(
    dimensions: RoomDimensions,
    wallProduct: PaintProduct,
    trimProduct: PaintProduct | null,
    coats: number = 2,
    numDoors: number = 0,
    numWindows: number = 0,
    includeCeiling: boolean = false
): EstimationResult {
    // 1. Calculate Wall Area: 2 * (W + L) * H
    const perimeter = 2 * (dimensions.width + dimensions.length);
    let grossWallArea = perimeter * dimensions.height;

    // 2. Ceiling Area: W * L
    if (includeCeiling) {
        grossWallArea += dimensions.width * dimensions.length;
    }

    // 3. Deductions & Net Area
    const deductionArea = (numDoors * DOOR_DEDUCTION) + (numWindows * WINDOW_DEDUCTION);
    const paintableArea = Math.max(0, grossWallArea - deductionArea);

    // 4. Wall Paint Calc
    const wallCoverageNeeded = paintableArea * coats;
    const wallLitres = Math.ceil(wallCoverageNeeded / wallProduct.coveragePerLitre);
    const wallCost = wallLitres * wallProduct.pricePerLitre;

    // 5. Trim Paint Calc (Optional)
    let trimResult = undefined;
    if (trimProduct) {
        // Rough approximation for trim: 10% of wall area is usually a safe bet for skirting/frames in a standard room
        // OR fixed amount per door/window + base perimeter?
        // Let's stick to a simple heuristic: 1 Litre is usually enough for a standard room's trim unless it's huge.
        // Better heuristic: Perimeter (skirting) + (Doors * 5m linear)
        // Linear meters to Sq meters conversion ~ 0.15m height for skirting.

        const skirtingArea = perimeter * 0.15; // 15cm high skirting
        const totalItems = numDoors + numWindows;
        const doorFrameArea = totalItems * 0.5; // approx 0.5 sqm per door frame/window sill
        const totalTrimArea = skirtingArea + doorFrameArea;

        const trimCoverageNeeded = totalTrimArea * coats; // Trim usually needs 2 coats too
        const trimLitres = Math.ceil(trimCoverageNeeded / trimProduct.coveragePerLitre);
        // Often trim comes in smaller cans (1L or 2.5L), but we price per Litre.
        // Minimum purchase usually 1L.
        const actualTrimLitres = Math.max(1, trimLitres);

        trimResult = {
            litresNeeded: actualTrimLitres,
            cost: actualTrimLitres * trimProduct.pricePerLitre,
            product: trimProduct
        };
    }

    return {
        totalWallArea: grossWallArea,
        paintableArea: paintableArea,

        wallPaint: {
            litresNeeded: wallLitres,
            cost: wallCost,
            product: wallProduct
        },

        trimPaint: trimResult,

        totalEstimatedCost: wallCost + (trimResult?.cost || 0)
    };
}
