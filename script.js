 /* Pure JS Pie Chart Implementation */
 function drawPieChart(canvasId, chartData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.parentElement) {
        console.error(`Canvas element #${canvasId} or parent not found`);
        return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error(`Failed to get 2D context for ${canvasId}`);
        return;
    }

    // --- Canvas Sizing Aspect Ratio Fix --- 
    const container = canvas.parentElement;
    // Use clientWidth because container is now square due to aspect-ratio CSS
    const size = container.clientWidth; 
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas resolution (drawing surface size)
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    
    // Set canvas display size (CSS pixels)
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    
    // Scale context for high-DPI displays
    ctx.scale(dpr, dpr);
    // --- End Fix ---

    const data = chartData.datasets[0].data;
    const colors = chartData.datasets[0].backgroundColor;
    const labels = chartData.labels;
    const total = data.reduce((sum, value) => sum + value, 0);
    let currentAngle = -0.5 * Math.PI; // Start at the top

    // Use the CSS size (size variable) for drawing calculations
    const centerX = size / 2;
    const centerY = size / 2;
    // Adjust radius calculation slightly if needed, 80% of half the size
    const radius = size * 0.4; 

    // Clear canvas before drawing (using CSS size dimensions)
    ctx.clearRect(0, 0, size, size);

    for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) continue; // Skip zero values
        const sliceAngle = (data[i] / total) * 2 * Math.PI;
        const endAngle = currentAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        currentAngle = endAngle;
    }
}

/* Sidebar Navigation */
function openNav() {
    const sidebar = document.getElementById("sidebar");
    const main = document.getElementById("main");
    sidebar.style.width = "250px";
    if (window.innerWidth > 768) {
         main.style.marginLeft = "250px";
    }
}

function closeNav() {
    const sidebar = document.getElementById("sidebar");
    const main = document.getElementById("main");
    sidebar.style.width = "0";
    main.style.marginLeft = "0";
}

// Store dashboard HTML content
const dashboardHtmlContent = `
    <div class="dashboard-page">
        <h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
        
        <div class="summary-container">
            <p>Ringkasan progres pembelajaran Anda:</p>
            
            <div class="chart-container">
                <canvas id="progressChart"></canvas>
            </div>
            
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: rgb(54, 162, 235);"></div>
                    <span>Quiz: 25%</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: rgb(255, 99, 132);"></div>
                    <span>Pertemuan: 33.8%</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: rgb(255, 159, 64);"></div>
                    <span>Materi: 41.3%</span>
                </div>
            </div>
        </div>
        
        <div class="stats-container">
            <div class="stat-card">
                <h3><i class="fas fa-book-reader"></i> Pertemuan Selesai</h3>
                <p>5 dari 14 pertemuan</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: 35.7%;"></div>
                </div>
                <div class="progress-label">
                    <span>Progres:</span>
                    <span>35.7%</span>
                </div>
            </div>
            
            <div class="stat-card">
                <h3><i class="fas fa-clock"></i> Waktu Belajar</h3>
                <p>Total: 12 jam 30 menit</p>
                <p>Rata-rata: 2 jam 30 menit/pertemuan</p>
            </div>
        </div>
    </div>
`;

/* Dynamic Content Loading */
document.addEventListener("DOMContentLoaded", () => {
    const contentContainer = document.getElementById("content-container");
    let resizeTimer;

    // Function to load content
    function loadContent(pageUrl) {
        contentContainer.innerHTML = 
            '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Memuat konten...</div>';
        
        if (pageUrl === "dashboard") {
            contentContainer.innerHTML = dashboardHtmlContent;
            requestAnimationFrame(initializeDashboardChart);
            if (window.innerWidth < 768) {
                closeNav();
            }
        } else {
            fetch(pageUrl)
                .then(response => {
                    if (!response.ok) {
                        console.warn(`Direct fetch failed for ${pageUrl}, trying with 'pertemuan/' prefix.`);
                        const filename = pageUrl.split("/").pop();
                        return fetch("pertemuan/" + filename);
                    }
                    return response;
                })
                .then(response => {
                     if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} for ${response.url}`);
                    }
                    return response.text();
                })
                .then(html => {
                    contentContainer.innerHTML = html;
                    if (window.innerWidth < 768) {
                        closeNav();
                    }
                })
                .catch(error => {
                    console.error("Error loading page: ", error);
                    contentContainer.innerHTML = 
                        `<p>Error loading content from ${pageUrl}. Please check the file path.</p>`;
                });
        }
    }

    /* Custom Chart Initialization (Dashboard) */
    window.initializeDashboardChart = function() {
        const chartCanvasId = "progressChart";
        const chartCanvas = document.getElementById(chartCanvasId);
        if (!chartCanvas || !chartCanvas.parentElement) {
             console.error("Canvas element #progressChart or its parent not found");
            return;
        }
        
        const data = {
            labels: ["Option 1", "Option 2", "Option 3"],
            datasets: [{
                label: "Responses",
                data: [25, 33.8, 41.3],
                backgroundColor: [
                    "rgb(54, 162, 235)", // Blue
                    "rgb(255, 99, 132)",  // Red
                    "rgb(255, 159, 64)"   // Orange
                ],
            }]
        };
        // Ensure chart is drawn after potential layout shifts
        requestAnimationFrame(() => drawPieChart(chartCanvasId, data));
    };

    // Debounced resize handler
    function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (document.getElementById("progressChart")) {
                 // Re-draw chart on resize
                 requestAnimationFrame(initializeDashboardChart);
            }
        }, 250);
    }

    window.addEventListener("resize", handleResize);

    // Load dashboard content by default
    loadContent("dashboard");

    // Add click listeners to sidebar menu items
    const menuItems = document.querySelectorAll(".sidebar .menu-item");
    menuItems.forEach(item => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            const page = item.getAttribute("data-page");
            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            loadContent(page);
        });
    });

    // Set initial active state for dashboard
    const initialActiveItem = document.querySelector('.sidebar .menu-item[data-page="dashboard"]');
    if (initialActiveItem) {
        initialActiveItem.classList.add("active");
    }
});