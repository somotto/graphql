export function createXPChart(transactions) {
    const container = document.getElementById("xp-chart")
    container.innerHTML = ""

    // Add time period selector
    const timeSelector = document.createElement("div")
    timeSelector.className = "time-selector"
    timeSelector.innerHTML = `
          <button data-period="1" class="time-button active">1 Month</button>
          <button data-period="3" class="time-button">3 Months</button>
          <button data-period="6" class="time-button">6 Months</button>
          <button data-period="all" class="time-button">All Time</button>
      `
    container.appendChild(timeSelector)

    // Process and filter data based on time period
    function filterDataByPeriod(months) {
        const now = new Date()
        const cutoff = new Date(now.setMonth(now.getMonth() - months))

        return transactions
            .filter((txn) => months === "all" || new Date(txn.createdAt) > cutoff)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .reduce((acc, txn) => {
                const date = new Date(txn.createdAt)
                const lastEntry = acc[acc.length - 1] || { xp: 0 }
                const cumulativeXP = lastEntry.xp + txn.amount

                acc.push({
                    date,
                    xp: cumulativeXP,
                    amount: txn.amount,
                    path: txn.path,
                })
                return acc
            }, [])
    }

    function updateChart(period) {
        const filteredData = filterDataByPeriod(period)

        if (filteredData.length === 0) {
            const chartContainer = document.createElement("div")
            chartContainer.className = "chart-area"
            chartContainer.innerHTML = "<p>No data available for the selected period</p>"

            const oldChart = container.querySelector(".chart-area")
            if (oldChart) {
                container.removeChild(oldChart)
            }
            container.appendChild(chartContainer)
            return
        }

        // Create SVG
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        svg.setAttribute("viewBox", "0 0 800 400")
        svg.style.width = "100%"
        svg.style.height = "100%"

        // Calculate time and XP ranges
        const minDate = new Date(Math.min(...filteredData.map((d) => d.date.getTime())))
        const maxDate = new Date(Math.max(...filteredData.map((d) => d.date.getTime())))
        const maxXP = Math.max(...filteredData.map((d) => d.xp))
        const minXP = 0

        // Chart dimensions
        const chartLeft = 80
        const chartRight = 750
        const chartTop = 50
        const chartBottom = 320
        const chartWidth = chartRight - chartLeft
        const chartHeight = chartBottom - chartTop

        // Scale functions
        const timeRange = maxDate.getTime() - minDate.getTime()
        const xpRange = maxXP - minXP

        function getXPosition(date) {
            const timeOffset = date.getTime() - minDate.getTime()
            return chartLeft + (timeOffset / timeRange) * chartWidth
        }

        function getYPosition(xp) {
            return chartBottom - ((xp - minXP) / xpRange) * chartHeight
        }

        // Add grid and axes
        svg.appendChild(createTimeGridAndAxes(minDate, maxDate, minXP, maxXP, chartLeft, chartRight, chartTop, chartBottom))

        // Create gradient definition
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
        const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")
        gradient.setAttribute("id", "xp-area-gradient")
        gradient.setAttribute("x1", "0%")
        gradient.setAttribute("y1", "0%")
        gradient.setAttribute("x2", "0%")
        gradient.setAttribute("y2", "100%")

        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
        stop1.setAttribute("offset", "0%")
        stop1.setAttribute("stop-color", "#4fd1c5")
        stop1.setAttribute("stop-opacity", "0.4")

        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
        stop2.setAttribute("offset", "100%")
        stop2.setAttribute("stop-color", "#4fd1c5")
        stop2.setAttribute("stop-opacity", "0.1")

        gradient.appendChild(stop1)
        gradient.appendChild(stop2)
        defs.appendChild(gradient)
        svg.appendChild(defs)

        // Add area fill for XP progression
        const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
        let areaPathData = `M${chartLeft},${chartBottom}`

        filteredData.forEach((d) => {
            const x = getXPosition(d.date)
            const y = getYPosition(d.xp)
            areaPathData += ` L${x},${y}`
        })

        areaPathData += ` L${getXPosition(filteredData[filteredData.length - 1].date)},${chartBottom} Z`

        areaPath.setAttribute("d", areaPathData)
        areaPath.setAttribute("fill", "url(#xp-area-gradient)")
        svg.appendChild(areaPath)

        // Add XP progression line
        const xpLine = document.createElementNS("http://www.w3.org/2000/svg", "path")
        const pathData = filteredData
            .map((d, i) => {
                const x = getXPosition(d.date)
                const y = getYPosition(d.xp)
                return `${i === 0 ? "M" : "L"}${x},${y}`
            })
            .join(" ")

        xpLine.setAttribute("d", pathData)
        xpLine.setAttribute("stroke", "#4fd1c5")
        xpLine.setAttribute("stroke-width", "3")
        xpLine.setAttribute("fill", "none")
        svg.appendChild(xpLine)

        // Add data points with tooltips
        filteredData.forEach((d) => {
            const x = getXPosition(d.date)
            const y = getYPosition(d.xp)

            const point = document.createElementNS("http://www.w3.org/2000/svg", "circle")
            point.setAttribute("cx", x)
            point.setAttribute("cy", y)
            point.setAttribute("r", "4")
            point.setAttribute("fill", "#4fd1c5")
            point.setAttribute("stroke", "white")
            point.setAttribute("stroke-width", "2")
            point.setAttribute(
                "data-tooltip",
                `XP: ${d.xp.toLocaleString()}\nGained: +${d.amount}\nDate: ${d.date.toLocaleDateString()}\nProject: ${d.path || "Unknown"}`,
            )
            addPointInteraction(point)
            svg.appendChild(point)
        })

        // Update chart container
        const chartContainer = document.createElement("div")
        chartContainer.className = "chart-area"
        chartContainer.appendChild(svg)

        const oldChart = container.querySelector(".chart-area")
        if (oldChart) {
            container.removeChild(oldChart)
        }
        container.appendChild(chartContainer)
    }

    // Event listeners for time period buttons
    timeSelector.addEventListener("click", (e) => {
        if (e.target.classList.contains("time-button")) {
            timeSelector.querySelectorAll(".time-button").forEach((btn) => btn.classList.remove("active"))
            e.target.classList.add("active")
            updateChart(e.target.dataset.period === "all" ? "all" : Number.parseInt(e.target.dataset.period))
        }
    })

    // Initial render with 1 month period
    updateChart(1)
}

// Helper function to create time-based grid and axes
function createTimeGridAndAxes(minDate, maxDate, minXP, maxXP, chartLeft, chartRight, chartTop, chartBottom) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g")

    // Y-axis (XP) grid lines and labels
    const xpSteps = 5
    for (let i = 0; i <= xpSteps; i++) {
        const xpValue = minXP + (i * (maxXP - minXP)) / xpSteps
        const y = chartBottom - (i * (chartBottom - chartTop)) / xpSteps

        // Grid line
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
        gridLine.setAttribute("x1", chartLeft)
        gridLine.setAttribute("y1", y)
        gridLine.setAttribute("x2", chartRight)
        gridLine.setAttribute("y2", y)
        gridLine.setAttribute("stroke", "#edf2f7")
        gridLine.setAttribute("stroke-width", "1")
        group.appendChild(gridLine)

        // Y-axis label
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text")
        label.setAttribute("x", chartLeft - 10)
        label.setAttribute("y", y)
        label.setAttribute("text-anchor", "end")
        label.setAttribute("dominant-baseline", "middle")
        label.setAttribute("fill", "#718096")
        label.setAttribute("font-size", "12")

        // Format XP values
        if (xpValue >= 1000000) {
            label.textContent = `${(xpValue / 1000000).toFixed(1)}M`
        } else if (xpValue >= 1000) {
            label.textContent = `${Math.round(xpValue / 1000)}k`
        } else {
            label.textContent = Math.round(xpValue).toString()
        }
        group.appendChild(label)
    }

    // X-axis (Time) grid lines and labels
    const timeSteps = 6
    const timeRange = maxDate.getTime() - minDate.getTime()

    for (let i = 0; i <= timeSteps; i++) {
        const timeValue = new Date(minDate.getTime() + (i * timeRange) / timeSteps)
        const x = chartLeft + (i * (chartRight - chartLeft)) / timeSteps

        // Grid line
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
        gridLine.setAttribute("x1", x)
        gridLine.setAttribute("y1", chartTop)
        gridLine.setAttribute("x2", x)
        gridLine.setAttribute("y2", chartBottom)
        gridLine.setAttribute("stroke", "#edf2f7")
        gridLine.setAttribute("stroke-width", "1")
        group.appendChild(gridLine)

        // X-axis label
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text")
        label.setAttribute("x", x)
        label.setAttribute("y", chartBottom + 20)
        label.setAttribute("text-anchor", "middle")
        label.setAttribute("fill", "#718096")
        label.setAttribute("font-size", "12")

        // Format date based on time range
        if (timeRange < 7 * 24 * 60 * 60 * 1000) {
            // Less than a week
            label.textContent = timeValue.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        } else if (timeRange < 365 * 24 * 60 * 60 * 1000) {
            // Less than a year
            label.textContent = timeValue.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        } else {
            label.textContent = timeValue.toLocaleDateString("en-US", { year: "2-digit", month: "short" })
        }
        group.appendChild(label)
    }

    // Add axis labels
    const xAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text")
    xAxisLabel.setAttribute("x", (chartLeft + chartRight) / 2)
    xAxisLabel.setAttribute("y", chartBottom + 50)
    xAxisLabel.setAttribute("text-anchor", "middle")
    xAxisLabel.setAttribute("fill", "#4a5568")
    xAxisLabel.setAttribute("font-size", "14")
    xAxisLabel.setAttribute("font-weight", "600")
    xAxisLabel.textContent = "Time"
    group.appendChild(xAxisLabel)

    const yAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text")
    yAxisLabel.setAttribute("x", 20)
    yAxisLabel.setAttribute("y", (chartTop + chartBottom) / 2)
    yAxisLabel.setAttribute("text-anchor", "middle")
    yAxisLabel.setAttribute("fill", "#4a5568")
    yAxisLabel.setAttribute("font-size", "14")
    yAxisLabel.setAttribute("font-weight", "600")
    yAxisLabel.setAttribute("transform", `rotate(-90, 20, ${(chartTop + chartBottom) / 2})`)
    yAxisLabel.textContent = "Experience Points (XP)"
    group.appendChild(yAxisLabel)

    return group
}

function createLine(data, accessor, color) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    const pathData = data
        .map((d, i) => {
            const x = 50 + (i / (data.length - 1)) * 700
            const y = 350 - accessor(d) * (300 / Math.max(...data.map(accessor)))
            return `${i === 0 ? "M" : "L"}${x},${y}`
        })
        .join(" ")

    path.setAttribute("d", pathData)
    path.setAttribute("stroke", color)
    path.setAttribute("stroke-width", "3")
    path.setAttribute("fill", "none")

    return path
}

function createLegend() {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
    group.innerHTML = `
          <rect x="600" y="20" width="15" height="15" fill="#4fd1c5"/>
          <text x="625" y="33" fill="#2d3748">Your XP</text>
          <rect x="600" y="45" width="15" height="15" fill="#805ad5"/>
          <text x="625" y="58" fill="#2d3748">Average XP</text>
      `
    return group
}

// Tooltip helpers
function showTooltip(event, text) {
    let tooltip = document.getElementById("chart-tooltip")
    if (!tooltip) {
        tooltip = document.createElement("div")
        tooltip.id = "chart-tooltip"
        tooltip.style.position = "absolute"
        tooltip.style.backgroundColor = "rgba(0,0,0,0.8)"
        tooltip.style.color = "white"
        tooltip.style.padding = "8px"
        tooltip.style.borderRadius = "4px"
        tooltip.style.fontSize = "12px"
        tooltip.style.pointerEvents = "none"
        tooltip.style.whiteSpace = "pre-line"
        document.body.appendChild(tooltip)
    }

    tooltip.textContent = text
    tooltip.style.left = event.pageX + 10 + "px"
    tooltip.style.top = event.pageY + 10 + "px"
    tooltip.style.display = "block"
}

function hideTooltip() {
    const tooltip = document.getElementById("chart-tooltip")
    if (tooltip) {
        tooltip.style.display = "none"
    }
}

function addPointInteraction(point) {
    point.addEventListener("mouseenter", (e) => {
        point.setAttribute("r", "6")
        showTooltip(e, point.getAttribute("data-tooltip"))
    })

    point.addEventListener("mouseleave", () => {
        point.setAttribute("r", "4")
        hideTooltip()
    })
}

// Create audit ratio chart
export function createAuditChart(upTotal, downTotal) {
    const container = document.getElementById("audit-chart")
    container.innerHTML = ""

    const total = upTotal + downTotal
    const upPercentage = total > 0 ? (upTotal / total) * 100 : 50
    const downPercentage = total > 0 ? (downTotal / total) * 100 : 50

    // Create SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("viewBox", "0 0 200 200")
    svg.style.width = "150px"
    svg.style.height = "150px"

    // Add up (given) audits arc
    const upArc = document.createElementNS("http://www.w3.org/2000/svg", "path")
    upArc.setAttribute("d", getArcPath(upPercentage, 0))
    upArc.setAttribute("fill", "#4fd1c5")
    svg.appendChild(upArc)

    // Add down (received) audits arc
    const downArc = document.createElementNS("http://www.w3.org/2000/svg", "path")
    downArc.setAttribute("d", getArcPath(downPercentage, upPercentage))
    downArc.setAttribute("fill", "#805ad5")
    svg.appendChild(downArc)

    // Add center circle
    const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    centerCircle.setAttribute("cx", "100")
    centerCircle.setAttribute("cy", "100")
    centerCircle.setAttribute("r", "40")
    centerCircle.setAttribute("fill", "white")
    svg.appendChild(centerCircle)

    container.appendChild(svg)
}

// Helper function to generate arc path
function getArcPath(percentage, offsetPercentage) {
    const centerX = 100
    const centerY = 100
    const radius = 90

    const startAngle = (offsetPercentage / 100) * 2 * Math.PI
    const endAngle = ((offsetPercentage + percentage) / 100) * 2 * Math.PI

    const startX = centerX + radius * Math.cos(startAngle)
    const startY = centerY + radius * Math.sin(startAngle)
    const endX = centerX + radius * Math.cos(endAngle)
    const endY = centerY + radius * Math.sin(endAngle)

    const largeArcFlag = percentage > 50 ? 1 : 0

    return `M ${centerX} ${centerY}
              L ${startX} ${startY}
              A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
              Z`
}

// Create skills radar chart
export function createSkillsChart(skills) {
    const container = document.getElementById("skills-chart")
    container.innerHTML = ""

    if (!skills || skills.length === 0) {
        container.innerHTML = "<p>No skill data available</p>"
        return
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("viewBox", "0 0 500 500")
    svg.style.width = "100%"
    svg.style.height = "100%"

    // Add radar grid
    const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    for (let i = 1; i <= 5; i++) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        circle.setAttribute("cx", "250")
        circle.setAttribute("cy", "250")
        circle.setAttribute("r", i * 40)
        circle.setAttribute("fill", "none")
        circle.setAttribute("stroke", "#edf2f7")
        circle.setAttribute("stroke-width", "1")
        gridGroup.appendChild(circle)
    }
    svg.appendChild(gridGroup)

    // Add axes
    const axesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
    const angleStep = (2 * Math.PI) / skills.length

    skills.forEach((skill, i) => {
        const angle = i * angleStep
        const x = 250 + 200 * Math.cos(angle)
        const y = 250 + 200 * Math.sin(angle)

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
        line.setAttribute("x1", "250")
        line.setAttribute("y1", "250")
        line.setAttribute("x2", x.toString())
        line.setAttribute("y2", y.toString())
        line.setAttribute("stroke", "#cbd5e0")
        line.setAttribute("stroke-width", "1")
        axesGroup.appendChild(line)

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text")
        label.setAttribute("x", (250 + 220 * Math.cos(angle)).toString())
        label.setAttribute("y", (250 + 220 * Math.sin(angle)).toString())
        label.setAttribute("text-anchor", "middle")
        label.setAttribute("dominant-baseline", "middle")
        label.setAttribute("fill", "#4a5568")
        label.setAttribute("font-size", "12")
        label.textContent = skill
        axesGroup.appendChild(label)
    })
    svg.appendChild(axesGroup)

    // Add data polygon (example with random values)
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
    const points = skills
        .map((skill, i) => {
            const angle = i * angleStep
            const value = Math.random() * 4 + 1 
            const x = 250 + value * 40 * Math.cos(angle)
            const y = 250 + value * 40 * Math.sin(angle)
            return `${x},${y}`
        })
        .join(" ")

    polygon.setAttribute("points", points)
    polygon.setAttribute("fill", "rgba(79, 209, 197, 0.4)")
    polygon.setAttribute("stroke", "#4fd1c5")
    polygon.setAttribute("stroke-width", "2")
    svg.appendChild(polygon)

    container.appendChild(svg)
}