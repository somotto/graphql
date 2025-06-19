// Create XP progression line chart
export function createXPChart(transactions) {
    const container = document.getElementById('xp-chart');
    container.innerHTML = '';

    // Add time period selector
    const timeSelector = document.createElement('div');
    timeSelector.className = 'time-selector';
    timeSelector.innerHTML = `
        <button data-period="1" class="time-button active">1 Month</button>
        <button data-period="3" class="time-button">3 Months</button>
        <button data-period="6" class="time-button">6 Months</button>
        <button data-period="all" class="time-button">All Time</button>
    `;
    container.appendChild(timeSelector);

    // Process and filter data based on time period
    function filterDataByPeriod(months) {
        const now = new Date();
        const cutoff = new Date(now.setMonth(now.getMonth() - months));

        return transactions
            .filter(txn => months === 'all' || new Date(txn.createdAt) > cutoff)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .reduce((acc, txn) => {
                const date = new Date(txn.createdAt);
                const lastEntry = acc[acc.length - 1] || { xp: 0 };
                const cumulativeXP = lastEntry.xp + txn.amount;

                acc.push({
                    date,
                    xp: cumulativeXP,
                    amount: txn.amount,
                    path: txn.path
                });
                return acc;
            }, []);
    }

    // Calculate average XP progression
    function calculateAverageXP(data) {
        const totalStudents = 10; // Example value, replace with actual count
        return data.map(d => ({
            ...d,
            averageXP: d.xp / totalStudents
        }));
    }

    function updateChart(period) {
        const filteredData = filterDataByPeriod(period);
        const dataWithAverage = calculateAverageXP(filteredData);

        // Create SVG
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('viewBox', '0 0 800 400');
        svg.style.width = '100%';
        svg.style.height = '100%';

        // Calculate scales based on maximum of both lines
        const maxXP = Math.max(...dataWithAverage.map(d => Math.max(d.xp, d.averageXP)));
        const yScale = 300 / maxXP;

        // Add grid and axes
        svg.appendChild(createGridAndAxes(maxXP));

        // Add area fill for user XP
        const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const userAreaData = dataWithAverage.map((d, i) => {
            const x = 50 + (i / (dataWithAverage.length - 1)) * 700;
            const y = 350 - (d.xp * yScale);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        }).join(' ') + 'L750,350 L50,350 Z';
        
        areaPath.setAttribute('d', userAreaData);
        areaPath.setAttribute('fill', 'url(#xp-line-gradient)');
        areaPath.setAttribute('opacity', '0.3');
        svg.appendChild(areaPath);

        // Add user XP line
        const userLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const userPathData = dataWithAverage.map((d, i) => {
            const x = 50 + (i / (dataWithAverage.length - 1)) * 700;
            const y = 350 - (d.xp * yScale);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        }).join(' ');
        
        userLine.setAttribute('d', userPathData);
        userLine.setAttribute('stroke', '#4fd1c5');
        userLine.setAttribute('stroke-width', '3');
        userLine.setAttribute('fill', 'none');
        svg.appendChild(userLine);

        // Add average XP line
        const avgLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const avgPathData = dataWithAverage.map((d, i) => {
            const x = 50 + (i / (dataWithAverage.length - 1)) * 700;
            const y = 350 - (d.averageXP * yScale);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        }).join(' ');
        
        avgLine.setAttribute('d', avgPathData);
        avgLine.setAttribute('stroke', '#805ad5');
        avgLine.setAttribute('stroke-width', '3');
        avgLine.setAttribute('fill', 'none');
        avgLine.setAttribute('stroke-dasharray', '5,5');
        svg.appendChild(avgLine);

        // Add data points with tooltips
        dataWithAverage.forEach((d, i) => {
            const x = 50 + (i / (dataWithAverage.length - 1)) * 700;
            
            // User XP point
            const userPoint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            const userY = 350 - (d.xp * yScale);
            userPoint.setAttribute('cx', x);
            userPoint.setAttribute('cy', userY);
            userPoint.setAttribute('r', '4');
            userPoint.setAttribute('fill', '#4fd1c5');
            userPoint.setAttribute('data-tooltip', 
                `Your XP: ${d.xp}\nDate: ${d.date.toLocaleDateString()}`
            );
            addPointInteraction(userPoint);
            svg.appendChild(userPoint);

            // Average XP point
            const avgPoint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            const avgY = 350 - (d.averageXP * yScale);
            avgPoint.setAttribute('cx', x);
            avgPoint.setAttribute('cy', avgY);
            avgPoint.setAttribute('r', '4');
            avgPoint.setAttribute('fill', '#805ad5');
            avgPoint.setAttribute('data-tooltip', 
                `Average XP: ${Math.round(d.averageXP)}\nDate: ${d.date.toLocaleDateString()}`
            );
            addPointInteraction(avgPoint);
            svg.appendChild(avgPoint);
        });

        // Add legend
        const legend = createLegend();
        svg.appendChild(legend);

        // Update chart container
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-area';
        chartContainer.appendChild(svg);
        
        const oldChart = container.querySelector('.chart-area');
        if (oldChart) {
            container.removeChild(oldChart);
        }
        container.appendChild(chartContainer);
    }

    // Event listeners for time period buttons
    timeSelector.addEventListener('click', (e) => {
        if (e.target.classList.contains('time-button')) {
            timeSelector.querySelectorAll('.time-button').forEach(btn =>
                btn.classList.remove('active'));
            e.target.classList.add('active');
            updateChart(e.target.dataset.period === 'all' ? 'all' : parseInt(e.target.dataset.period));
        }
    });

    // Initial render with 1 month period
    updateChart(1);
}

// Add these helper functions to create chart components
function createGridAndAxes(maxXP) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Y-axis labels and grid lines
    for (let i = 0; i <= 5; i++) {
        const y = 350 - (i * 60);
        const xpValue = Math.round((i * maxXP / 5) / 1000);

        // Grid line
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
        gridLine.setAttribute('d', `M50,${y} L750,${y}`);
        gridLine.setAttribute('stroke', '#edf2f7');
        gridLine.setAttribute('stroke-width', '1');
        group.appendChild(gridLine);

        // Y-axis label
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute('x', '40');
        label.setAttribute('y', y);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('dominant-baseline', 'middle');
        label.setAttribute('fill', '#718096');
        label.setAttribute('font-size', '12');
        label.textContent = `${xpValue}k`;
        group.appendChild(label);
    }

    return group;
}

function createLine(data, accessor, color) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const pathData = data.map((d, i) => {
        const x = 50 + (i / (data.length - 1)) * 700;
        const y = 350 - (accessor(d) * (300 / Math.max(...data.map(accessor))));
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');

    path.setAttribute('d', pathData);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');

    return path;
}

function createLegend() {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.innerHTML = `
        <rect x="600" y="20" width="15" height="15" fill="#4fd1c5"/>
        <text x="625" y="33" fill="#2d3748">Your XP</text>
        <rect x="600" y="45" width="15" height="15" fill="#805ad5"/>
        <text x="625" y="58" fill="#2d3748">Average XP</text>
    `;
    return group;
}

// Tooltip helpers
function showTooltip(event, text) {
    let tooltip = document.getElementById('chart-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'chart-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = 'rgba(0,0,0,0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.whiteSpace = 'pre-line';
        document.body.appendChild(tooltip);
    }

    tooltip.textContent = text;
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY + 10) + 'px';
    tooltip.style.display = 'block';
}

function hideTooltip() {
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

function addPointInteraction(point) {
    point.addEventListener('mouseenter', (e) => {
        point.setAttribute('r', '6');
        showTooltip(e, point.getAttribute('data-tooltip'));
    });
    
    point.addEventListener('mouseleave', () => {
        point.setAttribute('r', '4');
        hideTooltip();
    });
}

// Create audit ratio chart
export function createAuditChart(upTotal, downTotal) {
    const container = document.getElementById('audit-chart');
    container.innerHTML = '';

    const total = upTotal + downTotal;
    const upPercentage = total > 0 ? (upTotal / total) * 100 : 50;
    const downPercentage = total > 0 ? (downTotal / total) * 100 : 50;

    // Create SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.style.width = '150px';
    svg.style.height = '150px';

    // Add up (given) audits arc
    const upArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    upArc.setAttribute('d', getArcPath(upPercentage, 0));
    upArc.setAttribute('fill', '#4fd1c5');
    svg.appendChild(upArc);

    // Add down (received) audits arc
    const downArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    downArc.setAttribute('d', getArcPath(downPercentage, upPercentage));
    downArc.setAttribute('fill', '#805ad5');
    svg.appendChild(downArc);

    // Add center circle
    const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerCircle.setAttribute('cx', '100');
    centerCircle.setAttribute('cy', '100');
    centerCircle.setAttribute('r', '40');
    centerCircle.setAttribute('fill', 'white');
    svg.appendChild(centerCircle);

    container.appendChild(svg);
}

// Helper function to generate arc path
function getArcPath(percentage, offsetPercentage) {
    const centerX = 100;
    const centerY = 100;
    const radius = 90;

    const startAngle = (offsetPercentage / 100) * 2 * Math.PI;
    const endAngle = ((offsetPercentage + percentage) / 100) * 2 * Math.PI;

    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = percentage > 50 ? 1 : 0;

    return `M ${centerX} ${centerY}
            L ${startX} ${startY}
            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
            Z`;
}

// Create skills radar chart
export function createSkillsChart(skills) {
    const container = document.getElementById('skills-chart');
    container.innerHTML = '';

    if (!skills || skills.length === 0) {
        container.innerHTML = '<p>No skill data available</p>';
        return;
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('viewBox', '0 0 500 500');
    svg.style.width = '100%';
    svg.style.height = '100%';

    // Add radar grid
    const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    for (let i = 1; i <= 5; i++) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute('cx', '250');
        circle.setAttribute('cy', '250');
        circle.setAttribute('r', i * 40);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#edf2f7');
        circle.setAttribute('stroke-width', '1');
        gridGroup.appendChild(circle);
    }
    svg.appendChild(gridGroup);

    // Add axes
    const axesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const angleStep = (2 * Math.PI) / skills.length;

    skills.forEach((skill, i) => {
        const angle = i * angleStep;
        const x = 250 + 200 * Math.cos(angle);
        const y = 250 + 200 * Math.sin(angle);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', '250');
        line.setAttribute('y1', '250');
        line.setAttribute('x2', x.toString());
        line.setAttribute('y2', y.toString());
        line.setAttribute('stroke', '#cbd5e0');
        line.setAttribute('stroke-width', '1');
        axesGroup.appendChild(line);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute('x', (250 + 220 * Math.cos(angle)).toString());
        label.setAttribute('y', (250 + 220 * Math.sin(angle)).toString());
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        label.setAttribute('fill', '#4a5568');
        label.setAttribute('font-size', '12');
        label.textContent = skill;
        axesGroup.appendChild(label);
    });
    svg.appendChild(axesGroup);

    // Add data polygon (example with random values)
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const points = skills.map((skill, i) => {
        const angle = i * angleStep;
        const value = Math.random() * 4 + 1; // Random value between 1-5
        const x = 250 + (value * 40) * Math.cos(angle);
        const y = 250 + (value * 40) * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(79, 209, 197, 0.4)');
    polygon.setAttribute('stroke', '#4fd1c5');
    polygon.setAttribute('stroke-width', '2');
    svg.appendChild(polygon);

    container.appendChild(svg);
}