/**
 * Advanced Visualization with Export capabilities
 */
const Visualization = (() => {
    let currentSvg = null;
    let currentData = null;

    /**
     * Create Force-Directed Network Graph
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

        // Color scale
        const color = d3.scaleOrdinal()
            .domain([0, 1, 2, 3, 4])
            .range(['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b']);

        // Size scale
        const sizeScale = d3.scaleLinear()
            .domain([0, d3.max(graphData.nodes, d => d.value)])
            .range([5, 20]);

        // Force simulation
        const simulation = d3.forceSimulation(graphData.nodes)
            .force('link', d3.forceLink(graphData.links)
                .id(d => d.id)
                .distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => sizeScale(d.value) + 5));

        // Create links
        const link = g.append('g')
            .selectAll('line')
            .data(graphData.links)
            .enter().append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowhead)');

        // Create nodes
        const node = g.append('g')
            .selectAll('circle')
            .data(graphData.nodes)
            .enter().append('circle')
            .attr('r', d => sizeScale(d.value))
            .attr('fill', d => color(d.group))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .call(drag(simulation));

        // Node labels
        const label = g.append('g')
            .selectAll('text')
            .data(graphData.nodes)
            .enter().append('text')
            .text(d => d.title || d.url.split('/').pop())
            .style('font-size', '10px')
            .style('font-family', 'Arial, sans-serif')
            .attr('dx', 15)
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
            .style('pointer-events', 'none');

        // Node hover
        node.on('mouseover', (event, d) => {
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`
                <strong>${d.title || 'No Title'}</strong><br/>
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
    }

    /**
     * Export current visualization as SVG
     */
    function exportSVG() {
        if (!currentSvg) return;

        // Get SVG element
        const svgElement = document.getElementById('network-graph');
        const svgData = new XMLSerializer().serializeToString(svgElement);

        // Create blob and download
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

        const svgElement = document.getElementById('network-graph');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Get SVG dimensions
        const width = svgElement.width.baseVal.value;
        const height = svgElement.height.baseVal.value;

        canvas.width = width * 2; // Higher resolution
        canvas.height = height * 2;
        context.scale(2, 2);

        // Convert SVG to data URL
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

        const svgElement = document.getElementById('network-graph');
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

    return {
        createNetworkGraph,
        exportSVG,
        exportPNG,
        exportJPEG
    };
})();