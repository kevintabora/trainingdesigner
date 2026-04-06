        // Initialize application
        document.addEventListener('DOMContentLoaded', () => {
            const storedProductName = localStorage.getItem('currentProductName');
            const storedProgramName = localStorage.getItem('currentProgramName');

            if (storedProductName && storedProgramName) {
                currentProductName = storedProductName;
                currentProgramName = storedProgramName;
            }
            updateSectionHeaders();

            initializeTimeZoneSelect();
            updateProgramDetails();
            generateReport();
            toggleVisibility();
            initializeScheduleModalListeners();

            // Name edit modal listeners
            document.getElementById('saveNameEditBtn').addEventListener('click', saveNameEdit);
            document.getElementById('cancelNameEditBtn').addEventListener('click', hideNameEditModal);

            // Set initial column visibility
            document.querySelectorAll('.plan-column').forEach(col => {
                col.style.display = arePlannerColumnsHidden ? 'none' : '';
            });
            document.querySelectorAll('.schedule-column').forEach(col => {
                col.style.display = areTimeColumnsHidden ? 'none' : '';
            });
            document.querySelectorAll('td:nth-child(11), th:nth-child(11)').forEach(col => {
                col.style.display = ''; // Ensure Duration is visible
            });
            document.querySelectorAll('td:nth-child(13), th:nth-child(13)').forEach(col => {
                col.style.display = 'none'; // Ensure Notes is hidden
            });
        });

        // Form handling
        document.getElementById('toggleMenuBtn').addEventListener('click', function() {
            const menuContainer = document.getElementById('menuContainer');
            menuContainer.classList.toggle('menu-collapsed');
            this.classList.toggle('open');
        });

        document.getElementById('addCourseBtn').addEventListener('click', function() {
            // Disable only row-selection checkboxes, not modal checkboxes like includeSchedule
            document.querySelectorAll('input[type="checkbox"].row-checkbox, input[type="checkbox"].day-select-all').forEach(cb => {
                cb.disabled = true;
            });

            // Show the form
            showForm();

            // Scroll to the form section
            window.scrollTo({
                top: 30,
                behavior: 'smooth'
            });
        });

        document.getElementById('resetBtn').addEventListener('click', function() {
            resetActivities();
            const daysDropdown = document.getElementById('daysDropdown');
            delete daysDropdown.dataset.populated;
            daysDropdown.classList.add('hidden');
            document.getElementById('daysBtn').classList.remove('active');
        });

        document.getElementById('addActivityBtn').addEventListener('click', addActivity);
        document.getElementById('courseInputForm').addEventListener('submit', handleSubmit);
        document.getElementById('cancelBtn').addEventListener('click', cancelForm);
        document.addEventListener('click', handleDeleteActivity);

        document.getElementById('saveBtn').addEventListener('click', function() {
            showScheduleModal();
        });
        document.getElementById('loadBtn').addEventListener('click', loadFromFile);
        document.getElementById('resourceBtn').addEventListener('click', function() {
            window.open('guide/index.html', '_blank');
        });
        document.getElementById('templateBtn').addEventListener('click', function() {
            const a = document.createElement('a');
            a.href = 'Training Designer Blank Template.xlsx';
            a.download = 'Training Designer Blank Template.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        document.getElementById('deleteAllBreaksBtn').addEventListener('click', deleteAllBreaks);
        document.getElementById('hideAllBreaksBtn').addEventListener('click', toggleBreakVisibility);
        document.getElementById('toggleScheduleBtn').addEventListener('click', toggleScheduleColumns);
        document.getElementById('startTimeBtn').addEventListener('click', showStartTimeModal);
        document.getElementById('saveStartTimeBtn').addEventListener('click', saveStartTime);
        document.getElementById('cancelStartTimeBtn').addEventListener('click', hideStartTimeModal);
        document.getElementById('togglePlannerBtn').addEventListener('click', togglePlannerColumns);

        document.getElementById('fileBtn').addEventListener('click', function(event) {
            const fileDropdown = document.getElementById('fileDropdown');
            const manageDropdown = document.getElementById('manageSelectedDropdownContent');
            const daysDropdown = document.getElementById('daysDropdown');

            fileDropdown.classList.toggle('hidden');
            this.classList.toggle('active');

            // Close other dropdowns and remove their active state
            if (manageDropdown && !manageDropdown.classList.contains('hidden')) {
                manageDropdown.classList.add('hidden');
                document.getElementById('manageSelectedBtn')?.classList.remove('active');
            }
            if (daysDropdown && !daysDropdown.classList.contains('hidden')) {
                daysDropdown.classList.add('hidden');
                document.getElementById('daysBtn').classList.remove('active');
            }

            event.stopPropagation();
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const fileDropdown = document.getElementById('fileDropdown');
            const fileBtn = document.getElementById('fileBtn');
            const manageDropdown = document.getElementById('manageSelectedDropdownContent');
            const manageBtn = document.getElementById('manageSelectedBtn');
            const daysDropdown = document.getElementById('daysDropdown');
            const daysBtn = document.getElementById('daysBtn');

            if (fileBtn && !fileBtn.contains(event.target) && fileDropdown && !fileDropdown.contains(event.target)) {
                fileDropdown.classList.add('hidden');
                fileBtn.classList.remove('active');
            }

            if (manageBtn && !manageBtn.contains(event.target) && manageDropdown && !manageDropdown.contains(event.target)) {
                manageDropdown.classList.add('hidden');
                manageBtn.classList.remove('active');
            }

            if (daysBtn && !daysBtn.contains(event.target) && daysDropdown && !daysDropdown.contains(event.target)) {
                daysDropdown.classList.add('hidden');
                daysBtn.classList.remove('active');
            }
        });

        // Hide dropdown when a dropdown item is clicked
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function() {
                const dropdown = document.getElementById('fileDropdown');
                dropdown.classList.add('hidden');
            });
        });

        // Days Dropdown
        document.getElementById('daysBtn').addEventListener('click', function(event) {
            const daysDropdown = document.getElementById('daysDropdown');
            const fileDropdown = document.getElementById('fileDropdown');
            const manageDropdown = document.getElementById('manageSelectedDropdownContent');

            // Toggle Days dropdown
            daysDropdown.classList.toggle('hidden');
            this.classList.toggle('active');

            // Close other dropdowns
            if (fileDropdown && !fileDropdown.classList.contains('hidden')) {
                fileDropdown.classList.add('hidden');
                document.getElementById('fileBtn').classList.remove('active');
            }
            if (manageDropdown && !manageDropdown.classList.contains('hidden')) {
                manageDropdown.classList.add('hidden');
                document.getElementById('manageSelectedBtn')?.classList.remove('active');
            }

            // Populate days if not already populated
            if (!daysDropdown.dataset.populated) {
                populateDaysDropdown();
                daysDropdown.dataset.populated = 'true';
            }

            event.stopPropagation();
        });

        function initializeDayCheckboxes() {
            const days = [...new Set(activities.map(a => a.day))].sort((a, b) => a - b);
            const chartBlocks = document.querySelectorAll('.chart-block');

            chartBlocks.forEach(block => {
                const daysContainer = block.querySelector('.days-container');
                daysContainer.innerHTML = days.map(day => `
                    <label class="day-checkbox">
                        <input type="checkbox" value="${day}" checked>
                        Day ${day}
                    </label>
                `).join('');
                daysContainer.classList.add('hidden');

                daysContainer.addEventListener('change', (e) => {
                    const checkedDays = Array.from(daysContainer.querySelectorAll('input:checked'))
                        .map(cb => parseInt(cb.value));

                    const filteredActivities = activities.filter(a => checkedDays.includes(a.day));
                    const headerText = block.querySelector('.chart-header').textContent.trim();

                    const reportConfig = {
                        'Cognitive Task': {
                            field: 'cognitiveTask',
                            tableId: 'cognitiveTable',
                            pieChartId: 'cognitivePieChart',
                            lineChartId: 'cognitiveLineChart'
                        },
                        'Learner Activity': {
                            field: 'learnerActivity',
                            tableId: 'activityTable',
                            pieChartId: 'activityPieChart',
                            lineChartId: 'activityLineChart'
                        },
                        'Delivery Method': {
                            field: 'deliveryMethod',
                            tableId: 'deliveryTable',
                            pieChartId: 'deliveryPieChart',
                            lineChartId: 'deliveryLineChart'
                        },
                        'Media': {
                            field: 'media',
                            tableId: 'mediaTable',
                            pieChartId: 'mediaPieChart',
                            lineChartId: 'mediaLineChart'
                        },
                        'Type of Content': {
                            field: 'contentType',
                            tableId: 'contentTable',
                            pieChartId: 'contentPieChart',
                            lineChartId: 'contentLineChart'
                        }
                    };

                    const config = reportConfig[headerText];

                    if (config) {
                        const reportData = aggregateData(config.field, filteredActivities);
                        updateNumericalTable(config.tableId, reportData);
                        updateChart(config.pieChartId, reportData);

                        const lineReportData = aggregateLineData(config.field, checkedDays, filteredActivities);
                        updateLineChart(config.lineChartId, lineReportData);
                    }

                    if (headerText === 'Type of Content vs. Cognitive Tasks' ||
                        headerText === 'Type of Content') {
                        updateTypeVsCognitiveTable(filteredActivities);
                    }
                });
            });
        }

        function initializeToggleButtons() {
            const chartBlocks = document.querySelectorAll('.chart-block');
            const days = [...new Set(activities.map(a => a.day))].sort((a, b) => a - b);
            const hasMultipleDays = days.length > 1;

            chartBlocks.forEach(block => {
                const toggleBtn = block.querySelector('.toggle-days-btn');
                const daysContainer = block.querySelector('.days-container');

                // Show/hide toggle button based on number of days
                toggleBtn.style.display = hasMultipleDays ? 'block' : 'none';

                // Remove existing event listeners by cloning and replacing the button
                toggleBtn.replaceWith(toggleBtn.cloneNode(true));
                const newToggleBtn = block.querySelector('.toggle-days-btn');

                // Set initial state
                newToggleBtn.textContent = '▶ Show Days';
                daysContainer.classList.add('hidden');

                // Add new event listener only if there are multiple days
                if (hasMultipleDays) {
                    newToggleBtn.addEventListener('click', () => {
                        const isHidden = daysContainer.classList.contains('hidden');
                        daysContainer.classList.toggle('hidden');
                        newToggleBtn.classList.toggle('active');

                        // Update button text and arrow based on visibility state
                        newToggleBtn.textContent = isHidden ? 'Hide Days' : 'Show Days';
                        newToggleBtn.insertAdjacentHTML('afterbegin', isHidden ? '▼ ' : '▶ ');
                    });
                }
            });
        }

        // Add function to disable/enable buttons
        function disableButtonsDuringLoading(disable) {
            const skipIds = ['goToReportBtn', 'goToOutlineBtn', 'undoBtn'];
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                if (skipIds.includes(button.id)) return; // never touch nav scroll buttons
                button.disabled = disable;
                if (disable) {
                    button.style.pointerEvents = 'none';
                    button.style.opacity = '0.5';
                } else {
                    button.style.pointerEvents = 'auto';
                    button.style.opacity = '1';
                }
            });
        }

        window.addEventListener('load', function() {
            // Register the donut centre-text plugin now that Chart.js is loaded
            Chart.register({
                id: 'doughnutCenterText',
                afterDraw(chart) {
                    if (chart.config.type !== 'doughnut') return;
                    const { ctx, data, chartArea } = chart;
                    if (!chartArea) return;
                    const cx = (chartArea.left + chartArea.right) / 2;
                    const cy = (chartArea.top + chartArea.bottom) / 2;
                    const values = data.datasets[0].data;
                    const total = values.reduce((a, b) => a + b, 0);
                    if (total === 0) return;
                    const maxIdx = values.indexOf(Math.max(...values));
                    const dominantLabel = String(data.labels[maxIdx] || '');
                    const pct = ((values[maxIdx] / total) * 100).toFixed(0);

                    // Word-wrap label to fit inside the inner circle
                    const chartRadius = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;
                    const maxTextWidth = chartRadius * 0.88; // fits inside 50% cutout
                    ctx.save();
                    ctx.font = "11px 'Plus Jakarta Sans', Clario, sans-serif";
                    const words = dominantLabel.split(' ');
                    const lines = [];
                    let line = '';
                    for (const word of words) {
                        const test = line ? line + ' ' + word : word;
                        if (ctx.measureText(test).width > maxTextWidth && line) {
                            lines.push(line);
                            line = word;
                        } else {
                            line = test;
                        }
                    }
                    if (line) lines.push(line);

                    // Compute vertical layout: pct on top, label lines below
                    const pctSize = 15;
                    const labelSize = 11;
                    const lineHeight = 14;
                    const gap = 4;
                    const totalH = pctSize + gap + lines.length * lineHeight;
                    let y = cy - totalH / 2 + pctSize / 2;

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = `bold ${pctSize}px 'Plus Jakarta Sans', Clario, sans-serif`;
                    ctx.fillStyle = '#080d16';
                    ctx.fillText(pct + '%', cx, y);

                    ctx.font = `${labelSize}px 'Plus Jakarta Sans', Clario, sans-serif`;
                    ctx.fillStyle = '#6b7280';
                    y += pctSize / 2 + gap;
                    lines.forEach((l, i) => {
                        ctx.fillText(l, cx, y + i * lineHeight + lineHeight / 2);
                    });
                    ctx.restore();
                }
            });
            clearTimeout(loadTimer);
            const loadingOverlay = document.querySelector('.loading-overlay');
            loadingOverlay.style.opacity = '0';
            isLoading = false;
            disableButtonsDuringLoading(false);
            toggleVisibility(); // Re-enforce visibility after loading clears opacity overrides
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        });


        // Show Report ↓ / Design ↑ buttons based on Report section position
        (function() {
            const reportBtn  = document.getElementById('goToReportBtn');
            const outlineBtn = document.getElementById('goToOutlineBtn');
            const reportSection = document.getElementById('programReport');
            if (!reportBtn || !outlineBtn || !reportSection) return;

            function updateNavButtons() {
                const hasData = Array.isArray(activities) && activities.length > 0;
                if (!hasData) {
                    reportBtn.style.display = 'none';
                    outlineBtn.style.display = 'none';
                    return;
                }

                const rect = reportSection.getBoundingClientRect();
                const menuH = document.getElementById('menuContainer').offsetHeight || 52;

                // Report top has scrolled past the menu bar area — user is in the report
                const inReport = rect.top <= menuH + 100;

                if (inReport) {
                    // Always show Design ↑ when in report, regardless of row count
                    reportBtn.style.display = 'none';
                    outlineBtn.style.display = '';
                } else if (activities.length >= 4) {
                    // Only show Report ↓ when there are enough rows to justify it
                    reportBtn.style.display = '';
                    outlineBtn.style.display = 'none';
                } else {
                    // Few rows and not in report — hide both
                    reportBtn.style.display = 'none';
                    outlineBtn.style.display = 'none';
                }
            }

            window.addEventListener('scroll', updateNavButtons, { passive: true });
            updateNavButtons();
            window._updateNavButtons = updateNavButtons;
        })();
