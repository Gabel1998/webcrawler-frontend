/**
 * UI Components - Reusable UI elements for web application
 */

const Components = (() => {

    /**
     * Create a job card element
     */
    function jobCard(job) {
        const statusClass = `status-${job.status}`;
        const canStart = job.status === 'PENDING';
        const canViewResults = job.status === 'COMPLETED';
        const canClassify = job.status === 'COMPLETED'; // NY: Kan klassificere hvis completed

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
                    ${canClassify ? `
                        <button class="btn btn-primary btn-small" onclick="app.classifyJob(${job.id})">
                            🤖 Klassificér
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
    function jobDetailsModal(job, pages, stats, classificationStats = null) {
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
                ${classificationStats ? `
                <div class="stat-card">
                    <div class="stat-value">${classificationStats.analyzedPages}</div>
                    <div class="stat-label">AI Analyzed</div>
                </div>
                ` : ''}
            </div>

            <!-- AI Classification Stats (hvis tilgængelig) -->
            ${classificationStats && classificationStats.categoryBreakdown ? `
                <div style="margin: 2rem 0;">
                    <h3>AI Kategorier</h3>
                    <div class="category-breakdown">
                        ${Object.entries(classificationStats.categoryBreakdown)
            .map(([category, count]) => `
                                <div class="category-item" onclick="app.filterByCategory(${job.id}, '${category}')">
                                    <span class="category-badge category-${category}">${category}</span>
                                    <span class="category-count">${count}</span>
                                </div>
                            `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Visualization Container -->
            <div style="margin: 2rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; gap: 0.5rem;">
                        <h3 style="margin: 0;">Visualization</h3>
                        <button id="networkViewBtn" onclick="app.switchView('network', ${job.id})" class="btn btn-secondary btn-small view-toggle-btn active">
                            🔷 Network
                        </button>
                        <button id="treeViewBtn" onclick="app.switchView('tree', ${job.id})" class="btn btn-secondary btn-small view-toggle-btn">
                            🌳 Tree
                        </button>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button onclick="Visualization.exportSVG()" class="btn btn-secondary btn-small">
                            📊 SVG
                        </button>
                        <button onclick="Visualization.exportPNG()" class="btn btn-secondary btn-small">
                            🖼️ PNG
                        </button>
                        <button onclick="Visualization.exportJPEG()" class="btn btn-secondary btn-small">
                            📷 JPEG
                        </button>
                        <button onclick="API.exportGraphML(${job.id})" class="btn btn-success btn-small">
                            📄 GraphML
                        </button>
                        <button onclick="API.exportXML(${job.id})" class="btn btn-success btn-small">
                            📋 XML
                        </button>
                        <button onclick="API.exportSitemap(${job.id})" class="btn btn-success btn-small">
                            🗺️ Sitemap
                        </button>
                    </div>
                </div>
                <div id="graph-container" style="border: 2px solid #e5e7eb; border-radius: 8px; overflow: hidden;"></div>
            </div>

            <!-- Pages List -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0;">Crawled Pages</h3>
                <button id="clearFilterBtn" onclick="app.clearCategoryFilter(${job.id})" class="btn btn-secondary btn-small" style="display: none;">
                    ❌ Clear Filter
                </button>
            </div>
            <div class="page-list" id="pagesList">
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
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <div class="page-title">
                        ${page.title || 'No Title'}
                    </div>
                    ${page.category ? `
                        <span class="category-badge category-${page.category}">
                            ${page.category}
                        </span>
                    ` : ''}
                </div>
                <a href="${page.url}" target="_blank" class="page-url">
                    ${page.url}
                </a>
                <div class="page-meta">
                    <span>Level: ${page.hieraxyLevel}</span>
                    <span>Status: ${page.httpStatusCode || 'N/A'}</span>
                    <span>Links: ${page.outgoingLinksCount}</span>
                    ${page.contentType ? `<span>Type: ${page.contentType}</span>` : ''}
                    ${page.aiAnalyzed ? `<span>✅ AI Analyzed</span>` : ''}
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