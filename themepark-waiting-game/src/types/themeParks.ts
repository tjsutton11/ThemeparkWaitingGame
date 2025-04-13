export interface Park {
    id: string;
    name: string;
}

export interface Destination {
    id: string;
    name: string;
    slug: string;
    parks: Park[];
}

export interface DestinationsResponse {
    destinations: Destination[];
}

export interface QueueData {
    waitTime?: number;
    state?: string;
    returnStart?: string;
    returnEnd?: string;
    price?: {
        amount: number;
        currency: string;
        formatted: string;
    };
    allocationStatus?: string;
    currentGroupStart?: number;
    currentGroupEnd?: number;
    nextAllocationTime?: string;
    estimatedWait?: number;
}

export interface LiveData {
    id: string;
    name: string;
    entityType: string;
    status: string;
    lastUpdated: string;
    queue: {
        STANDBY?: QueueData;
        SINGLE_RIDER?: QueueData;
        RETURN_TIME?: QueueData;
        PAID_RETURN_TIME?: QueueData;
        BOARDING_GROUP?: QueueData;
    };
}

export interface LiveResponse {
    id: string;
    name: string;
    entityType: string;
    timezone: string;
    liveData: LiveData[];
} 