import { useState } from "react";

export const useLoader = () => {
    const [isLoading, setIsLoading] = useState(false);

    const withLoader = async <T>(fn: () => Promise<T>): Promise<T> => {
        setIsLoading(true);
        try {
            const result = await fn();
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, withLoader };
};