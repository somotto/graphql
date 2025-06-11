class ChartGenerator {
    static createXPChart(transactions, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !transactions.length) return;

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
    }

    static createAuditDoughnutChart(done, received, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
    
        container.innerHTML = '';
    
        const width = container.clientWidth || 400;
        const height = 300;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 4;
        const innerRadius = radius * 0.6; // Creates the donut hole
        
        const total = done + received;
        if (total === 0) {
            container.innerHTML = '<p style="text-align: center; color: #a0aec0;">No audit data available</p>';
            return;
        }
    
        const doneAngle = (done / total) * Math.PI * 2;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('width', '100%');
    
        // Create donut slices
        const createArc = (startAngle, endAngle, color) => {
            const x1 = centerX + radius * Math.cos(startAngle - Math.PI / 2);
            const y1 = centerY + radius * Math.sin(startAngle - Math.PI / 2);
            const x2 = centerX + radius * Math.cos(endAngle - Math.PI / 2);
            const y2 = centerY + radius * Math.sin(endAngle - Math.PI / 2);
            
            const xi1 = centerX + innerRadius * Math.cos(startAngle - Math.PI / 2);
            const yi1 = centerY + innerRadius * Math.sin(startAngle - Math.PI / 2);
            const xi2 = centerX + innerRadius * Math.cos(endAngle - Math.PI / 2);
            const yi2 = centerY + innerRadius * Math.sin(endAngle - Math.PI / 2);
    
            const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    
            const d = [
                `M ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                `L ${xi2} ${yi2}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${xi1} ${yi1}`,
                'Z'
            ].join(' ');
    
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', color);
            path.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
            path.setAttribute('stroke-width', '1');
            return path;
        };
    
        // Add done slice (left)
        const doneSlice = createArc(0, doneAngle, '#00cc66');
        svg.appendChild(doneSlice);
    
        // Add received slice (right)
        const receivedSlice = createArc(doneAngle, Math.PI * 2, '#0066cc');
        svg.appendChild(receivedSlice);
    
        // Add center values
        const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        centerText.setAttribute('x', centerX);
        centerText.setAttribute('y', centerY);
        centerText.setAttribute('text-anchor', 'middle');
        centerText.setAttribute('dominant-baseline', 'middle');
        centerText.setAttribute('fill', 'white');
        centerText.setAttribute('font-size', '24');
        centerText.textContent = `${Math.round((done / total) * 100)}%`;
        svg.appendChild(centerText);
    
        // Add legend
        const legendY = height - 40;
    
        // Done legend
        const doneLegend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        doneLegend.setAttribute('transform', `translate(${centerX - 100}, ${legendY})`);
        
        const doneRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        doneRect.setAttribute('width', 12);
        doneRect.setAttribute('height', 12);
        doneRect.setAttribute('fill', '#00cc66');
        doneLegend.appendChild(doneRect);
        
        const doneText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        doneText.setAttribute('x', 20);
        doneText.setAttribute('y', 10);
        doneText.setAttribute('fill', 'white');
        doneText.setAttribute('font-size', '12');
        doneText.textContent = `Done: ${done}`;
        doneLegend.appendChild(doneText);
        
        svg.appendChild(doneLegend);
    
        // Received legend
        const receivedLegend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        receivedLegend.setAttribute('transform', `translate(${centerX + 20}, ${legendY})`);
        
        const receivedRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        receivedRect.setAttribute('width', 12);
        receivedRect.setAttribute('height', 12);
        receivedRect.setAttribute('fill', '#0066cc');
        receivedLegend.appendChild(receivedRect);
        
        const receivedText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        receivedText.setAttribute('x', 20);
        receivedText.setAttribute('y', 10);
        receivedText.setAttribute('fill', 'white');
        receivedText.setAttribute('font-size', '12');
        receivedText.textContent = `Received: ${received}`;
        receivedLegend.appendChild(receivedText);
        
        svg.appendChild(receivedLegend);
    
        container.appendChild(svg);
    }
}