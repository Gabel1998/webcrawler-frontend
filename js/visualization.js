/**
 * Advanced Visualization with Category Grouping
 * Both Network and Tree graphs now show categories
 */
const Visualization = (() => {
    let currentSvg = null;
    let currentData = null;

    // Kategori farver og positioner
    const CATEGORY_CONFIG = {
        'PRODUCT': { color: '#3b82f6', label: 'Produkter' },
        'CATEGORY': { color: '#8b5cf6', label: 'Kategorier' },
        'INFORMATION': { color: '#10b981', label: 'Information' },
        'BLOG': { color: '#f59e0b', label: 'Blog' },
        'CONTACT': { color: '#ec4899', label: 'Kontakt' },
        'JOB': { color: '#14b8a6', label: 'Jobs' },
        'LEGAL': { color: '#84cc16', label: 'Juridisk' },
        'HOME': { color: '#f97316', label: 'Forside' },
        'UNKNOWN': { color: '#6b7280', label: 'Ukendt' }
    };

    /**
     * Create Force-Directed Network Graph with Category Clustering
     */
    function createNetworkGraph(containerId, graphData) {
        const container = document.querySelector(containerId);
        const width = container.offsetWidth || 1200;
        const height = 800;

        // Clear previous
        d3.select(containerId).selectAll("*").remove();

        // Create SVG
        const svg = d3.select(containerId)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('id', 'network-graph')
            .style('background', '#f9fafb');

        currentSvg = svg;
        currentData = graphData;

        // Add definitions for markers (arrowheads)
        const defs = svg.append('defs');
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .append('svg:path')
            .attr('d', 'M 0,-5 L 10,0 L 0,5')
            .attr('fill', '#999');

        const g = svg.append('g');

        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        svg.call(zoom);

        // Grupper noder efter kategori
        const nodesByCategory = d3.group(graphData.nodes, d => d.category || 'UNKNOWN');
        const categories = Array.from(nodesByCategory.keys());

        // Beregn kategori-positioner (grid layout)
        const categoriesPerRow = Math.ceil(Math.sqrt(categories.length));
        const categoryWidth = width / categoriesPerRow;
        const categoryHeight = height / Math.ceil(categories.length / categoriesPerRow);

        const categoryPositions = {};
        categories.forEach((cat, i) => {
            const row = Math.floor(i / categoriesPerRow);
            const col = i % categoriesPerRow;
            categoryPositions[cat] = {
                x: col * categoryWidth + categoryWidth / 2,
                y: row * categoryHeight + categoryHeight / 2
            };
        });

        // Color scale baseret på kategori
        const colorScale = (category) => CATEGORY_CONFIG[category]?.color || '#6b7280';

        // Size scale
        const sizeScale = d3.scaleLinear()
            .domain([0, d3.max(graphData.nodes, d => d.value)])
            .range([5, 20]);

        // Force simulation med kategori-gruppering
        const simulation = d3.forceSimulation(graphData.nodes)
            .force('link', d3.forceLink(graphData.links)
                .id(d => d.id)
                .distance(80))
            .force('charge', d3.forceManyBody().strength(-150))
            .force('collision', d3.forceCollide().radius(d => sizeScale(d.value) + 10))
            //  Træk noder mod deres kategori-centre
            .force('x', d3.forceX(d => categoryPositions[d.category || 'UNKNOWN'].x).strength(0.3))
            .force('y', d3.forceY(d => categoryPositions[d.category || 'UNKNOWN'].y).strength(0.3));

        //  Tegn kategori-kasser (baggrund)
        const categoryGroups = g.append('g')
            .attr('class', 'category-boxes')
            .selectAll('g')
            .data(categories)
            .enter().append('g')
            .attr('class', 'category-box');

        // Placeholder rektangler (opdateres efter simulation)
        const categoryRects = categoryGroups.append('rect')
            .attr('class', 'category-rect')
            .attr('fill', d => colorScale(d))
            .attr('fill-opacity', 0.1)
            .attr('stroke', d => colorScale(d))
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('rx', 8);

        // Kategori labels
        const categoryLabels = categoryGroups.append('text')
            .attr('class', 'category-label')
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', d => colorScale(d))
            .text(d => `${CATEGORY_CONFIG[d]?.label || d} (${nodesByCategory.get(d).length})`);

        // Create links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(graphData.links)
            .enter().append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.4)
            .attr('stroke-width', 1.5)
            .attr('marker-end', 'url(#arrowhead)');

        // Create nodes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(graphData.nodes)
            .enter().append('circle')
            .attr('r', d => sizeScale(d.value))
            .attr('fill', d => colorScale(d.category || 'UNKNOWN'))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .call(drag(simulation));

        // Node labels
        const label = g.append('g')
            .attr('class', 'labels')
            .selectAll('text')
            .data(graphData.nodes)
            .enter().append('text')
            .text(d => {
                const title = d.title || d.url.split('/').pop();
                return title.length > 20 ? title.substring(0, 20) + '...' : title;
            })
            .style('font-size', '9px')
            .style('font-family', 'Arial, sans-serif')
            .style('pointer-events', 'none')
            .attr('dx', 12)
            .attr('dy', 4);

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'graph-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', 'white')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '10000');

        // Node hover
        node.on('mouseover', (event, d) => {
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`
                <strong>${d.title || 'No Title'}</strong><br/>
                Category: <span style="color: ${colorScale(d.category || 'UNKNOWN')}">${d.category || 'UNKNOWN'}</span><br/>
                URL: ${d.url}<br/>
                Level: ${d.level}<br/>
                Links: ${d.value - 1}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
            .on('mouseout', () => {
                tooltip.transition().duration(500).style('opacity', 0);
            })
            .on('click', (event, d) => {
                window.open(d.url, '_blank');
            });

        // Opdater kategori-kasser dynamisk baseret på node positioner
        function updateCategoryBoxes() {
            categories.forEach(category => {
                const categoryNodes = nodesByCategory.get(category);
                if (!categoryNodes || categoryNodes.length === 0) return;

                // Find bounds for noder i denne kategori
                const xs = categoryNodes.map(n => n.x);
                const ys = categoryNodes.map(n => n.y);

                const minX = Math.min(...xs) - 40;
                const maxX = Math.max(...xs) + 40;
                const minY = Math.min(...ys) - 40;
                const maxY = Math.max(...ys) + 40;

                // Opdater rektangel
                categoryRects.filter(c => c === category)
                    .attr('x', minX)
                    .attr('y', minY)
                    .attr('width', maxX - minX)
                    .attr('height', maxY - minY);

                // Opdater label position
                categoryLabels.filter(c => c === category)
                    .attr('x', minX + (maxX - minX) / 2)
                    .attr('y', minY - 10);
            });
        }

        // Update positions on tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);

            // Opdater kategori-kasser
            updateCategoryBoxes();
        });

        // Drag functionality
        function drag(simulation) {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended);
        }

        // Initial update after simulation settles
        simulation.on('end', updateCategoryBoxes);
    }

    /**
     * Export current visualization as SVG
     */
    function exportSVG() {
        if (!currentSvg) return;

        const svgElement = document.getElementById('network-graph') || document.getElementById('tree-graph');
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `crawler-graph-${Date.now()}.svg`;
        link.click();

        URL.revokeObjectURL(url);
    }

    /**
     * Export as PNG
     */
    function exportPNG() {
        if (!currentSvg) return;

        const svgElement = document.getElementById('network-graph') || document.getElementById('tree-graph');
        if (!svgElement) return;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const width = svgElement.width.baseVal.value;
        const height = svgElement.height.baseVal.value;

        canvas.width = width * 2;
        canvas.height = height * 2;
        context.scale(2, 2);

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = function() {
            context.fillStyle = 'white';
            context.fillRect(0, 0, width, height);
            context.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                const pngUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `crawler-graph-${Date.now()}.png`;
                link.click();

                URL.revokeObjectURL(pngUrl);
                URL.revokeObjectURL(url);
            }, 'image/png');
        };
        img.src = url;
    }

    /**
     * Export as JPEG
     */
    function exportJPEG() {
        if (!currentSvg) return;

        const svgElement = document.getElementById('network-graph') || document.getElementById('tree-graph');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const width = svgElement.width.baseVal.value;
        const height = svgElement.height.baseVal.value;

        canvas.width = width * 2;
        canvas.height = height * 2;
        context.scale(2, 2);

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = function() {
            context.fillStyle = 'white';
            context.fillRect(0, 0, width, height);
            context.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                const jpegUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = jpegUrl;
                link.download = `crawler-graph-${Date.now()}.jpeg`;
                link.click();

                URL.revokeObjectURL(jpegUrl);
                URL.revokeObjectURL(url);
            }, 'image/jpeg', 0.95);
        };
        img.src = url;
    }

    /**
     * Create Hierarchical Tree Visualization
     * shows categories with colors and labels
     */
    function createTreeGraph(containerId, treeData) {
        if (!treeData) {
            d3.select(containerId).html('<p style="text-align: center; padding: 2rem;">No tree data available</p>');
            return;
        }

        const container = document.querySelector(containerId);
        const width = container.offsetWidth || 1200;
        const height = 800;

        d3.select(containerId).selectAll("*").remove();

        const svg = d3.select(containerId)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('id', 'tree-graph')
            .style('background', '#f9fafb');

        currentSvg = svg;

        const g = svg.append('g')
            .attr('transform', `translate(50, 50)`);

        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        svg.call(zoom);

        const treeLayout = d3.tree()
            .size([height - 100, width - 200]);

        const root = d3.hierarchy(treeData);
        treeLayout(root);

        // Color scale baseret på KATEGORI i stedet for dybde
        const colorScale = (category) => CATEGORY_CONFIG[category]?.color || '#6b7280';

        // Tilføj kategori legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 150}, 20)`);

        legend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .text('Kategorier')
            .style('font-weight', 'bold')
            .style('font-size', '14px');

        // Saml unikke kategorier fra træet
        const categoriesInTree = new Set();
        root.each(d => {
            if (d.data.category) categoriesInTree.add(d.data.category);
        });

        Array.from(categoriesInTree).forEach((cat, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${(i + 1) * 20})`);

            legendItem.append('circle')
                .attr('cx', 5)
                .attr('cy', 0)
                .attr('r', 5)
                .attr('fill', colorScale(cat));

            legendItem.append('text')
                .attr('x', 15)
                .attr('y', 4)
                .text(CATEGORY_CONFIG[cat]?.label || cat)
                .style('font-size', '12px');
        });

        const link = g.selectAll('.tree-link')
            .data(root.links())
            .enter().append('path')
            .attr('class', 'tree-link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x))
            .attr('fill', 'none')
            .attr('stroke', '#999')
            .attr('stroke-width', 2);

        const node = g.selectAll('.tree-node')
            .data(root.descendants())
            .enter().append('g')
            .attr('class', 'tree-node')
            .attr('transform', d => `translate(${d.y},${d.x})`);

        //  Farv noder efter kategori
        node.append('circle')
            .attr('r', d => d.data.value ? Math.max(5, Math.min(d.data.value, 15)) : 7)
            .attr('fill', d => colorScale(d.data.category || 'UNKNOWN'))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer');

        //  Tilføj kategori badge ved siden af node
        node.append('rect')
            .attr('x', 10)
            .attr('y', -10)
            .attr('width', d => {
                const label = CATEGORY_CONFIG[d.data.category]?.label || d.data.category || 'UNKNOWN';
                return label.length * 6 + 8;
            })
            .attr('height', 16)
            .attr('rx', 8)
            .attr('fill', d => colorScale(d.data.category || 'UNKNOWN'))
            .attr('fill-opacity', 0.2)
            .attr('stroke', d => colorScale(d.data.category || 'UNKNOWN'))
            .attr('stroke-width', 1);

        node.append('text')
            .attr('x', 14)
            .attr('y', 1)
            .text(d => CATEGORY_CONFIG[d.data.category]?.label || d.data.category || 'UNKNOWN')
            .style('font-size', '9px')
            .style('font-weight', 'bold')
            .style('fill', d => colorScale(d.data.category || 'UNKNOWN'));

        node.append('text')
            .attr('dy', '0.31em')
            .attr('x', d => {
                const label = CATEGORY_CONFIG[d.data.category]?.label || d.data.category || 'UNKNOWN';
                return label.length * 6 + 20;
            })
            .attr('text-anchor', 'start')
            .text(d => {
                const name = d.data.name || d.data.url || 'Unknown';
                return name.length > 30 ? name.substring(0, 30) + '...' : name;
            })
            .style('font-size', '11px')
            .style('font-family', 'Arial, sans-serif')
            .style('fill', '#333');

        const tooltip = d3.select('body').append('div')
            .attr('class', 'graph-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', 'white')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none');

        node.on('mouseover', (event, d) => {
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`
                <strong>${d.data.name || 'No Name'}</strong><br/>
                Category: <span style="color: ${colorScale(d.data.category || 'UNKNOWN')}">${d.data.category || 'UNKNOWN'}</span><br/>
                URL: ${d.data.url || 'N/A'}<br/>
                Depth: ${d.depth}<br/>
                Children: ${d.children ? d.children.length : 0}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
            .on('mouseout', () => {
                tooltip.transition().duration(500).style('opacity', 0);
            })
            .on('click', (event, d) => {
                if (d.data.url) {
                    window.open(d.data.url, '_blank');
                }
            });

        const bounds = g.node().getBBox();
        const fullWidth = bounds.width;
        const fullHeight = bounds.height;
        const midX = bounds.x + fullWidth / 2;
        const midY = bounds.y + fullHeight / 2;

        svg.call(zoom.transform, d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(Math.min(1, Math.min(width / fullWidth, height / fullHeight) * 0.9))
            .translate(-midX, -midY));
    }

    return {
        createNetworkGraph,
        createTreeGraph,
        exportSVG,
        exportPNG,
        exportJPEG
    };
})();