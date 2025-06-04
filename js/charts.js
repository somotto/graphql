class ChartGenerator {
    static createXPChart(transactions, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !transactions.length) return;

        // Process data for cumulative XP over time
        let cumulativeXP = 0;
        const dataPoints = transactions.map(t => {
            cumulativeXP += t.amount;
            return {
                date: new Date(t.createdAt),
                xp: cumulativeXP
            };
        });

        const width = 600;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Calculate scales
        const maxXP = Math.max(...dataPoints.map(d => d.xp));
        const minDate = new Date(Math.min(...dataPoints.map(d => d.date)));
        const maxDate = new Date(Math.max(...dataPoints.map(d => d.date)));
        const dateRange = maxDate - minDate;

        // Clear previous chart
        container.innerHTML = '';

        // Create SVG elements
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Background
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('width', width);
        bg.setAttribute('height', height);
        bg.setAttribute('fill', '#f8fafc');
        svg.appendChild(bg);

        // Grid lines
        for (let i = 0; i <= 5; i++) {
            const y = margin.top + (chartHeight / 5) * i;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', margin.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - margin.right);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#e2e8f0');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);
        }

        // Create path for line chart
        const pathData = dataPoints.map((point, index) => {
            const x = margin.left + (chartWidth * ((point.date - minDate) / dateRange));
            const y = margin.top + chartHeight - (chartHeight * (point.xp / maxXP));
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', '#2563eb');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);

        // Add data points
        dataPoints.forEach(point => {
            const x = margin.left + (chartWidth * ((point.date - minDate) / dateRange));
            const y = margin.top + chartHeight - (chartHeight * (point.xp / maxXP));

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#2563eb');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '2');
            svg.appendChild(circle);
        });

        // Y-axis labels
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxXP / 5) * (5 - i));
            const y = margin.top + (chartHeight / 5) * i;

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', margin.left - 10);
            text.setAttribute('y', y + 5);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', '#64748b');
            text.textContent = value.toLocaleString();
            svg.appendChild(text);
        }

        container.appendChild(svg);
    }

    static createSuccessChart(results, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !results.length) return;

        // Calculate pass/fail ratio
        const passed = results.filter(r => r.grade > 0).length;
        const failed = results.length - passed;
        const total = results.length;

        if (total === 0) return;

        const passPercentage = (passed / total) * 100;
        const failPercentage = (failed / total) * 100;

        const size = 400;
        const center = size / 2;
        const radius = 120;

        // Clear previous chart
        container.innerHTML = '';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

        // Background circle
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', center);
        bgCircle.setAttribute('cy', center);
        bgCircle.setAttribute('r', radius);
        bgCircle.setAttribute('fill', '#ef4444');
        svg.appendChild(bgCircle);

        // Success arc
        if (passed > 0) {
            const angle = (passPercentage / 100) * 360;
            const radians = (angle - 90) * (Math.PI / 180);
            const x = center + radius * Math.cos(radians);
            const y = center + radius * Math.sin(radians);
            const largeArc = angle > 180 ? 1 : 0;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pathData = [
                `M ${center} ${center - radius}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}`,
                `L ${center} ${center}`,
                'Z'
            ].join(' ');

            path.setAttribute('d', pathData);
            path.setAttribute('fill', '#10b981');
            svg.appendChild(path);
        }

        // Center circle with stats
        const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        innerCircle.setAttribute('cx', center);
        innerCircle.setAttribute('cy', center);
        innerCircle.setAttribute('r', radius * 0.6);
        innerCircle.setAttribute('fill', 'white');
        svg.appendChild(innerCircle);

        // Success percentage text
        const percentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        percentText.setAttribute('x', center);
        percentText.setAttribute('y', center - 10);
        percentText.setAttribute('text-anchor', 'middle');
        percentText.setAttribute('font-size', '32');
        percentText.setAttribute('font-weight', 'bold');
        percentText.setAttribute('fill', '#1e293b');
        percentText.textContent = Math.round(passPercentage) + '%';
        svg.appendChild(percentText);

        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('x', center);
        labelText.setAttribute('y', center + 20);
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('font-size', '14');
        labelText.setAttribute('fill', '#64748b');
        labelText.textContent = 'Success Rate';
        svg.appendChild(labelText);

        // Legend
        const legendY = size - 60;

        // Passed legend
        const passRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        passRect.setAttribute('x', center - 80);
        passRect.setAttribute('y', legendY);
        passRect.setAttribute('width', '15');
        passRect.setAttribute('height', '15');
        passRect.setAttribute('fill', '#10b981');
        svg.appendChild(passRect);

        const passText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        passText.setAttribute('x', center - 60);
        passText.setAttribute('y', legendY + 12);
        passText.setAttribute('font-size', '12');
        passText.setAttribute('fill', '#1e293b');
        passText.textContent = `Passed (${passed})`;
        svg.appendChild(passText);

        // Failed legend
        const failRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        failRect.setAttribute('x', center + 20);
        failRect.setAttribute('y', legendY);
        failRect.setAttribute('width', '15');
        failRect.setAttribute('height', '15');
        failRect.setAttribute('fill', '#ef4444');
        svg.appendChild(failRect);

        const failText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        failText.setAttribute('x', center + 40);
        failText.setAttribute('y', legendY + 12);
        failText.setAttribute('font-size', '12');
        failText.setAttribute('fill', '#1e293b');
        failText.textContent = `Failed (${failed})`;
        svg.appendChild(failText);

        container.appendChild(svg);
    }
}
