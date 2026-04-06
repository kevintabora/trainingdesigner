        // Design
        function updateProgramDetails() {
            const container = document.getElementById('dayTablesContainer');
            const programDetailsHeader = document.getElementById('programDetailsHeader');
            container.innerHTML = '';

            const groupedActivities = {};
            activities.forEach((activity, index) => {
                if (!groupedActivities[activity.day]) {
                    groupedActivities[activity.day] = [];
                }
                groupedActivities[activity.day].push({ ...activity, index });
            });

            const sortedDays = Object.keys(groupedActivities).sort((a, b) => parseInt(a) - parseInt(b));

            // Debug: Log state
            console.log('Sorted Days:', sortedDays);
            console.log('Hidden Days:', hiddenDays);

            sortedDays.forEach(day => {
                const dayActivities = groupedActivities[day];
                const dayContainer = document.createElement('div');
                dayContainer.className = 'day-table-container';
                dayContainer.dataset.day = day;

                const table = document.createElement('table');
                table.className = 'day-table';

                table.innerHTML = `
                    <thead>
                        <tr class="tr-green-header">
                            <th class="checkbox-header"><input type="checkbox" class="day-select-all" data-day="${day}"></th>
                            <th>Day</th>
                            <th>Unit (Main Topic)</th>
                            <th>Module (Subtopic)</th>
                            <th>Learning Objective</th>
                            <th>Cognitive Task</th>
                            <th>Learner Activity</th>
                            <th>Delivery Method</th>
                            <th>Media</th>
                            <th>Type of Content</th>
                            <th>Duration</th>
                            <th class="plan-column" style="${arePlannerColumnsHidden ? 'display: none;' : ''}">Plan</th>
                            <th style="display: none;">Notes</th>
                            <th class="schedule-column" style="${areTimeColumnsHidden ? 'display: none;' : ''}">Start</th>
                            <th class="schedule-column" style="${areTimeColumnsHidden ? 'display: none;' : ''}">End</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;

                const tbody = table.querySelector('tbody');
                let totalDuration = 0;
                let currentTime = defaultStartTime;

                dayActivities.forEach((activityData) => {
                    const activity = activityData;
                    const index = activityData.index;
                    const row = document.createElement('tr');

                    const startTime = activity.plan === 'Remove' ? '--:--' : currentTime;
                    const endTime = activity.plan === 'Remove' ? '--:--' : calculateTime(startTime, activity.duration);
                    if (activity.plan !== 'Remove') {
                        currentTime = endTime;
                    }

                    const isBreak = isBreakActivity(activity);

                    let planClass = 'plan-keep';
                    if (activity.plan === 'Remove') {
                        planClass = 'plan-remove';
                    } else if (activity.plan === 'New Addition') {
                        planClass = 'plan-new';
                    } else if (activity.plan !== 'Keep') {
                        planClass = 'plan-change';
                    }

                    if (isBreak) {
                        row.style.backgroundColor = 'var(--tr-gray1)';
                        row.style.height = '40px';
                        row.innerHTML = `
                            <td class="checkbox-cell"><input type="checkbox" class="row-checkbox" data-index="${index}"></td>
                            <td style="color: #7a8291;">${activity.day}</td>
                            <td style="color: #7a8291;"></td>
                            <td style="color: #7a8291;"></td>
                            <td style="color: #7a8291;"></td>
                            <td style="color: #7a8291;"></td>
                            <td style="color: #7a8291; font-style: italic;">Break</td>
                            <td style="color: #7a8291;"></td>
                            <td style="color: #7a8291;"></td>
                            <td style="color: #7a8291;"></td>
                            <td style="color: #7a8291;">${activity.duration}</td>
                            <td class="${planClass}" style="${arePlannerColumnsHidden ? 'display: none;' : ''}"></td>
                            <td style="display: none;">${activity.notes || ''}</td>
                            <td class="schedule-column" style="color: #7a8291; ${areTimeColumnsHidden ? 'display: none;' : ''}">${startTime}</td>
                            <td class="schedule-column" style="color: #7a8291; ${areTimeColumnsHidden ? 'display: none;' : ''}">${endTime}</td>
                            <td class="actions-cell" data-index="${index}">
                                <div class="action-buttons">
                                    <button class="edit-btn" data-index="${index}" title="Edit">✏️</button>
                                    <button class="copy-btn" data-index="${index}" title="Copy">📋</button>
                                    <button class="delete-btn" data-index="${index}" title="Delete">🗑️</button>
                                    <span class="drag-handle" title="Reorder">☰</span>
                                </div>
                            </td>
                        `;
                    } else {
                        row.innerHTML = `
                            <td class="checkbox-cell"><input type="checkbox" class="row-checkbox" data-index="${index}"></td>
                            <td>${activity.day}</td>
                            <td>${activity.chapter}</td>
                            <td>${activity.moduleTitle}</td>
                            <td>${activity.objective}</td>
                            <td>${activity.cognitiveTask}</td>
                            <td>${activity.learnerActivity}</td>
                            <td>${activity.deliveryMethod}</td>
                            <td>${activity.media}</td>
                            <td>${activity.contentType}</td>
                            <td>${activity.duration}</td>
                            <td class="${planClass}" style="${arePlannerColumnsHidden ? 'display: none;' : ''}">${activity.plan || 'Keep'}</td>
                            <td style="display: none;">${activity.notes || ''}</td>
                            <td class="schedule-column" style="${areTimeColumnsHidden ? 'display: none;' : ''}">${startTime}</td>
                            <td class="schedule-column" style="${areTimeColumnsHidden ? 'display: none;' : ''}">${endTime}</td>
                            <td class="actions-cell" data-index="${index}">
                                <div class="action-buttons">
                                    <button class="edit-btn" data-index="${index}" title="Edit">✏️</button>
                                    <button class="copy-btn" data-index="${index}" title="Copy">📋</button>
                                    <button class="delete-btn" data-index="${index}" title="Delete">🗑️</button>
                                    <span class="drag-handle" title="Reorder">☰</span>
                                </div>
                            </td>
                        `;

                        if (activity.link) {
                            row.querySelector('td:nth-child(9)').innerHTML = `<a href="${activity.link}" target="_blank">${activity.media}</a>`;
                        }

                        if (activity.plan === 'Remove') {
                            row.classList.add('remove-row');
                        }

                        if (activity.removeAsPlan || row.classList.contains('remove-row')) {
                            const durationCell = row.querySelector('td:nth-child(11)');
                            if (durationCell) {
                                const originalValue = durationCell.textContent;
                                durationCell.innerHTML = `<span title='Removed from total duration'>${originalValue}</span> ❌`;
                            }
                        }
                    }
                    tbody.appendChild(row);
                    if (activity.plan !== 'Remove') {
                        totalDuration += activity.duration;
                    }
                });

                const breakButtonDiv = document.createElement('div');
                breakButtonDiv.className = 'day-footer';
                breakButtonDiv.style.display = 'flex';
                breakButtonDiv.style.justifyContent = 'space-between';
                breakButtonDiv.style.alignItems = 'center';
                breakButtonDiv.style.padding = '15px 0';

                const addBreakBtn = document.createElement('button');
                addBreakBtn.textContent = '+ Add Break';
                addBreakBtn.className = 'add-break-btn';
                breakButtonDiv.appendChild(addBreakBtn);

                const totalDurationDiv = document.createElement('div');
                const hrs = (totalDuration / 60);
                const hrsLabel = hrs <= 1 ? 'hr' : 'hrs';
                const hrsFormatted = hrs % 1 === 0 ? hrs.toFixed(0) : hrs.toFixed(1);
                totalDurationDiv.textContent = `Total Duration: ${totalDuration} min | ${hrsFormatted} ${hrsLabel}`;
                totalDurationDiv.className = "total-duration";
                breakButtonDiv.appendChild(totalDurationDiv);

                addBreakBtn.addEventListener('click', async () => {
                    const duration = await showDialog({type:'input', title:'Add Break', message:'Enter break duration in minutes.', inputField:true, inputDefault:'15', inputType:'number', inputPlaceholder:'Minutes', okText:'Add', cancelText:'Cancel'});
                    if (duration && !isNaN(duration)) {
                        pushUndo('Added break');
                        const breakActivity = {
                            day: parseInt(day),
                            chapter: 'Break',
                            moduleTitle: 'Break',
                            objective: 'Break',
                            cognitiveTask: 'Break',
                            learnerActivity: 'Break',
                            deliveryMethod: 'Break',
                            media: 'Break',
                            contentType: 'Break',
                            duration: parseInt(duration),
                            isBreak: true,
                            plan: 'Keep'
                        };
                        activities.push(breakActivity);
                        saveToLocalStorage();
                        updateProgramDetails();
                        generateReport();
                        restorePlanColumnVisibility();
                    }
                });

                dayContainer.appendChild(table);
                dayContainer.appendChild(breakButtonDiv);
                container.appendChild(dayContainer);

                if (hiddenDays[day] === true) {
                    dayContainer.style.display = 'none';
                }

                new Sortable(tbody, {
                    handle: '.drag-handle',
                    animation: 150,
                    group: 'shared',
                    onStart: function(evt) {
                        if (editIndex !== null) {
                            evt.preventDefault();
                            showDialog({type:'info', title:'Editing in Progress', message:'Submit or cancel the current edit before rearranging rows.'});
                            return;
                        }
                        document.body.classList.add('dragging');
                    },
                    onEnd: function(evt) {
                        document.body.classList.remove('dragging');
                        pushUndo('Reordered rows');
                        const {from, to} = evt;
                        const fromDayContainer = from.closest('.day-table-container');
                        const toDayContainer = to.closest('.day-table-container');

                        if (fromDayContainer !== toDayContainer) {
                            const movedRow = evt.item;
                            const movedActivityIndex = parseInt(movedRow.querySelector('.delete-btn').dataset.index);
                            const otherRows = Array.from(to.querySelectorAll('tr')).filter(row => row !== movedRow);
                            let targetDay;
                            if (otherRows.length > 0) {
                                targetDay = parseInt(otherRows[0].cells[1].textContent);
                            } else {
                                const allTables = document.querySelectorAll('.day-table');
                                const currentTableIndex = Array.from(allTables).indexOf(to.closest('.day-table'));
                                if (currentTableIndex > 0) {
                                    const prevTable = allTables[currentTableIndex - 1];
                                    const prevDay = parseInt(prevTable.querySelector('tbody tr td:nth-child(2)').textContent);
                                    targetDay = prevDay + 1;
                                } else {
                                    targetDay = parseInt(movedRow.cells[1].textContent);
                                }
                            }
                            activities[movedActivityIndex].day = targetDay;
                            movedRow.cells[1].textContent = targetDay;
                        }

                        const newActivities = [];
                        document.querySelectorAll('.day-table tbody tr').forEach((row) => {
                            const index = parseInt(row.querySelector('.delete-btn').dataset.index);
                            if (!isNaN(index) && activities[index]) {
                                newActivities.push(activities[index]);
                            }
                        });

                        activities = newActivities;
                        saveToLocalStorage();
                        const scrollPosition = window.pageYOffset;
                        updateProgramDetails();
                        generateReport();
                        restorePlanColumnVisibility();
                        updateGroupStyles();
                        window.scrollTo(0, scrollPosition);
                    },
                    ghostClass: 'sortable-ghost',
                    chosenClass: 'sortable-chosen',
                    dragClass: 'sortable-drag',
                    swapThreshold: 0.5,
                    direction: 'vertical',
                    onMove: function(evt) {
                        const targetTable = evt.to;
                        const mouseY = evt.originalEvent.clientY;
                        const tableRect = targetTable.getBoundingClientRect();
                        const threshold = 20;
                        if (mouseY - tableRect.top < threshold) {
                            return 0;
                        }
                    }
                });
            });

            // Hide Design header if all days are hidden
            const allDaysHidden = sortedDays.length > 0 && sortedDays.every(day => hiddenDays[day] === true);
            console.log('All Days Hidden:', allDaysHidden); // Debug
            if (programDetailsHeader) {
                console.log('Design Header Before:', programDetailsHeader.style.display); // Debug
                programDetailsHeader.style.display = allDaysHidden ? 'none' : '';
                console.log('Design Header After:', programDetailsHeader.style.display); // Debug
            } else {
                console.log('Design Header not found'); // Debug
            }

            const daysDropdown = document.getElementById('daysDropdown');
            if (daysDropdown) {
                delete daysDropdown.dataset.populated;
                if (!daysDropdown.classList.contains('hidden')) {
                    populateDaysDropdown();
                }
            }

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', async function(e) {
                    e.preventDefault();
                    if (editIndex !== null) {
                        showDialog({type:'info', title:'Editing in Progress', message:'Submit or cancel the current edit before editing another row.'});
                        return;
                    }
                    const activityIndex = parseInt(this.dataset.index);
                    const activity = activities[activityIndex];
                    if (isBreakActivity(activity)) {
                        const newDuration = await showDialog({type:'input', title:'Edit Break', message:'Enter break duration in minutes.', inputField:true, inputDefault:String(activity.duration), inputType:'number', inputPlaceholder:'Minutes', okText:'Update', cancelText:'Cancel'});
                        if (newDuration && !isNaN(newDuration)) {
                            pushUndo('Edited break duration');
                            activities[activityIndex].duration = parseInt(newDuration);
                            saveToLocalStorage();
                            updateProgramDetails();
                            generateReport();
                        }
                        return;
                    }
                    editIndex = activityIndex;
                    const currentRow = this.closest('tr');
                    const form = document.getElementById('courseInputForm');
                    form.classList.remove('hidden');
                    document.getElementById('day').value = activity.day;
                    document.getElementById('chapter').value = activity.chapter;
                    document.getElementById('moduleTitle').value = activity.moduleTitle;
                    const activitiesHTML = createActivityHTML(1, activity, true);
                    document.getElementById('learningActivities').innerHTML = activitiesHTML;
                    initializeDropdowns();
                    insertFormAfterRow(currentRow);
                    setTimeout(() => {
                        if (form) {
                            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 250);
                    showEditingState(activityIndex);
                    highlightEditedRow(activityIndex);
                    updateFormHeaderAndStyle(true);
                    enterEditMode();
                });
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const row = e.target.closest('tr');
                    const activityIndex = parseInt(e.target.dataset.index);
                    row.classList.add('highlight');
                    const delConfirmed = await showDialog({type:'danger', title:'Delete Activity', message:'Are you sure you want to delete this activity?', okText:'Delete', cancelText:'Keep'});
                    if (delConfirmed) {
                        pushUndo('Deleted activity');
                        activities.splice(activityIndex, 1);
                            saveToLocalStorage();
                            updateProgramDetails();
                            generateReport();
                            toggleVisibility();
                            restorePlanColumnVisibility();
                        } else {
                            row.classList.remove('highlight');
                        }
                });
            });

            document.querySelectorAll('.copy-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    pushUndo('Copied row');
                    const activityIndex = parseInt(this.dataset.index);
                    const originalActivity = activities[activityIndex];
                    const copiedActivity = { ...originalActivity, day: originalActivity.day };
                    activities.splice(activityIndex + 1, 0, copiedActivity);
                    saveToLocalStorage();
                    updateProgramDetails();
                    generateReport();
                    restorePlanColumnVisibility();
                    const row = btn.closest('tr');
                    row.classList.add('editing-row');
                    setTimeout(() => row.classList.remove('editing-row'), 500);
                });
            });

            document.querySelectorAll('.day-select-all').forEach(headerCheckbox => {
                headerCheckbox.addEventListener('change', function() {
                    const day = this.dataset.day;
                    const isChecked = this.checked;
                    document.querySelectorAll('.row-checkbox').forEach(checkbox => {
                        const rowDay = checkbox.closest('tr').querySelector('td:nth-child(2)').textContent;
                        if (rowDay === day) {
                            checkbox.checked = isChecked;
                        }
                    });
                    updateMenuButtons();
                });
            });

            document.querySelectorAll('.row-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    updateMenuButtons();
                    const day = checkbox.closest('tr').querySelector('td:nth-child(2)').textContent;
                    const dayCheckboxes = Array.from(document.querySelectorAll('.row-checkbox'))
                        .filter(cb => cb.closest('tr').querySelector('td:nth-child(2)').textContent === day);
                    const allChecked = dayCheckboxes.every(cb => cb.checked);
                    const headerCheckbox = document.querySelector(`.day-select-all[data-day="${day}"]`);
                    headerCheckbox.checked = allChecked;
                });
            });

            updateGroupStyles();
            toggleVisibility();
            applyBreakVisibility();
            updateMenuButtons();

            const tables = document.querySelectorAll('.day-table');
            tables.forEach(table => {
                const headerRow = table.querySelector('thead tr');
                if (headerRow) {
                    const headers = headerRow.querySelectorAll('th');
                    if (headers.length >= 16) {
                        headers[1].textContent = 'Day';
                        headers[2].textContent = 'Unit (Main Topic)';
                        headers[3].textContent = 'Module (Subtopic)';
                        headers[4].textContent = 'Learning Objective';
                        headers[5].textContent = 'Cognitive Task';
                        headers[6].textContent = 'Learner Activity';
                        headers[7].textContent = 'Delivery Method';
                        headers[8].textContent = 'Media';
                        headers[9].textContent = 'Type of Content';
                        headers[10].textContent = 'Duration';
                        headers[11].textContent = 'Plan';
                        headers[12].textContent = 'Notes';
                        headers[13].textContent = 'Start';
                        headers[14].textContent = 'End';
                        headers[15].textContent = 'Actions';
                    }
                }
            });
        }

        function insertFormAfterRow(row) {
            // Remove existing form row if it exists
            const existingFormRow = document.getElementById('editFormRow');
            if (existingFormRow) {
                existingFormRow.remove();
            }

            // Create new form row
            const formRow = document.createElement('tr');
            formRow.id = 'editFormRow';
            const formCell = document.createElement('td');

            // Calculate total columns based on current visibility settings
            let totalColumns = 16; // Base number of columns including hidden ones

            formCell.colSpan = totalColumns;
            formCell.appendChild(document.getElementById('courseInputForm'));
            formRow.appendChild(formCell);

            // Insert after the selected row
            row.parentNode.insertBefore(formRow, row.nextSibling);
        }

        // Report Generation
        function generateReport() {
            const reportData = {
                cognitive: aggregateData('cognitiveTask'),
                activity: aggregateData('learnerActivity'),
                delivery: aggregateData('deliveryMethod'),
                media: aggregateData('media'),
                content: aggregateData('contentType')
            };

            // Get unique days and sort them
            const days = [...new Set(activities.map(a => a.day))].sort((a, b) => a - b);
            const hasMultipleDays = days.length > 1;

            const lineReportData = {
                cognitive: aggregateLineData('cognitiveTask', days),
                activity: aggregateLineData('learnerActivity', days),
                delivery: aggregateLineData('deliveryMethod', days),
                media: aggregateLineData('media', days),
                content: aggregateLineData('contentType', days)
            };

            // Update numerical tables
            updateNumericalTable('cognitiveTable', reportData.cognitive, { labelHeader: 'Task' });
            updateNumericalTable('activityTable', reportData.activity, { showGroup: true, groupLookupFn: getActivityGroup, labelHeader: 'Activity' });
            updateNumericalTable('deliveryTable', reportData.delivery, { labelHeader: 'Method' });
            updateNumericalTable('mediaTable', reportData.media, { showGroup: true, groupLookupFn: getMediaGroup, labelHeader: 'Media' });
            updateNumericalTable('contentTable', reportData.content, { labelHeader: 'Type' });

            // Update pie charts (unchanged)
            updateChart('cognitivePieChart', reportData.cognitive);
            updateChartWithGroupColors('activityPieChart', aggregateByGroup('learnerActivity', LEARNER_ACTIVITY_GROUPS), LEARNER_ACTIVITY_GROUPS);
            updateChart('deliveryPieChart', reportData.delivery);
            updateChartWithGroupColors('mediaPieChart', aggregateByGroup('media', MEDIA_GROUPS), MEDIA_GROUPS);
            updateChart('contentPieChart', reportData.content);

            // Handle line chart containers visibility
            const lineChartWrappers = document.querySelectorAll('.chart-wrapper:nth-child(3)');
            lineChartWrappers.forEach(wrapper => {
                wrapper.style.display = hasMultipleDays ? 'block' : 'none';
            });

            // Only update line charts if there are multiple days
            if (hasMultipleDays) {
                updateLineChart('cognitiveLineChart', lineReportData.cognitive);
                updateLineChart('activityLineChart', aggregateLineDataByGroup('learnerActivity', LEARNER_ACTIVITY_GROUPS, days));
                updateLineChart('deliveryLineChart', lineReportData.delivery);
                updateLineChart('mediaLineChart', aggregateLineDataByGroup('media', MEDIA_GROUPS, days));
                updateLineChart('contentLineChart', lineReportData.content);
            } else {
                // Destroy existing line charts if they exist
                ['cognitiveLineChart', 'activityLineChart', 'deliveryLineChart',
                'mediaLineChart', 'contentLineChart'].forEach(chartId => {
                    if (charts[chartId]) {
                        charts[chartId].destroy();
                        charts[chartId] = null;
                    }
                });
            }

            // Update Type of Content vs. Cognitive Tasks table (unchanged)
            updateTypeVsCognitiveTable();

            // Initialize checkboxes and toggle buttons (unchanged)
            initializeDayCheckboxes();
            initializeToggleButtons();
        }


        function updateNumericalTable(tableId, data, opts) {
            opts = opts || {};
            var showGroup = opts.showGroup || false;
            var groupLookupFn = opts.groupLookupFn || null;
            var labelHeader = opts.labelHeader || 'Category';

            const table = document.getElementById(tableId);
            const paired = data.labels.map((label, i) => ({ label, value: data.values[i] }));

            let sorted;
            if (showGroup && groupLookupFn) {
                // Calculate group totals so we can rank groups
                const groupTotals = {};
                paired.forEach(({ label, value }) => {
                    const g = groupLookupFn(label);
                    const key = g ? g.label : '';
                    groupTotals[key] = (groupTotals[key] || 0) + value;
                });
                sorted = paired.slice().sort((a, b) => {
                    const gA = groupLookupFn(a.label);
                    const gB = groupLookupFn(b.label);
                    const keyA = gA ? gA.label : '';
                    const keyB = gB ? gB.label : '';
                    // Primary: group total descending
                    const groupDiff = (groupTotals[keyB] || 0) - (groupTotals[keyA] || 0);
                    if (groupDiff !== 0) return groupDiff;
                    // Secondary: individual duration descending
                    return b.value - a.value;
                });
            } else {
                sorted = paired.slice().sort((a, b) => b.value - a.value);
            }

            table.innerHTML = `
                <tr>
                    ${showGroup ? '<th>Group</th>' : ''}
                    <th>${labelHeader}</th>
                    <th>Count</th>
                    <th>Duration</th>
                    <th>Time %</th>
                </tr>
                ${sorted.map(({ label, value }) => {
                    const group = showGroup && groupLookupFn ? groupLookupFn(label) : null;
                    return `
                        <tr>
                            ${showGroup ? `<td>${group ? group.label : ''}</td>` : ''}
                            <td>${label}</td>
                            <td>${data.counts[label]}</td>
                            <td>${value} mins</td>
                            <td>${((value / data.total) * 100).toFixed(1)}%</td>
                        </tr>
                    `;
                }).join('')}
            `;
        }

        function aggregateData(field, filteredActivities = activities) {
            const data = {};
            const counts = {}; // New object to track occurrences
            let total = 0;

            filteredActivities
                .filter(activity => !activity.isBreak && activity.plan !== 'Remove')
                .forEach(activity => {
                    const value = activity[field];
                    data[value] = (data[value] || 0) + activity.duration; // Sum duration
                    counts[value] = (counts[value] || 0) + 1; // Count occurrences
                    total += activity.duration;
                });

            return {
                labels: Object.keys(data),
                values: Object.values(data),
                counts: counts, // New property for occurrence counts
                total: total,
            };
        }

        function aggregateByGroup(field, groups) {
            const groupTotals = {};
            const groupCounts = {};
            let total = 0;

            activities
                .filter(a => !a.isBreak && a.plan !== 'Remove')
                .forEach(activity => {
                    const value = activity[field];
                    let groupLabel = null;
                    for (const group of groups) {
                        if (group.activities.includes(value)) {
                            groupLabel = group.label;
                            break;
                        }
                    }
                    if (!groupLabel) return;
                    groupTotals[groupLabel] = (groupTotals[groupLabel] || 0) + activity.duration;
                    groupCounts[groupLabel] = (groupCounts[groupLabel] || 0) + 1;
                    total += activity.duration;
                });

            const result = { labels: [], values: [], counts: {}, total };
            groups.forEach(group => {
                if (groupTotals[group.label] !== undefined) {
                    result.labels.push(group.label);
                    result.values.push(groupTotals[group.label]);
                    result.counts[group.label] = groupCounts[group.label] || 0;
                }
            });
            return result;
        }

        function updateChartWithGroupColors(chartId, data, groups) {
            const ctx = document.getElementById(chartId).getContext('2d');
            if (charts[chartId]) charts[chartId].destroy();

            const colorMap = {};
            groups.forEach(g => { colorMap[g.label] = g.chartColor; });
            const colors = data.labels.map(label => colorMap[label] || '#888780');

            charts[chartId] = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: colors,
                        borderColor: '#fff',
                        borderWidth: 2,
                    }],
                },
                options: {
                    maintainAspectRatio: false,
                    cutout: '50%',
                    plugins: {
                        legend: makeDonutLegend(),
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    const value = ctx.parsed;
                                    const pct = ((value / data.total) * 100).toFixed(1);
                                    return ` ${value} mins (${pct}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        function aggregateLineData(field, days, filteredActivities = activities) {
            const data = {};
            const categories = new Set();

            // Initialize data structure for each day
            days.forEach(day => {
                data[day] = {};
            });

            // Aggregate total minutes per category per day
            filteredActivities
                .filter(activity => !activity.isBreak && activity.plan !== 'Remove')
                .forEach(activity => {
                    const value = activity[field];
                    const day = activity.day;
                    categories.add(value);
                    if (!data[day][value]) {
                        data[day][value] = 0;
                    }
                    data[day][value] += activity.duration;
                });

            const activeCategories = Array.from(categories).filter(category =>
                days.some(day => (data[day][category] || 0) > 0)
            );
            return {
                labels: days,
                values: activeCategories.map(category => days.map(day => data[day][category] || 0)),
                categories: activeCategories,
            };
        }

        function aggregateLineDataByGroup(field, groups, days) {
            const data = {};
            days.forEach(day => { data[day] = {}; });

            activities
                .filter(a => !a.isBreak && a.plan !== 'Remove')
                .forEach(activity => {
                    const value = activity[field];
                    const day = activity.day;
                    let groupLabel = null;
                    for (const group of groups) {
                        if (group.activities.includes(value)) {
                            groupLabel = group.label;
                            break;
                        }
                    }
                    if (!groupLabel) return;
                    if (!data[day][groupLabel]) data[day][groupLabel] = 0;
                    data[day][groupLabel] += activity.duration;
                });

            const activeGroups = groups.filter(group =>
                days.some(day => (data[day][group.label] || 0) > 0)
            );
            return {
                labels: days,
                values: activeGroups.map(group => days.map(day => data[day][group.label] || 0)),
                categories: activeGroups.map(g => g.label),
                groupColors: activeGroups.map(g => g.chartColor),
            };
        }

        // ── Shared colour palette (30 colours, families interleaved) ──────────
        const CHART_COLORS = [
            '#e9b045', '#0874e3', '#4db299', '#7209b7', '#e34234',
            '#ffbe0b', '#d4792a', '#1d3557', '#8fcb64', '#8338ec',
            '#c71f37', '#bc6c25', '#ff6b35', '#4895ef', '#38b000',
            '#ff006e', '#540b0e', '#006466', '#fb8500', '#5f0f40',
            '#064635', '#023047', '#a8dadc', '#e63946', '#457b9d',
            '#2a9d8f', '#e9c46a', '#f4a261', '#264653', '#9b2335',
        ];

        // ── Shared donut legend config ───────────────────────────────────────
        function makeDonutLegend() {
            return {
                position: 'top',
                labels: {
                    font: { family: "'Plus Jakarta Sans', Clario, sans-serif", size: 12 },
                    boxWidth: 14,
                    padding: 10,
                }
            };
        }

        // ── Group small pie slices into "Other" ──────────────────────────────
        function groupSmallSlices(data, threshold = 4) {
            const total = data.total;
            const paired = data.labels.map((label, i) => ({
                label,
                value: data.values[i],
            })).sort((a, b) => b.value - a.value);

            const shouldGroup = paired.length > 6;
            const main = [];
            const other = [];

            paired.forEach(item => {
                const pct = (item.value / total) * 100;
                if (shouldGroup && pct < threshold) {
                    other.push(item);
                } else {
                    main.push(item);
                }
            });

            return {
                labels: [...main.map(i => i.label), ...(other.length ? ['Other'] : [])],
                values: [...main.map(i => i.value), ...(other.length ? [other.reduce((s, i) => s + i.value, 0)] : [])],
                total,
                counts: data.counts,
                otherItems: other,
            };
        }

        // ── Pie / Donut chart ────────────────────────────────────────────────
        function updateChart(chartId, data, isLineChart = false) {
            const ctx = document.getElementById(chartId).getContext('2d');

            if (charts[chartId]) charts[chartId].destroy();

            if (isLineChart) {
                // Fallback – not normally called this way
                charts[chartId] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: data.labels.map((label, index) => ({
                            label,
                            data: data.values.map((value, i) => value[i]),
                            borderColor: CHART_COLORS[index % CHART_COLORS.length],
                            fill: false,
                        })),
                    },
                    options: { maintainAspectRatio: false },
                });
            } else {
                const processed = groupSmallSlices(data);
                const otherItems = processed.otherItems;

                charts[chartId] = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: processed.labels,
                        datasets: [{
                            data: processed.values,
                            backgroundColor: CHART_COLORS.slice(0, processed.labels.length),
                            borderColor: '#fff',
                            borderWidth: 2,
                        }],
                    },
                    options: {
                        maintainAspectRatio: false,
                        cutout: '50%',
                        plugins: {
                            legend: makeDonutLegend(),
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => {
                                        const value = ctx.parsed;
                                        const percent = ((value / processed.total) * 100).toFixed(1);
                                        if (ctx.label === 'Other' && otherItems.length > 0) {
                                            return [
                                                'Other: ' + percent + '% (' + value + ' mins)',
                                                ...otherItems.map(item => {
                                                    const p = ((item.value / processed.total) * 100).toFixed(1);
                                                    return '  \u2022 ' + item.label + ': ' + p + '% (' + item.value + ' mins)';
                                                }),
                                            ];
                                        }
                                        return ctx.label + ': ' + percent + '% (' + value + ' mins)';
                                    },
                                },
                            },
                        },
                    },
                });
            }
        }

        // ── Line chart with hover-highlight & toggle-legend ──────────────────
        function updateLineChart(chartId, data) {
            const ctx = document.getElementById(chartId).getContext('2d');

            if (charts[chartId]) charts[chartId].destroy();

            charts[chartId] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: data.categories.map((category, index) => {
                        const color = data.groupColors
                            ? data.groupColors[index]
                            : CHART_COLORS[index % CHART_COLORS.length];
                        return {
                            label: category,
                            data: data.values[index],
                            borderColor: color,
                            backgroundColor: color,
                            pointBackgroundColor: color,
                            _originalColor: color,
                            borderWidth: 3,
                            pointRadius: 5,
                            pointHoverRadius: 8,
                            fill: false,
                            tension: 0.1,
                        };
                    }),
                },
                options: {
                    maintainAspectRatio: false,
                    onHover: (event, activeElements, chart) => {
                        if (activeElements.length > 0) {
                            const activeIndex = activeElements[0].datasetIndex;
                            chart.data.datasets.forEach((ds, i) => {
                                const orig = ds._originalColor;
                                ds.borderColor = i === activeIndex ? orig : orig + '26';
                                ds.pointBackgroundColor = i === activeIndex ? orig : orig + '26';
                                ds.borderWidth = i === activeIndex ? 4 : 1.5;
                            });
                        } else {
                            chart.data.datasets.forEach(ds => {
                                ds.borderColor = ds._originalColor;
                                ds.pointBackgroundColor = ds._originalColor;
                                ds.borderWidth = 3;
                            });
                        }
                        chart.update('none');
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Minutes' },
                        },
                        x: {
                            title: { display: true, text: 'Days' },
                        },
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: { family: "'Plus Jakarta Sans', Clario, sans-serif", size: 12 },
                                boxWidth: 14,
                                padding: 8,
                            },
                            onClick: (e, legendItem, legend) => {
                                const index = legendItem.datasetIndex;
                                const ci = legend.chart;
                                if (ci.isDatasetVisible(index)) {
                                    ci.hide(index);
                                    legendItem.hidden = true;
                                } else {
                                    ci.show(index);
                                    legendItem.hidden = false;
                                }
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ctx.dataset.label + ': ' + ctx.parsed.y + ' mins',
                            },
                        },
                    },
                },
            });
        }

        // ── Collapsible chart sections ────────────────────────────────────────


                function updateTypeVsCognitiveTable(filteredActivities = activities) {
            const table = document.getElementById('typeVsCognitiveTable');
            const categories = {
                Information: ['Facts / Concepts', 'Workflow - Operations / Admin / Support'],
                Procedures: ['Procedural - Software / Tools', 'Procedural - Communication Skills'],
                ProblemSolving: ['Problem-Solving - Software / Tools', 'Problem-Solving - Communication Skills']
            };

            const data = {};
            let totalDuration = 0;

            options.cognitiveTasks.forEach(task => {
                data[task] = { Information: 0, Procedures: 0, ProblemSolving: 0 };
            });

            // Filter out break activities AND removed activities before processing
            const validActivities = filteredActivities.filter(activity =>
                !activity.isBreak && activity.plan !== 'Remove'
            );

            validActivities.forEach(activity => {
                const task = activity.cognitiveTask;
                const duration = activity.duration;
                totalDuration += duration;

                if (categories.Information.includes(activity.contentType)) {
                    data[task].Information += duration;
                } else if (categories.Procedures.includes(activity.contentType)) {
                    data[task].Procedures += duration;
                } else if (categories.ProblemSolving.includes(activity.contentType)) {
                    data[task].ProblemSolving += duration;
                }
            });

            table.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
                const task = options.cognitiveTasks[rowIndex];
                const cells = row.querySelectorAll('td');

                const informationPercent = totalDuration > 0 ? ((data[task].Information / totalDuration) * 100).toFixed(1) : 0;
                const proceduresPercent = totalDuration > 0 ? ((data[task].Procedures / totalDuration) * 100).toFixed(1) : 0;
                const problemSolvingPercent = totalDuration > 0 ? ((data[task].ProblemSolving / totalDuration) * 100).toFixed(1) : 0;

                // Apply color coding and text color
                applyCellStyles(cells[1], informationPercent);
                applyCellStyles(cells[2], proceduresPercent);
                applyCellStyles(cells[3], problemSolvingPercent);

                cells[1].textContent = `${informationPercent}%`;
                cells[2].textContent = `${proceduresPercent}%`;
                cells[3].textContent = `${problemSolvingPercent}%`;
            });
        }

        function applyCellStyles(cell, percentage) {
            const { backgroundColor, textColor } = getColorForPercentage(percentage);
            cell.style.backgroundColor = backgroundColor;
            cell.style.color = textColor;
        }

        function getColorForPercentage(percentage) {
            if (percentage == 0) return { backgroundColor: 'transparent', textColor: 'black' };
            if (percentage <= 25) return { backgroundColor: '#ffffcc', textColor: 'black' }; // Light Yellow
            if (percentage <= 50) return { backgroundColor: '#c2e699', textColor: 'black' }; // Light Green
            if (percentage <= 75) return { backgroundColor: '#78c679', textColor: 'black' }; // Medium Green
            return { backgroundColor: '#31a354', textColor: 'white' }; // Bright Green
        }
