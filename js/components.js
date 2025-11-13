/**
 * UI Components - Reusable UI elements for web application
 */

const Components = (() => {

    /**
     * Create a job card element
     */
    function jobCard(job) {
        const statusClass = 'status-${job.status}';
        const canStart = job.status ==='PENDING';
        const canViewResults = job.status === 'COMPLETED';

        return `
            <div class="job-card">
                <div class="job-header">
                    <div class="job-info">
                        <h3>Job #${job.id}</h3>
                        <a href="${job.startUrl}" target="_blank" class="job-url">
                            ${job.startUrl}
                        </a>
                    </div>
                    <div>
                        <span class="status-badge ${statusClass}">
                            ${job.status}
                        </span>
                    </div>
                </div>

                <div class="job-meta">
                    <div class="meta-item">
                        <span class="meta-label">Max Depth</span>
                        <span class="meta-value">${job.maxDepth}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Scope</span>
                        <span class="meta-value">${job.crawlScope}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Pages Found</span>
                        <span class="meta-value">${job.totalPagesFound || 0}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Pages Crawled</span>
                        <span class="meta-value">${job.totalPagesCrawled || 0}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Created</span>
                        <span class="meta-value">${formatDate(job.createdAt)}</span>
                    </div>
                </div>

                <div class="job-actions" style="margin-top: 1rem;">
                    ${canStart ? `
                        <button class="btn btn-success btn-small" onclick="app.startJob(${job.id})">
                            ▶️ Start
                        </button>
                    ` : ''}
                    ${canViewResults ? `
                        <button class="btn btn-primary btn-small" onclick="app.viewResults(${job.id})">
                            📊 View Results
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-small" onclick="app.refreshJob(${job.id})">
                        🔄 Refresh
                    </button>
                </div>

                ${job.errorMessage ? `
                    <div style="margin-top: 1rem; padding: 0.75rem; background: #fee2e2; border-radius: 4px; color: #991b1b;">
                        <strong>Error:</strong> ${job.errorMessage}
                    </div>
                ` : ''}
            </div>
        `;
    }
    /**
     * Create job details modal content
     */
    function jobDetailsModal(job, pages, stats) {
        return `
            <h2>Job #${job.id} Results</h2>
            <p style="color: var(--secondary); margin-bottom: 2rem;">
                ${job.startUrl}
            </p>

            <!-- Statistics -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalPages}</div>
                    <div class="stat-label">Total Pages</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.successfulPages}</div>
                    <div class="stat-label">Successful</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.failedPages}</div>
                    <div class="stat-label">Failed</div>
                </div>
            </div>

            <!-- Pages List -->
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Crawled Pages</h3>
            <div class="page-list">
                ${pages.map(page => pageItem(page)).join('')}
            </div>
        `;
    }

    /**
     * Create a page item element
     */
    function pageItem(page) {
        const statusClass = page.isSuccessful ? 'success' : 'failed';

        return `
            <div class="page-item ${statusClass}">
                <div class="page-title">
                    ${page.title || 'No Title'}
                </div>
                <a href="${page.url}" target="_blank" class="page-url">
                    ${page.url}
                </a>
                <div class="page-meta">
                    <span>Level: ${page.hierarchyLevel}</span>
                    <span>Status: ${page.httpStatusCode || 'N/A'}</span>
                    <span>Links: ${page.outgoingLinksCount}</span>
                    ${page.contentType ? `<span>Type: ${page.contentType}</span>` : ''}
                </div>
                ${page.errorMessage ? `
                    <div style="margin-top: 0.5rem; color: var(--danger); font-size: 0.875rem;">
                        Error: ${page.errorMessage}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Format date
     */
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return {
        jobCard,
        jobDetailsModal,
        pageItem,
        formatDate
    };
})();

function jobDetailsModal(job, pages, stats) {
    return `
        <h2>Job #${job.id} Results</h2>
        
        <!-- Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.totalPages}</div>
                <div class="stat-label">Total Pages</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.successfulPages}</div>
                <div class="stat-label">Successful</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.failedPages}</div>
                <div class="stat-label">Failed</div>
            </div>
        </div>

        <!-- Visualization Container -->
        <div style="margin: 2rem 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3>Network Visualization</h3>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="Visualization.exportSVG()" class="btn btn-secondary btn-small">
                        📊 Export SVG
                    </button>
                    <button onclick="Visualization.exportPNG()" class="btn btn-secondary btn-small">
                        🖼️ Export PNG
                    </button>
                    <button onclick="Visualization.exportJPEG()" class="btn btn-secondary btn-small">
                        📷 Export JPEG
                    </button>
                </div>
            </div>
            <div id="graph-container" style="border: 2px solid #e5e7eb; border-radius: 8px; overflow: hidden;"></div>
        </div>

        <!-- Pages List -->
        <h3>Crawled Pages</h3>
        <div class="page-list">
            ${pages.map(page => pageItem(page)).join('')}
        </div>
    `;
}