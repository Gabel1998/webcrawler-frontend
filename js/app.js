/**
 * Main Application Logic
 */
const app = (() => {
    let autoRefreshInterval = null;

    /**
     * Initialize the application
     */
    function init() {
        console.log('🚀 Web Crawler Dashboard initialized');

        // Setup form submission
        document.getElementById('createJobForm').addEventListener('submit', handleCreateJob);

        // Load initial jobs
        loadJobs();

        // Setup modal close on background click
        document.getElementById('detailsModal').addEventListener('click', (e) => {
            if (e.target.id === 'detailsModal') {
                closeModal();
            }
        });

        // Start auto-refresh every 5 seconds
        startAutoRefresh();
    }

    /**
     * Handle create job form submission
     */
    async function handleCreateJob(e) {
        e.preventDefault();

        const formData = {
            startUrl: document.getElementById('startUrl').value,
            maxDepth: parseInt(document.getElementById('maxDepth').value),
            crawlScope: document.getElementById('crawlScope').value,
            respectRobotsTxt: document.getElementById('respectRobotsTxt').checked
        };

        try {
            showToast('Creating crawl job...', 'info');
            const job = await API.createCrawlJob(formData);
            showToast('✅ Crawl job created successfully!', 'success');

            // Reset form
            e.target.reset();

            // Reload jobs
            loadJobs();
        } catch (error) {
            showToast('❌ Failed to create job: ' + error.message, 'error');
        }
    }

    /**
     * Load all crawl jobs
     */
    async function loadJobs() {
        const container = document.getElementById('jobsContainer');

        try {
            container.innerHTML = '<p class="loading">Loading jobs...</p>';
            const jobs = await API.getAllJobs();

            if (jobs.length === 0) {
                container.innerHTML = `
                    <p style="text-align: center; color: var(--secondary); padding: 2rem;">
                        No crawl jobs yet. Create one above to get started! 🚀
                    </p>
                `;
            } else {
                container.innerHTML = jobs.map(job => Components.jobCard(job)).join('');
            }
        } catch (error) {
            container.innerHTML = `
                <p style="text-align: center; color: var(--danger); padding: 2rem;">
                    ❌ Failed to load jobs: ${error.message}
                </p>
            `;
        }
    }

    /**
     * Start a crawl job
     */
    async function startJob(jobId) {
        try {
            showToast('Starting crawl job...', 'info');
            await API.startCrawlJob(jobId);
            showToast('✅ Crawl job started!', 'success');

            // Reload jobs after short delay
            setTimeout(loadJobs, 1000);
        } catch (error) {
            showToast('❌ Failed to start job: ' + error.message, 'error');
        }
    }

    /**
     * Refresh a single job
     */
    async function refreshJob(jobId) {
        try {
            await API.getJob(jobId);
            loadJobs();
            showToast('✅ Job refreshed', 'success');
        } catch (error) {
            showToast('❌ Failed to refresh: ' + error.message, 'error');
        }
    }

    /**
     * View job results in modal
     */
    async function viewResults(jobId) {
        const modal = document.getElementById('detailsModal');
        const modalBody = document.getElementById('modalBody');

        try {
            modalBody.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
            modal.classList.add('active');

            // Fetch all data
            const [job, pages, stats, graphData] = await Promise.all([
                API.getJob(jobId),
                API.getJobPages(jobId),
                API.getJobStats(jobId),
                API.getGraphData(jobId) // Ny!
            ]);

            modalBody.innerHTML = Components.jobDetailsModal(job, pages, stats);

            // Create visualization efter HTML er indsat
            setTimeout(() => {
                Visualization.createNetworkGraph('#graph-container', graphData);
            }, 100);

        } catch (error) {
            modalBody.innerHTML = `<p style="color: var(--danger);">Failed to load: ${error.message}</p>`;
        }
    }

    /**
     * Close modal
     */
    function closeModal() {
        document.getElementById('detailsModal').classList.remove('active');
    }

    /**
     * Refresh jobs list
     */
    function refreshJobs() {
        loadJobs();
        showToast('🔄 Refreshing jobs...', 'info');
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Start auto-refresh
     */
    function startAutoRefresh() {
        // Disable auto-refresh for now - too aggressive
        // autoRefreshInterval = setInterval(() => {
        //     loadJobs();
        // }, 5000);
    }

    /**
     * Stop auto-refresh
     */
    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', init);

    // Expose public methods
    return {
        startJob,
        refreshJob,
        viewResults,
        closeModal,
        refreshJobs
    };
})();