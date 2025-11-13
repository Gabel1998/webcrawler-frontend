/**
 * API Module - Handles all backend communication
 */
const API = (() => {
    const BASE_URL = 'http://localhost:8080/api';  // ✅ http not https

    /**
     * Generic fetch wrapper with error handling
     */
    async function fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {  // ✅ Fixed: backticks and endpoint
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    return {
        /**
         * Create a new crawl job
         */
        async createCrawlJob(data) {
            return fetchAPI('/crawl-jobs', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        /**
         * Start a crawl job
         */
        async startCrawlJob(jobId) {
            return fetchAPI(`/crawl-jobs/${jobId}/start`, {
                method: 'POST'
            });
        },

        /**
         * Get all crawl jobs
         */
        async getAllJobs() {
            return fetchAPI('/crawl-jobs');
        },

        /**
         * Get a specific job by ID
         */
        async getJob(jobId) {
            return fetchAPI(`/crawl-jobs/${jobId}`);
        },

        /**
         * Get jobs by status
         */
        async getJobsByStatus(status) {
            return fetchAPI(`/crawl-jobs?status=${status}`);
        },

        /**
         * Get all pages for a job
         */
        async getJobPages(jobId) {
            return fetchAPI(`/crawl-jobs/${jobId}/results/pages`);
        },

        /**
         * Get root pages for a job
         */
        async getRootPages(jobId) {
            return fetchAPI(`/crawl-jobs/${jobId}/results/root-pages`);
        },

        /**
         * Get pages by level
         */
        async getPagesByLevel(jobId, level) {
            return fetchAPI(`/crawl-jobs/${jobId}/results/pages?level=${level}`);
        },

        /**
         * Get statistics for a job
         */
        async getJobStats(jobId) {
            return fetchAPI(`/crawl-jobs/${jobId}/results/stats`);
        },

        /**
         * Get graph data for a job
         */
        async getGraphData(jobId) {
            return fetchAPI(`/crawl-jobs/${jobId}/results/graph-data`);
        }
    };
})();