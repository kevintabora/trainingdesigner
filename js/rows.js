        function initializeColumnState() {
            const tables = document.querySelectorAll('.day-table');
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    // "Plan" is the 12th column
                    const planCell = row.querySelector('td:nth-child(12), th:nth-child(12)');
                    // "Notes" is the 13th column
                    const notesCell = row.querySelector('td:nth-child(13), th:nth-child(13)');

                    if (planCell) {
                        planCell.style.display = arePlannerColumnsHidden ? 'none' : 'table-cell';
                    }
                    if (notesCell) {
                        notesCell.style.display = 'none'; // Notes always hidden initially
                    }
                });
            });
        }

        function updateGroupStyles() {
            const tables = document.querySelectorAll('.day-table');

            tables.forEach(table => {
                const rows = table.querySelectorAll('tbody tr');

                // Reset all borders to default
                rows.forEach(row => {
                    row.querySelectorAll('td').forEach(cell => {
                        cell.style.borderBottom = '2px solid var(--tr-racing-green)';
                    });
                });

                rows.forEach((row, index) => {
                    const currentChapter = row.cells[2].textContent;
                    const currentModule = row.cells[3].textContent;

                    // Skip break rows
                    if (currentChapter.toLowerCase() === 'break') return;

                    // Check previous row
                    if (index > 0) {
                        const prevRow = rows[index - 1];
                        const prevChapter = prevRow.cells[1].textContent;
                        const prevModule = prevRow.cells[2].textContent;

                        if (prevChapter.toLowerCase() === 'break') return;

                        if (currentChapter === prevChapter && currentModule === prevModule) {
                            // Set previous row's bottom border to dashed
                            prevRow.querySelectorAll('td').forEach(cell => {
                                cell.style.borderBottom = '1px dashed rgba(159, 159, 159, .8)';
                            });
                        }
                    }

                    // Check next row
                    if (index < rows.length - 1) {
                        const nextRow = rows[index + 1];
                        const nextChapter = nextRow.cells[2].textContent;
                        const nextModule = nextRow.cells[3].textContent;

                        if (nextChapter.toLowerCase() === 'break') return;

                        if (currentChapter === nextChapter && currentModule === nextModule) {
                            // Set current row's bottom border to dashed
                            row.querySelectorAll('td').forEach(cell => {
                                cell.style.borderBottom = '1px dashed rgba(159, 159, 159, .8)';
                            });
                        }
                    }
                });
            });
        }

        function showEditingState(rowIndex) {
            const rows = document.querySelectorAll('.day-table tbody tr');
            rows.forEach(row => {
                const actionCell = row.querySelector('.actions-cell');
                if (actionCell && actionCell.dataset.index === String(rowIndex)) {
                    // Store original content
                    actionCell.dataset.originalContent = actionCell.innerHTML;
                    // Replace with "Editing..." text
                    actionCell.innerHTML = '<em><strong>Editing...</strong></em>';
                }
            });
        }

        function restoreActionButtons(rowIndex) {
            const rows = document.querySelectorAll('.day-table tbody tr');
            rows.forEach(row => {
                const actionCell = row.querySelector('.actions-cell');
                if (actionCell && actionCell.dataset.index === rowIndex && actionCell.dataset.originalContent) {
                    actionCell.innerHTML = actionCell.dataset.originalContent;
                    delete actionCell.dataset.originalContent;

                    // Re-enable the restored buttons
                    const buttons = actionCell.querySelectorAll('.edit-btn, .delete-btn');
                    buttons.forEach(button => {
                        button.classList.remove('disabled');
                        button.style.pointerEvents = 'auto';
                        button.style.opacity = '1';
                    });
                }
            });
        }

        function isBreakActivity(activity) {
            const breakFields = [
                'chapter', 'moduleTitle', 'objective', 'cognitiveTask',
                'learnerActivity', 'contentType', 'media'
            ];

            return breakFields.every(field =>
                activity[field] &&
                activity[field].toString().trim().toLowerCase() === 'break'
            );
        }

        // Checkboxes
        function addCheckboxEventListeners() {
            // Header checkbox (select all for day)
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
                    updateMenuButtons(); // Update buttons on header checkbox change
                });
            });

            // Row checkboxes
            document.querySelectorAll('.row-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    updateMenuButtons(); // Update buttons on row checkbox change
                    const day = checkbox.closest('tr').querySelector('td:nth-child(2)').textContent;
                    const dayCheckboxes = Array.from(document.querySelectorAll('.row-checkbox'))
                        .filter(cb => cb.closest('tr').querySelector('td:nth-child(2)').textContent === day);
                    const allChecked = dayCheckboxes.every(cb => cb.checked);
                    const headerCheckbox = document.querySelector(`.day-select-all[data-day="${day}"]`);
                    if (headerCheckbox) {
                        headerCheckbox.checked = allChecked;
                    }
                });
            });
        }

        function updateSelectionTally(selectedCheckboxes) {
            const tally = document.getElementById('selectionTally');
            const tallyCount = document.getElementById('tallyCount');
            const tallyDuration = document.getElementById('tallyDuration');
            const tallyHours = document.getElementById('tallyHours');

            if (selectedCheckboxes.length > 0) {
                let totalMin = 0;
                let removeCount = 0;
                selectedCheckboxes.forEach(cb => {
                    const idx = parseInt(cb.dataset.index);
                    if (!isNaN(idx) && activities[idx]) {
                        if (activities[idx].plan === 'Remove') {
                            removeCount++;
                        } else {
                            totalMin += activities[idx].duration || 0;
                        }
                    }
                });

                let countText = selectedCheckboxes.length + ' SELECTED';
                if (removeCount > 0) {
                    countText += '\n' + removeCount + ' TO REMOVE';
                }
                tallyCount.textContent = countText;

                tallyDuration.textContent = totalMin + ' min';

                const hrs = (totalMin / 60);
                const hrsLabel = hrs <= 1 ? 'hr' : 'hrs';
                const hrsFormatted = hrs % 1 === 0 ? hrs.toFixed(0) : hrs.toFixed(1);
                tallyHours.textContent = hrsFormatted + ' ' + hrsLabel;

                tally.classList.add('visible');
            } else {
                tally.classList.remove('visible');
            }
        }

        function disableActions(disable) {
            const dragHandles = document.querySelectorAll('.drag-handle');
            const deleteButtons = document.querySelectorAll('.delete-btn');

            dragHandles.forEach(handle => {
                handle.style.cursor = disable ? 'not-allowed' : 'pointer';
                handle.onclick = disable ? () => showDialog({type:'info', title:'Editing in Progress', message:'Submit or cancel the current edit before rearranging rows.'}) : null;
            });

            deleteButtons.forEach(button => {
                button.disabled = disable;
                button.onclick = disable ? () => showDialog({type:'info', title:'Editing in Progress', message:'Submit or cancel the current edit before deleting.'}) : null;
            });
        }

        function updateMenuButtons() {
            let selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
            const menuButtonsContainer = document.getElementById('menuButtons');
            const daysDropdownContainer = document.querySelector('#menuButtons .dropdown:has(#daysBtn)');
            const selectAllBtn = document.getElementById('selectAllBtn');
            let manageSelectedDropdown = document.getElementById('manageSelectedDropdown');

            const addCourseBtn = document.getElementById('addCourseBtn');
            const startTimeBtn = document.getElementById('startTimeBtn');
            const daysBtn = document.getElementById('daysBtn');
            const addBreakBtns = document.querySelectorAll('.add-break-btn');
            const actionButtons = document.querySelectorAll('.edit-btn, .delete-btn, .copy-btn, .drag-handle');

            console.log('Initial Selected Checkboxes:', selectedCheckboxes.length);
            console.log('Activities Length:', activities.length);

            if (manageSelectedDropdown) manageSelectedDropdown.remove();

            // Hide Days button if no activities
            if (daysDropdownContainer) {
                daysDropdownContainer.style.display = activities.length > 0 ? '' : 'none';
            }

            // Update Report/Design nav buttons
            const goToReportBtn = document.getElementById('goToReportBtn');
            const goToOutlineBtn = document.getElementById('goToOutlineBtn');
            if (goToReportBtn && goToOutlineBtn) {
                if (activities.length === 0) {
                    goToReportBtn.style.display = 'none';
                    goToOutlineBtn.style.display = 'none';
                } else if (window._updateNavButtons) {
                    window._updateNavButtons();
                }
            }

            if (selectAllBtn) {
                if (activities.length > 0) {
                    selectAllBtn.style.display = '';
                    selectAllBtn.textContent = selectedCheckboxes.length > 0 ? 'Deselect All' : 'Select All';

                    if (!selectAllBtn.dataset.listenerAdded) {
                        selectAllBtn.addEventListener('click', () => {
                            const allCheckboxes = document.querySelectorAll('.row-checkbox');
                            const headerCheckboxes = document.querySelectorAll('.day-select-all');
                            const isDeselect = selectAllBtn.textContent === 'Deselect All'; // Use button text to determine action

                            console.log('Select All Clicked - Is Deselect:', isDeselect);

                            // Set checkbox states explicitly based on button text
                            allCheckboxes.forEach(cb => {
                                const dayContainer = cb.closest('.day-table-container');
                                if (dayContainer && dayContainer.style.display !== 'none') {
                                    cb.checked = !isDeselect; // true for "Select All," false for "Deselect All"
                                }
                            });

                            headerCheckboxes.forEach(headerCb => {
                                const day = headerCb.dataset.day;
                                const dayContainer = document.querySelector(`.day-table-container[data-day="${day}"]`);
                                if (dayContainer && dayContainer.style.display !== 'none') {
                                    const dayCheckboxes = dayContainer.querySelectorAll('.row-checkbox');
                                    headerCb.checked = !isDeselect && dayCheckboxes.length > 0;
                                } else {
                                    headerCb.checked = false;
                                }
                            });

                            selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
                            console.log('Post-Select All Selected Checkboxes:', selectedCheckboxes.length);

                            updateMenuButtons(); // Recursively update menu buttons after state change
                        });
                        selectAllBtn.dataset.listenerAdded = 'true';
                    }
                } else {
                    selectAllBtn.style.display = 'none';
                }
            }

            if (selectedCheckboxes.length > 0) {
                console.log('Adding Manage Selected');
                const newManageSelectedDropdown = document.createElement('div');
                newManageSelectedDropdown.id = 'manageSelectedDropdown';
                newManageSelectedDropdown.className = 'manage-selected-dropdown';

                const manageSelectedBtn = document.createElement('button');
                manageSelectedBtn.id = 'manageSelectedBtn';
                manageSelectedBtn.className = 'menu-button';
                manageSelectedBtn.textContent = 'Manage Selected';

                const dropdownContent = document.createElement('div');
                dropdownContent.id = 'manageSelectedDropdownContent';
                dropdownContent.className = 'manage-selected-dropdown-content hidden';

                const copySelectedBtn = document.createElement('button');
                copySelectedBtn.id = 'copySelectedBtn';
                copySelectedBtn.className = 'menu-button manage-selected-dropdown-item';
                copySelectedBtn.textContent = 'Copy Selected';

                copySelectedBtn.addEventListener('click', async () => {
                    const targetDay = await showDialog({type:'input', title:'Copy Selected', message:'Which day to copy selected rows to?', inputField:true, inputDefault:'', inputType:'number', inputPlaceholder:'Day number', okText:'Copy', cancelText:'Cancel'});
                    if (targetDay && !isNaN(targetDay)) {
                        pushUndo('Copied selected rows');
                        const selectedIndices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.index));
                        const copiedActivities = selectedIndices.map(index => ({
                            ...activities[index],
                            day: parseInt(targetDay)
                        }));
                        const targetDayActivities = activities.filter(a => a.day === parseInt(targetDay));
                        const insertIndex = targetDayActivities.length > 0 ?
                            activities.lastIndexOf(targetDayActivities[targetDayActivities.length - 1]) + 1 :
                            activities.length;
                        activities.splice(insertIndex, 0, ...copiedActivities);
                        saveToLocalStorage();
                        updateProgramDetails();
                        generateReport();
                        restorePlanColumnVisibility();
                        dropdownContent.classList.add('hidden');
                        document.getElementById('manageSelectedBtn').classList.remove('active');
                    } else {
                        dropdownContent.classList.add('hidden');
                        document.getElementById('manageSelectedBtn').classList.remove('active');
                    }
                });

                const moveSelectedBtn = document.createElement('button');
                moveSelectedBtn.id = 'moveSelectedBtn';
                moveSelectedBtn.className = 'menu-button manage-selected-dropdown-item';
                moveSelectedBtn.textContent = 'Move Selected';

                moveSelectedBtn.addEventListener('click', async () => {
                    const targetDay = await showDialog({type:'input', title:'Move Selected', message:'Which day to move selected rows to?', inputField:true, inputDefault:'', inputType:'number', inputPlaceholder:'Day number', okText:'Move', cancelText:'Cancel'});
                    if (targetDay && !isNaN(targetDay)) {
                        pushUndo('Moved selected rows');
                        const targetDayNum = parseInt(targetDay);
                        const selectedIndices = Array.from(selectedCheckboxes)
                            .map(cb => parseInt(cb.dataset.index))
                            .sort((a, b) => a - b);

                        const movedActivities = [];
                        const originalDays = new Set();
                        selectedIndices.forEach(index => {
                            const activity = activities[index];
                            movedActivities.push({ ...activity, day: targetDayNum });
                            originalDays.add(activity.day);
                        });

                        selectedIndices.sort((a, b) => b - a).forEach(index => {
                            activities.splice(index, 1);
                        });

                        const targetDayActivities = activities.filter(a => a.day === targetDayNum);
                        const insertIndex = targetDayActivities.length > 0 ?
                            activities.lastIndexOf(targetDayActivities[targetDayActivities.length - 1]) + 1 :
                            activities.length;
                        activities.splice(insertIndex, 0, ...movedActivities);

                        document.querySelectorAll('.row-checkbox:checked, .day-select-all:checked')
                            .forEach(cb => cb.checked = false);

                        saveToLocalStorage();
                        updateProgramDetails();
                        generateReport();
                        restorePlanColumnVisibility();
                        dropdownContent.classList.add('hidden');
                        document.getElementById('manageSelectedBtn').classList.remove('active');
                    } else {
                        dropdownContent.classList.add('hidden');
                        document.getElementById('manageSelectedBtn').classList.remove('active');
                    }
                });

                const deleteSelectedBtn = document.createElement('button');
                deleteSelectedBtn.id = 'deleteSelectedBtn';
                deleteSelectedBtn.className = 'menu-button manage-selected-dropdown-item';
                deleteSelectedBtn.textContent = 'Delete Selected';

                deleteSelectedBtn.addEventListener('click', async () => {
                    const delSelConfirmed = await showDialog({type:'danger', title:'Delete Selected', message:'Are you sure you want to delete the selected rows?', okText:'Delete', cancelText:'Keep'});
                    if (delSelConfirmed) {
                        pushUndo('Deleted selected rows');
                        const indices = Array.from(selectedCheckboxes)
                            .map(cb => parseInt(cb.dataset.index))
                            .sort((a, b) => b - a);
                        indices.forEach(index => activities.splice(index, 1));
                        saveToLocalStorage();
                        updateProgramDetails();
                        generateReport();
                        restorePlanColumnVisibility();
                        applyBreakVisibility();
                        dropdownContent.classList.add('hidden');
                        document.getElementById('manageSelectedBtn').classList.remove('active');
                    } else {
                        dropdownContent.classList.add('hidden');
                        document.getElementById('manageSelectedBtn').classList.remove('active');
                    }
                });

                dropdownContent.appendChild(copySelectedBtn);
                dropdownContent.appendChild(moveSelectedBtn);
                dropdownContent.appendChild(deleteSelectedBtn);
                newManageSelectedDropdown.appendChild(manageSelectedBtn);
                newManageSelectedDropdown.appendChild(dropdownContent);

                if (daysDropdownContainer) {
                    menuButtonsContainer.insertBefore(newManageSelectedDropdown, daysDropdownContainer);
                    console.log('Manage Selected inserted before Days dropdown container');
                } else {
                    menuButtonsContainer.appendChild(newManageSelectedDropdown);
                    console.log('Manage Selected appended');
                }

                manageSelectedBtn.addEventListener('click', (event) => {
                    const fileDropdown = document.getElementById('fileDropdown');
                    const daysDropdown = document.getElementById('daysDropdown');
                    dropdownContent.classList.toggle('hidden');
                    manageSelectedBtn.classList.toggle('active');
                    if (fileDropdown && !fileDropdown.classList.contains('hidden')) {
                        fileDropdown.classList.add('hidden');
                        document.getElementById('fileBtn').classList.remove('active');
                    }
                    if (daysDropdown && !daysDropdown.classList.contains('hidden')) {
                        daysDropdown.classList.add('hidden');
                        document.getElementById('daysBtn').classList.remove('active');
                    }
                    event.stopPropagation();
                });

                document.removeEventListener('click', outsideClickHandler);
                function outsideClickHandler(event) {
                    if (!newManageSelectedDropdown.contains(event.target)) {
                        dropdownContent.classList.add('hidden');
                        manageSelectedBtn.classList.remove('active');
                    }
                }
                document.addEventListener('click', outsideClickHandler);

                if (addCourseBtn) {
                    addCourseBtn.classList.add('disabled');
                    addCourseBtn.style.pointerEvents = 'none';
                    addCourseBtn.style.opacity = '0.5';
                }

                if (startTimeBtn) {
                    startTimeBtn.classList.add('disabled');
                    startTimeBtn.style.pointerEvents = 'none';
                    startTimeBtn.style.opacity = '0.5';
                }

                addBreakBtns.forEach(btn => {
                    btn.classList.add('disabled');
                    btn.style.pointerEvents = 'none';
                    btn.style.opacity = '0.5';
                });

                actionButtons.forEach(btn => {
                    btn.classList.add('disabled');
                    btn.style.pointerEvents = 'none';
                    btn.style.opacity = '0.5';
                });
            } else {
                if (addCourseBtn) {
                    addCourseBtn.classList.remove('disabled');
                    addCourseBtn.style.pointerEvents = 'auto';
                    addCourseBtn.style.opacity = '1';
                }

                if (startTimeBtn) {
                    startTimeBtn.classList.remove('disabled');
                    startTimeBtn.style.pointerEvents = 'auto';
                    startTimeBtn.style.opacity = '1';
                }

                addBreakBtns.forEach(btn => {
                    btn.classList.remove('disabled');
                    btn.style.pointerEvents = 'auto';
                    btn.style.opacity = '1';
                });

                actionButtons.forEach(btn => {
                    if (!btn.closest('tr')?.classList.contains('highlight')) {
                        btn.classList.remove('disabled');
                        btn.style.pointerEvents = 'auto';
                        btn.style.opacity = '1';
                    }
                });
            }

            // ── Update floating selection tally ──
            updateSelectionTally(selectedCheckboxes);
        }

        function initializeDragAndDrop(table) {
            const sortable = new Sortable(table, {
                group: 'shared-tables', // This allows dragging between tables
                animation: 150,
                handle: '.drag-handle',
                onStart: (evt) => {
                    if (editIndex !== null) {
                        evt.preventDefault();
                        showDialog({type:'info', title:'Editing in Progress', message:'Submit or cancel the current edit before rearranging rows.'});
                    }
                },
                onEnd: (evt) => {
                    const { from, to } = evt;
                    const fromDayContainer = from.closest('.day-table-container');
                    const toDayContainer = to.closest('.day-table-container');

                    if (fromDayContainer && toDayContainer) {
                        const fromDay = parseInt(fromDayContainer.querySelector('.day-header').textContent.split(' ')[1]);
                        const toDay = parseInt(toDayContainer.querySelector('.day-header').textContent.split(' ')[1]);

                        // Update the day value if the item was moved to a different day's table
                        if (fromDay !== toDay) {
                            const movedActivityIndex = parseInt(evt.item.querySelector('.delete-btn').dataset.index);
                            activities[movedActivityIndex].day = toDay;
                        }
                    }

                    // Update all activities order
                    updateActivitiesOrder();
                    saveToLocalStorage();
                    updateProgramDetails();
                    generateReport();
                }
            });
        }

        function updateActivitiesOrder() {
            const newActivities = [];
            document.querySelectorAll('.day-table tbody tr').forEach((row) => {
                const index = parseInt(row.querySelector('.delete-btn').dataset.index);
                newActivities.push(activities[index]);
            });
            activities = newActivities;
        }

        function highlightEditedRow(index) {
            // Remove highlight from all rows
            document.querySelectorAll('.day-table tbody tr').forEach(row => {
                row.classList.remove('highlight');
            });

            // Find and highlight the current row
            const rows = document.querySelectorAll('.day-table tbody tr');
            rows.forEach(row => {
                const actionCell = row.querySelector('.actions-cell');
                if (actionCell && actionCell.dataset.index === String(index)) {
                    row.classList.add('highlight');
                }
            });
        }

        function togglePlannerColumns() {
            arePlannerColumnsHidden = !arePlannerColumnsHidden;
            const plannerBtn = document.getElementById('togglePlannerBtn');
            const scheduleBtn = document.getElementById('toggleScheduleBtn');

            plannerBtn.textContent = arePlannerColumnsHidden ? 'View Planner' : 'Hide Planner';
            plannerBtn.classList.toggle('active', !arePlannerColumnsHidden);

            // If showing planner, hide schedule
            if (!arePlannerColumnsHidden && !areTimeColumnsHidden) {
                toggleScheduleColumns();
            }

            // Handle column visibility directly
            const tables = document.querySelectorAll('.day-table');
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    // "Plan" is the 12th column
                    const planCell = row.querySelector('td:nth-child(12), th:nth-child(12)');
                    if (planCell) {
                        planCell.style.display = arePlannerColumnsHidden ? 'none' : 'table-cell';

                        // Fix header text if this is a header cell
                        if (row.parentNode.tagName.toLowerCase() === 'thead') {
                            planCell.textContent = 'Plan';

                            // Also fix last column (Actions) header text
                            const lastHeaderCell = row.querySelector('th:last-child');
                            if (lastHeaderCell) {
                                lastHeaderCell.textContent = 'Actions';
                            }
                        }
                    }
                });
            });

            // Update reports without regenerating tables
            generateReport();
            restorePlanColumnVisibility();
        }

        function toggleScheduleColumns() {
            areTimeColumnsHidden = !areTimeColumnsHidden;
            const scheduleBtn = document.getElementById('toggleScheduleBtn');
            const plannerBtn = document.getElementById('togglePlannerBtn');

            scheduleBtn.textContent = areTimeColumnsHidden ? 'Show Schedule' : 'Hide Schedule';

            // Toggle active state
            scheduleBtn.classList.toggle('active', !areTimeColumnsHidden);

            // When showing schedule, hide planner (unchanged logic)
            if (!areTimeColumnsHidden && !arePlannerColumnsHidden) {
                arePlannerColumnsHidden = true;
                plannerBtn.classList.remove('active');
                plannerBtn.textContent = 'View Planner';
            }

            const tables = document.querySelectorAll('.day-table');
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    // Toggle "Start" and "End" columns (now 14 and 15)
                    const startTimeCell = row.querySelector('td:nth-child(14), th:nth-child(14)');
                    const endTimeCell = row.querySelector('td:nth-child(15), th:nth-child(15)');
                    // Manage "Plan" column (now 12)
                    const planCell = row.querySelector('td:nth-child(12), th:nth-child(12)');
                    // Ensure "Duration" (11) is always visible
                    const durationCell = row.querySelector('td:nth-child(11), th:nth-child(11)');
                    // Ensure "Notes" (13) is always hidden
                    const notesCell = row.querySelector('td:nth-child(13), th:nth-child(13)');

                    if (startTimeCell && endTimeCell) {
                        startTimeCell.style.display = areTimeColumnsHidden ? 'none' : '';
                        endTimeCell.style.display = areTimeColumnsHidden ? 'none' : '';
                    }

                    // Hide plan column when showing schedule (adjusted to column 12)
                    if (planCell) {
                        planCell.style.display = areTimeColumnsHidden ? (arePlannerColumnsHidden ? 'none' : '') : 'none';
                    }

                    // Ensure Duration is always visible
                    if (durationCell) {
                        durationCell.style.display = ''; // Always visible
                    }

                    // Ensure Notes is always hidden
                    if (notesCell) {
                        notesCell.style.display = 'none'; // Always hidden
                    }
                });
            });
        }


        function handleIncludeSchedule() {
            const dateInput = document.getElementById('startDate');
            const timeInput = document.getElementById('startTime');
            const timeZoneSelect = document.getElementById('timeZone');
            const weekendCheckbox = document.getElementById('includeWeekends');
            const includeSchedule = document.getElementById('includeSchedule');

            const shouldDisable = !includeSchedule.checked;

            console.log('handleIncludeSchedule called, shouldDisable:', shouldDisable);

            // Disable the inputs
            dateInput.disabled = shouldDisable;
            timeInput.disabled = shouldDisable;
            timeZoneSelect.disabled = shouldDisable;
            weekendCheckbox.disabled = shouldDisable;

            // Style the parent containers
            [dateInput, timeInput, timeZoneSelect, weekendCheckbox].forEach(input => {
                const container = input.closest('.time-input-field');
                if (container) {
                    if (shouldDisable) {
                        container.classList.add('disabled');
                        input.style.backgroundColor = 'var(--tr-gray1)';
                        input.style.color = 'var(--tr-gray2)';
                    } else {
                        container.classList.remove('disabled');
                        input.style.backgroundColor = '';
                        input.style.color = '';
                    }
                }
            });
        }

        function restorePlanColumnVisibility() {
            const tables = document.querySelectorAll('.day-table');
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    // "Plan" is the 12th column
                    const planCell = row.querySelector('td:nth-child(12), th:nth-child(12)');
                    // "Duration" is the 11th column (always visible)
                    const durationCell = row.querySelector('td:nth-child(11), th:nth-child(11)');
                    // "Notes" is the 13th column (always hidden)
                    const notesCell = row.querySelector('td:nth-child(13), th:nth-child(13)');

                    // Fix header texts in the header row
                    if (row.parentNode.tagName.toLowerCase() === 'thead') {
                        if (planCell) planCell.textContent = 'Plan';
                        if (durationCell) durationCell.textContent = 'Duration';
                        if (notesCell) notesCell.textContent = 'Notes';

                        // Fix Actions header
                        const actionsHeader = row.querySelector('th:last-child');
                        if (actionsHeader) actionsHeader.textContent = 'Actions';
                    }

                    if (planCell) {
                        planCell.style.display = arePlannerColumnsHidden ? 'none' : 'table-cell';
                    }
                    if (durationCell) {
                        durationCell.style.display = 'table-cell'; // Always visible
                    }
                    if (notesCell) {
                        notesCell.style.display = 'none'; // Always hidden
                    }
                });
            });
        }
