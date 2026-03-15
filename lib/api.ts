// lib/api.ts

// API fetch helpers and CRUD operations

/**
 * Fetch data from the given URL.
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<any>} - The fetched data.
 */
const fetchData = async (url: string): Promise<any> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.json();
};

/**
 * Create a new resource through a POST request.
 * @param {string} url - The URL to post data to.
 * @param {object} data - The data to post.
 * @returns {Promise<any>} - The created resource.
 */
const createResource = async (url: string, data: object): Promise<any> => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.json();
};

/**
 * Read a resource through a GET request.
 * @param {string} url - The URL to fetch the resource from.
 * @returns {Promise<any>} - The requested resource.
 */
const readResource = async (url: string): Promise<any> => {
    return await fetchData(url);
};

/**
 * Update a resource through a PUT request.
 * @param {string} url - The URL to update.
 * @param {object} data - The updated data.
 * @returns {Promise<any>} - The updated resource.
 */
const updateResource = async (url: string, data: object): Promise<any> => {
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.json();
};

/**
 * Delete a resource through a DELETE request.
 * @param {string} url - The URL to delete the resource from.
 * @returns {Promise<void>} - Nothing.
 */
const deleteResource = async (url: string): Promise<void> => {
    const response = await fetch(url, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
};

export { fetchData, createResource, readResource, updateResource, deleteResource };