export const createChart = () => {
    const createXPChart = (transactions, containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        let cumulativeXP = 0;
        const dataPoints = transactions.map(t => {
            cumulativeXP += t.amount;
            return {
                date: new Date(t.createdAt),
                xp: cumulativeXP
            };
        });

        const width = container.clientWidth || 600;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const maxXP = Math.max(...dataPoints.map(d => d.xp));
        const minDate = new Date(Math.min(...dataPoints.map(d => d.date)));
        const maxDate = new Date(Math.max(...dataPoints.map(d => d.date)));
        const dateRange = maxDate - minDate;

        container.innerHTML = '';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('width', '100%');

        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('width', width);
        bg.setAttribute('height', height);
        bg.setAttribute('fill', 'transparent');
        svg.appendChild(bg);

        for (let i = 0; i <= 5; i++) {
            const y = margin.top + (chartHeight / 5) * i;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', margin.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - margin.right);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);
        }

        const pathData = dataPoints.map((point, index) => {
            const x = margin.left + (chartWidth * ((point.date - minDate) / dateRange));
            const y = margin.top + chartHeight - (chartHeight * (point.xp / maxXP));
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', '#00f5ff');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);

        dataPoints.forEach(point => {
            const x = margin.left + (chartWidth * ((point.date - minDate) / dateRange));
            const y = margin.top + chartHeight - (chartHeight * (point.xp / maxXP));

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#00f5ff');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '2');
            svg.appendChild(circle);
        });

        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxXP / 5) * (5 - i));
            const y = margin.top + (chartHeight / 5) * i;

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', margin.left - 10);
            text.setAttribute('y', y + 5);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', '#e0e0e0');
            text.textContent = value.toLocaleString();
            svg.appendChild(text);
        }

        const xLabelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const labelStep = Math.max(1, Math.floor(dataPoints.length / 10));
        
        dataPoints.forEach((point, i) => {
            if (i % labelStep === 0 || i === dataPoints.length - 1) {
                const x = margin.left + (chartWidth * ((point.date - minDate) / dateRange));
                const y = margin.top + chartHeight + 20;
                
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', y);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '10');
                text.setAttribute('fill', '#e0e0e0');
                text.textContent = point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                xLabelsGroup.appendChild(text);
            }
        });
        svg.appendChild(xLabelsGroup);

        container.appendChild(svg);
    };

    const createAuditChart = (done, received, containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        const width = container.clientWidth || 400;
        const height = 300;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;
        const innerRadius = radius * 0.7;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        // Create defs for gradients
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        
        // Add gradient definitions for done and received
        const doneGradient = createGradient("doneGradient", "#00f5ff", "#00c8ff");
        const receivedGradient = createGradient("receivedGradient", "#8a2be2", "#9932cc");
        
        defs.appendChild(doneGradient);
        defs.appendChild(receivedGradient);
        svg.appendChild(defs);

        // Create chart group
        const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        chartGroup.setAttribute("transform", `translate(${centerX}, ${centerY})`);

        // Calculate ratios
        const total = done + received;
        if (total === 0) {
            container.innerHTML = '<p class="text-muted">No audit data available</p>';
            return;
        }

        const doneRatio = done / total;
        const doneAngle = doneRatio * Math.PI * 2;
        const receivedAngle = Math.PI * 2 - doneAngle;

        // Create slices
        if (doneRatio > 0) {
            const doneSlice = createDonutSlice(0, doneAngle, radius, innerRadius, "url(#doneGradient)");
            chartGroup.appendChild(doneSlice);
        }

        if (1 - doneRatio > 0) {
            const receivedSlice = createDonutSlice(doneAngle, Math.PI * 2, radius, innerRadius, "url(#receivedGradient)");
            chartGroup.appendChild(receivedSlice);
        }

        // Add center text
        const ratio = (done / received).toFixed(1);
        addCenterText(chartGroup, ratio);

        // Add legend
        addLegend(chartGroup, done, received, radius);

        svg.appendChild(chartGroup);
        container.appendChild(svg);
    };

    const createGradient = (id, color1, color2) => {
        const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        gradient.setAttribute("id", id);
        gradient.setAttribute("x1", "0%");
        gradient.setAttribute("y1", "0%");
        gradient.setAttribute("x2", "100%");
        gradient.setAttribute("y2", "100%");

        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", color1);

        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", color2);

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        return gradient;
    };

    const createDonutSlice = (startAngle, endAngle, outerRadius, innerRadius, fillColor) => {
        const startOuterX = Math.cos(startAngle - Math.PI / 2) * outerRadius;
        const startOuterY = Math.sin(startAngle - Math.PI / 2) * outerRadius;
        const endOuterX = Math.cos(endAngle - Math.PI / 2) * outerRadius;
        const endOuterY = Math.sin(endAngle - Math.PI / 2) * outerRadius;
        const startInnerX = Math.cos(startAngle - Math.PI / 2) * innerRadius;
        const startInnerY = Math.sin(startAngle - Math.PI / 2) * innerRadius;
        const endInnerX = Math.cos(endAngle - Math.PI / 2) * innerRadius;
        const endInnerY = Math.sin(endAngle - Math.PI / 2) * innerRadius;

        const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
        
        const slice = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = [
            `M ${startOuterX} ${startOuterY}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuterX} ${endOuterY}`,
            `L ${endInnerX} ${endInnerY}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInnerX} ${startInnerY}`,
            'Z'
        ].join(' ');

        slice.setAttribute("d", d);
        slice.setAttribute("fill", fillColor);
        return slice;
    };

    const addCenterText = (group, ratio) => {
        const centerText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        centerText.setAttribute("x", "0");
        centerText.setAttribute("y", "-10");
        centerText.setAttribute("text-anchor", "middle");
        centerText.setAttribute("fill", "#00f5ff");
        centerText.setAttribute("font-size", "24px");
        centerText.textContent = ratio;

        const subText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        subText.setAttribute("x", "0");
        subText.setAttribute("y", "20");
        subText.setAttribute("text-anchor", "middle");
        subText.setAttribute("fill", "#a0aec0");
        subText.setAttribute("font-size", "14px");
        subText.textContent = "Done/Received";

        group.appendChild(centerText);
        group.appendChild(subText);
    };

    const addLegend = (group, done, received, radius) => {
        const legendGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        legendGroup.setAttribute("transform", `translate(0, ${radius + 40})`);

        // Done legend
        const doneLegend = createLegendItem(-100, "Done", done, "#00f5ff");
        // Received legend
        const receivedLegend = createLegendItem(20, "Received", received, "#8a2be2");

        legendGroup.appendChild(doneLegend);
        legendGroup.appendChild(receivedLegend);
        group.appendChild(legendGroup);
    };

    const createLegendItem = (x, label, value, color) => {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("transform", `translate(${x}, 0)`);

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", "12");
        rect.setAttribute("height", "12");
        rect.setAttribute("fill", color);
        rect.setAttribute("rx", "2");

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "20");
        text.setAttribute("y", "10");
        text.setAttribute("fill", "#e0e0e0");
        text.setAttribute("font-size", "12px");
        text.textContent = `${label} (${value})`;

        group.appendChild(rect);
        group.appendChild(text);
        return group;
    };

    return {
        createXPChart,
        createAuditChart
    };
};