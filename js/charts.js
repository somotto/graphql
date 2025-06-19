// Create XP progression line chart
export function createXPChart(transactions) {
    const container = document.getElementById('xp-chart');
    container.innerHTML = '';

    // Process data for chart
    const data = transactions
        .filter(txn => txn.type === 'xp')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((txn, i, arr) => ({
            date: new Date(txn.createdAt),
            xp: arr.slice(0, i + 1).reduce((sum, t) => sum + t.amount, 0)
        }));

    // Create SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('viewBox', `0 0 800 400`);
    svg.style.width = '100%';
    svg.style.height = '100%';

    // Add X axis
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "path");
    xAxis.setAttribute('d', 'M50,350 L750,350');
    xAxis.setAttribute('stroke', '#cbd5e0');
    xAxis.setAttribute('stroke-width', '2');
    svg.appendChild(xAxis);

    // Add Y axis
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "path");
    yAxis.setAttribute('d', 'M50,350 L50,50');
    yAxis.setAttribute('stroke', '#cbd5e0');
    yAxis.setAttribute('stroke-width', '2');
    svg.appendChild(yAxis);

    // Add grid lines
    for (let i = 0; i <= 10; i++) {
        const y = 350 - (i * 30);
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
        gridLine.setAttribute('d', `M50,${y} L750,${y}`);
        gridLine.setAttribute('stroke', '#edf2f7');
        gridLine.setAttribute('stroke-width', '1');
        svg.appendChild(gridLine);
    }

    // Add data points
    const pathData = data.map((d, i) => {
        const x = 50 + (i / (data.length - 1)) * 700;
        const y = 350 - (d.xp / 1000) * 300; // Scale for visualization
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', '#4fd1c5');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', '3');
    svg.appendChild(path);

    container.appendChild(svg);
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