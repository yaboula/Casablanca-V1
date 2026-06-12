import api from '@/lib/api';

/**
 * Maps the backend Vehicle entity to the frontend's expected UI shape.
 */
export const adaptVehicleToFrontend = (backendVehicle) => {
    // Map backend categories to frontend ones
    const catMap = {
        SEDAN: 'executive',
        SUV: 'suv',
        LUXURY: 'sport',
        COMPACT: 'all'
    };

    const catLabelMap = {
        SEDAN: 'Executive',
        SUV: 'SUV',
        LUXURY: 'Sport',
        COMPACT: 'Compact'
    };

    const category = catMap[backendVehicle.category] || 'executive';
    const categoryLabel = catLabelMap[backendVehicle.category] || 'Executive';

    const images = [backendVehicle.imageUrl];
    if (backendVehicle.imageUrls && backendVehicle.imageUrls.length > 0) {
        images.push(...backendVehicle.imageUrls);
    }

    const tagline = (backendVehicle.features && backendVehicle.features.length > 0) 
        ? backendVehicle.features[0] 
        : `Experience the ${backendVehicle.model}`;

    return {
        id: backendVehicle.id, // backend UUID
        name: `${backendVehicle.brand} ${backendVehicle.model}`,
        brand: backendVehicle.brand,
        category: category,
        categoryLabel: categoryLabel,
        tagline: tagline,
        pricePerDay: Math.round(backendVehicle.pricePerDayEurCents / 100),
        deposit: 2000, // Static deposit fallback since it's dynamic per reservation
        seats: backendVehicle.seats,
        available: backendVehicle.status === 'AVAILABLE',
        rating: 4.9, // Mock rating as backend doesn't provide one yet
        headlineSpecs: [
            { label: "Seats", value: String(backendVehicle.seats) },
            { label: "Trans", value: backendVehicle.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual' },
            { label: "Luggage", value: String(backendVehicle.luggageCount) },
        ],
        specs: [
            { label: "Transmission", value: backendVehicle.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual' },
            { label: "Seats", value: String(backendVehicle.seats) },
            { label: "Luggage", value: String(backendVehicle.luggageCount) },
            ...((backendVehicle.features || []).map(f => ({ label: "Feature", value: f })))
        ],
        images,
    };
};

export const fetchVehicles = async (params = {}) => {
    const { data } = await api.get('/vehicles', { params });
    // Backend returns { data: Vehicle[], total: number }
    return data.data.map(adaptVehicleToFrontend);
};

export const fetchVehicleById = async (id) => {
    const { data } = await api.get(`/vehicles/${id}`);
    return adaptVehicleToFrontend(data.data);
};
