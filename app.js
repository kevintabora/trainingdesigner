        // ══════════════════════════════════════════════════════════════
        // CUSTOM DIALOG SYSTEM
        // ══════════════════════════════════════════════════════════════
        function showDialog(opts) {
            return new Promise(function(resolve) {
                var overlay = document.getElementById('dialogOverlay');
                var icon = document.getElementById('dialogIcon');
                var title = document.getElementById('dialogTitle');
                var msg = document.getElementById('dialogMessage');
                var input = document.getElementById('dialogInput');
                var actions = document.getElementById('dialogActions');
                var type = opts.type || 'info';
                var icons = { info: 'ℹ️', success: '✓', warning: '⚠', danger: '🗑', input: '✏️' };
                var iconClass = { info: 'info', success: 'success', warning: 'warning', danger: 'danger', input: 'input' };
                icon.className = 'dialog-icon ' + (iconClass[type] || 'info');
                icon.textContent = opts.icon || icons[type] || 'ℹ️';
                title.textContent = opts.title || '';
                msg.innerHTML = opts.message || '';
                if (opts.inputField) {
                    input.style.display = '';
                    input.value = opts.inputDefault || '';
                    input.type = opts.inputType || 'text';
                    input.placeholder = opts.inputPlaceholder || '';
                    setTimeout(function() { input.focus(); input.select(); }, 100);
                } else {
                    input.style.display = 'none';
                }
                actions.innerHTML = '';
                if (opts.cancel !== false && type !== 'success' && type !== 'info') {
                    var cancelBtn = document.createElement('button');
                    cancelBtn.className = 'dialog-btn dialog-btn-secondary';
                    cancelBtn.textContent = opts.cancelText || 'Cancel';
                    cancelBtn.onclick = function() { closeDialog(); resolve(opts.inputField ? null : false); };
                    actions.appendChild(cancelBtn);
                }
                var okBtn = document.createElement('button');
                okBtn.className = 'dialog-btn ' + (type === 'danger' ? 'dialog-btn-danger' : 'dialog-btn-primary');
                okBtn.textContent = opts.okText || 'OK';
                okBtn.onclick = function() { closeDialog(); resolve(opts.inputField ? input.value : true); };
                actions.appendChild(okBtn);
                if (opts.inputField) {
                    input.onkeydown = function(e) {
                        if (e.key === 'Enter') okBtn.click();
                        if (e.key === 'Escape') { closeDialog(); resolve(null); }
                    };
                }
                overlay.style.display = 'flex';
                requestAnimationFrame(function() { overlay.classList.add('visible'); });
                if (typeof toggleModalScrollLock === 'function') toggleModalScrollLock(true);
            });
        }
        function closeDialog() {
            var overlay = document.getElementById('dialogOverlay');
            overlay.classList.remove('visible');
            setTimeout(function() { overlay.style.display = 'none'; }, 200);
            if (typeof toggleModalScrollLock === 'function') toggleModalScrollLock(false);
        }

        // ══════════════════════════════════════════════════════════════
        // UNDO SYSTEM
        // ══════════════════════════════════════════════════════════════
        let undoStack = [];

        function pushUndo(label) {
            undoStack.push({
                label: label,
                activities: JSON.parse(JSON.stringify(activities)),
                productName: currentProductName,
                programName: currentProgramName
            });
            if (undoStack.length > 20) undoStack.shift();
            updateUndoButton();
        }
        function performUndo() {
            if (undoStack.length === 0) return;
            if (editIndex !== null) {
                showDialog({type:'warning', title:'Undo Unavailable', message:'Finish or cancel the current edit before undoing.'});
                return;
            }
            var state = undoStack.pop();
            activities = state.activities;
            currentProductName = state.productName;
            currentProgramName = state.programName;
            saveToLocalStorage();
            updateProgramDetails();
            generateReport();
            toggleVisibility();
            restorePlanColumnVisibility();
            updateSectionHeaders();
            updateUndoButton();
        }
        function isFormOpen() {
            var form = document.getElementById('courseInputForm');
            return form && !form.classList.contains('hidden');
        }

        function updateUndoButton() {
            var btn = document.getElementById('undoBtn');
            if (!btn) return;

            // Show button if there are activities OR undo history
            var shouldShow = (Array.isArray(activities) && activities.length > 0) || undoStack.length > 0;

            if (shouldShow) {
                btn.classList.add('undo-visible');
            } else {
                btn.classList.remove('undo-visible', 'has-undo');
                return;
            }

            var formActive = editIndex !== null || isFormOpen();
            if (undoStack.length > 0 && !formActive) {
                btn.classList.add('has-undo');
                btn.title = 'Undo: ' + undoStack[undoStack.length - 1].label + ' (Ctrl+Z)';
            } else {
                btn.classList.remove('has-undo');
                btn.title = formActive ? 'Undo unavailable during editing' : 'Nothing to undo';
            }
        }
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('undoBtn').addEventListener('click', function() {
                if (editIndex !== null || isFormOpen()) {
                    showDialog({type:'warning', title:'Undo Unavailable', message:'Finish or cancel the current edit before undoing.'});
                    return;
                }
                if (undoStack.length > 0) performUndo();
            });
        });
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (editIndex !== null || isFormOpen()) {
                    showDialog({type:'warning', title:'Undo Unavailable', message:'Finish or cancel the current edit before undoing.'});
                    return;
                }
                if (undoStack.length > 0) performUndo();
            }
        });

        const options = {
            cognitiveTasks: [
                'Remember',
                'Explain',
                'Apply',
                'Evaluate',
                'Create'
            ],
            learnerActivities: [
                'Lecture Participation',
                'Workshop',
                'Module Interaction',
                'Watching',
                'Reading',
                'Listening',
                'Navigation Practice',
                'Documentation Practice',
                'Reference/ Job Aids Practice',
                'Interactive Q&A',
                'Recap/ Debrief',
                'Reflection',
                'Live Group Discussion',
                'Asynchronous Group Discussion',
                'Peer Teaching',
                'Role Play/ Mock Call Exercise',
                'Scenario-Based Exercise',
                'Knowledge Check',
                'Written Graded Assessment',
                'Graded Mock Calls',
                'Navigation Assessment',
                'Peer Assessment',
                'Self Assessment',
                'Shadowing/ Observation',
                'Live Customer Practice',
                'Mentorship/ Coaching',
                'Game',
                'Meet & Greet'
            ],
            deliveryMethods: [
                'Instructor-Led',
                'Self-Paced',
                'On-the-Job Training',
                'Microlearning'
            ],
            mediaOptions: [
                'Slideshow',
                'eLearning',
                'Text Document',
                'Spreadsheet',
                'Activity Sheets',
                'Web Article',
                'Graphics',
                'Audio Recording/ Podcast',
                'Recorded Lecture',
                'Produced Instructional Video',
                'Quiz/ Survey',
                'Tool/ Software',
                'Collaborative Platform',
                'Discussion Channel',
                'Online Notebook',
                'Subject Matter Expert',
                'VR/AR'
            ],
            contentTypes: [
                'Facts/ Concepts',
                'Workflow - Operations/ Admin/ Support',
                'Procedural - Software/ Tools',
                'Procedural - Customer Service',
                'Problem-Solving - Software/ Tools',
                'Problem-Solving - Customer Service'
            ], 
            planOptions: [
                'Keep',
                'Remove',
                'Rebrand',
                'Minor Change',
                'Major Update',
                'Merge w/ Below',
                'Add to Above',
                'Split',
                'New Addition'
            ],
        };

        let activities = [];

        let defaultStartTime = '09:00';
        let areTimeColumnsHidden = true;
        let currentProductName = '';
        let currentProgramName = '';

        try {
            const storedActivities = localStorage.getItem('activities');
            if (storedActivities) {
                const parsedActivities = JSON.parse(storedActivities);
                // Validate that the parsed data is an array and has the expected structure
                if (Array.isArray(parsedActivities) && parsedActivities.every(activity => 
                    typeof activity === 'object' && 
                    'day' in activity && 
                    'chapter' in activity && 
                    'moduleTitle' in activity
                )) {
                    activities = parsedActivities;
                } else {
                    // Invalid data structure, clear local storage
                    localStorage.removeItem('activities');
                    activities = [];
                }
            }
        } catch (error) {
            console.error('Error loading activities from localStorage:', error);
            localStorage.removeItem('activities');
            activities = [];
        }

        let charts = {};
        let editIndex = null;
        let arePlannerColumnsHidden = true;
        
        let autoSaveInterval = setInterval(() => {
            if (activities.length > 0) {
                saveToLocalStorage();
            }
        }, 60000); // Auto-save every minute
        
        let isLoading = true;

        let loadTimer = setTimeout(() => {
            const loadingOverlay = document.querySelector('.loading-overlay');
            loadingOverlay.style.opacity = '1';
            disableButtonsDuringLoading(true);
        }, 300);

        let isFilePickerActive = false;
        let hiddenDays = {};
        
        const timeZones = [
            { value: 'UTC-08:00', label: 'UTC-08:00 (US Pacific)' },
            { value: 'UTC-07:00', label: 'UTC-07:00 (US Mountain)' },
            { value: 'UTC-06:00', label: 'UTC-06:00 (US Central)' },
            { value: 'UTC-05:00', label: 'UTC-05:00 (US Eastern)' },
            { value: 'UTC+01:00', label: 'UTC+01:00 (Central Europe)' },
            { value: 'UTC+02:00', label: 'UTC+02:00 (Eastern Europe)' },
            { value: 'UTC+03:00', label: 'UTC+03:00 (Moscow)' },
            { value: 'UTC+05:30', label: 'UTC+05:30 (India)' },
            { value: 'UTC+07:00', label: 'UTC+07:00 (Thailand)' },
            { value: 'UTC+08:00', label: 'UTC+08:00 (Philippines)' },
            { value: 'UTC+09:00', label: 'UTC+09:00 (Japan)' },
            { value: 'UTC+11:00', label: 'UTC+11:00 (New South Wales)' }
        ];

        function updateSectionHeaders() {
            const mainTitle = document.getElementById('programDetailsHeader');
            const reportTitle = document.getElementById('programReportHeader');

            if (currentProductName && currentProgramName) {
                const nameHTML = ' <span class="header-names-wrap"><span id="verticalBar">|</span> <span class="program-label">' + currentProductName + ': ' + currentProgramName + '</span><span class="header-tooltip">Click to edit product and program names</span></span>';
                mainTitle.innerHTML = 'Design' + nameHTML;
                reportTitle.innerHTML = 'Report' + nameHTML;
            } else if (activities.length > 0) {
                const placeholderHTML = ' <span class="header-names-wrap header-names-placeholder"><span id="verticalBar">|</span> <span class="program-label">Product Name: Training Program</span><span class="header-tooltip">Click to set product and program names</span></span>';
                mainTitle.innerHTML = 'Design' + placeholderHTML;
                reportTitle.innerHTML = 'Report' + placeholderHTML;
            } else {
                mainTitle.textContent = 'Design';
                reportTitle.textContent = 'Report';
            }

            // Click to edit names
            document.querySelectorAll('.header-names-wrap').forEach(function(wrap) {
                wrap.addEventListener('click', function() {
                    showNameEditModal();
                });
                // Tooltip positioning
                wrap.addEventListener('mouseenter', function() {
                    var tip = this.querySelector('.header-tooltip');
                    if (!tip) return;
                    tip.classList.remove('tooltip-top');
                    var wrapRect = this.getBoundingClientRect();
                    var tipWidth = tip.offsetWidth || 350;
                    if (wrapRect.right + tipWidth + 20 > window.innerWidth) {
                        tip.classList.add('tooltip-top');
                    }
                });
            });
        }

        function showNameEditModal() {
            document.getElementById('editProductName').value = currentProductName || '';
            document.getElementById('editProgramName').value = currentProgramName || '';
            var modal = document.getElementById('nameEditModal');
            modal.style.display = 'flex';
            toggleModalScrollLock(true);
            document.getElementById('editProductName').focus();
        }

        function hideNameEditModal() {
            document.getElementById('nameEditModal').style.display = 'none';
            toggleModalScrollLock(false);
        }

        function saveNameEdit() {
            var newProduct = document.getElementById('editProductName').value.trim();
            var newProgram = document.getElementById('editProgramName').value.trim();
            pushUndo('Edited program names');
            currentProductName = newProduct;
            currentProgramName = newProgram;
            saveToLocalStorage();
            updateSectionHeaders();
            hideNameEditModal();
        }

        window.addEventListener('beforeunload', function() {
            if (activities.length === 0) {
                localStorage.removeItem('activities');
            }
        });

        // window.addEventListener('scroll', () => {
        //     const fileDropdown = document.getElementById('fileDropdown');
        //     const manageDropdown = document.getElementById('manageSelectedDropdownContent');
            
        //     if (fileDropdown && !fileDropdown.classList.contains('hidden')) {
        //         fileDropdown.classList.add('hidden');
        //     }
        //     if (manageDropdown && !manageDropdown.classList.contains('hidden')) {
        //         manageDropdown.classList.add('hidden');
        //     }
        // });

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
            this.classList.toggle('open'); // Toggle the 'open' class
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
                behavior: 'smooth' // Smooth scrolling effect
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
            this.classList.toggle('active'); // Ensure active class is toggled
            
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

        // Close Days button
        // document.getElementById('closeDaysBtn').addEventListener('click', function() {
        //     const daysDropdown = document.getElementById('daysDropdown');
        //     daysDropdown.classList.add('hidden');
        //     document.getElementById('daysBtn').classList.remove('active');
        // });
        
        // Add this function to calculate time
        function calculateTime(startTime, durationMinutes) {
            const [hours, minutes] = startTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + durationMinutes;
            const newHours = Math.floor(totalMinutes / 60) % 24; // Use modulo 24 to wrap around
            const newMinutes = totalMinutes % 60;
            return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
        }

        function showStartTimeModal() {
            const modal = document.getElementById('startTimeModal');
            document.getElementById('newStartTime').value = defaultStartTime;
            modal.style.display = 'flex';
            toggleModalScrollLock(true);
        }

        function hideStartTimeModal() {
            document.getElementById('startTimeModal').style.display = 'none';
            toggleModalScrollLock(false);
        }

        function saveStartTime() {
            const newTime = document.getElementById('newStartTime').value;
            if (!newTime) {
                showDialog({type:'warning', title:'Invalid Time', message:'Please enter a valid start time.'});
                return;
            }
            pushUndo('Changed start time');
            defaultStartTime = newTime;
            updateProgramDetails();
            restorePlanColumnVisibility()
            hideStartTimeModal();
        }

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

        function getFormattedUTCTimestamp() {
            const now = new Date();
            
            // Get UTC components
            const year = now.getUTCFullYear();
            const month = String(now.getUTCMonth() + 1).padStart(2, '0');
            const day = String(now.getUTCDate()).padStart(2, '0');
            const hours = String(now.getUTCHours()).padStart(2, '0');
            const minutes = String(now.getUTCMinutes()).padStart(2, '0');
            
            return `${year}${month}${day}_${hours}${minutes}Z`;
        }

        function getSafeFileName(str) {
            // Preserve case but replace special characters except hyphens
            return str.replace(/[^a-zA-Z0-9\-]/g, ' ')  // Replace special chars except hyphens with space
                    .split(' ')                         // Split into words
                    .filter(word => word.length > 0)    // Remove empty strings
                    .join('_');                         // Join with single underscore
        }

        function generateFileName(productName, programName, timestamp, isSchedule = false) {
            const safeProduct = getSafeFileName(productName);
            const safeProgram = getSafeFileName(programName);

            saveToLocalStorage();

            return `${safeProduct}__${safeProgram}__${timestamp}${isSchedule ? '_Schedule' : ''}.xlsx`;
        }

        async function saveToFile() {
            // Prevent multiple calls while a file picker is open
            if (isFilePickerActive) {
                console.log('File picker already active, ignoring additional request');
                return;
            }
            
            try {
                if (activities.length === 0) {
                    showDialog({type:'warning', title:'Nothing to Save', message:'Add at least one course before saving.'});
                    return;
                }

                const productName = currentProductName || '';
                const programName = currentProgramName || '';

                const timestamp = getFormattedUTCTimestamp();
                const fileName = generateFileName(productName || 'Unnamed_Product', programName || 'Unnamed_Program', timestamp, false);
                
                isFilePickerActive = true; // Set flag before showing picker
                let handle;

                try {
                    if ('showSaveFilePicker' in window) {
                        handle = await window.showSaveFilePicker({
                            suggestedName: fileName,
                            types: [{
                                description: 'Excel Workbook',
                                accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
                            }],
                        });
                    }
                } catch (pickerError) {
                    // Handle user cancellation or other picker errors
                    if (pickerError.name !== 'AbortError') {
                        console.error('Error with file picker:', pickerError);
                    }
                    isFilePickerActive = false; // Reset flag
                    return; // Return early to prevent further processing
                }

                const wb = XLSX.utils.book_new();
                const ws_data = [];

                // Headers with "Day Order"
                const headers = [
                    'Product', 'Program', 'Day', 'Day Order', 'Unit (Main Topic)', 'Module (Subtopic)',
                    'Learning Objective', 'Cognitive Task', 'Learner Activity', 'Delivery Method',
                    'Media', 'Type of Content', 'Duration', 'Link', 'Plan', 'Notes'
                ];
                ws_data.push(headers);

                // Group and order activities
                const groupedByDay = {};
                activities.forEach((activity, index) => {
                    if (!groupedByDay[activity.day]) groupedByDay[activity.day] = [];
                    groupedByDay[activity.day].push({ ...activity, originalIndex: index });
                });

                Object.keys(groupedByDay).sort((a, b) => Number(a) - Number(b)).forEach(day => {
                groupedByDay[day].forEach((activity, orderIndex) => {
                    ws_data.push([
                        productName,
                        programName,
                        Number(activity.day),
                        orderIndex + 1, // Adding Day Order (1-based index within each day)
                        activity.chapter,
                        activity.moduleTitle,
                        activity.objective,
                        activity.cognitiveTask,
                        activity.learnerActivity,
                        activity.deliveryMethod,
                        activity.media,
                        activity.contentType,
                        activity.duration,
                        activity.link || '',
                        activity.plan || 'Keep',
                        activity.notes || ''
                    ]);
                });
            });

                const ws = XLSX.utils.aoa_to_sheet(ws_data);

                // Add data validation for dropdowns
                if (!ws['!dataValidations']) ws['!dataValidations'] = [];
                const validationColumns = {
                    'G': 'Cognitive Tasks',
                    'H': 'Learner Activities',
                    'I': 'Delivery Methods',
                    'J': 'Media',
                    'K': 'Content Types'
                };
                const optionsData = [
                    ['Cognitive Tasks', 'Learner Activity', 'Delivery Methods', 'Media', 'Type of Content', 'Plan'],
                    ...Array.from({ length: Math.max(
                        options.cognitiveTasks.length,
                        options.learnerActivities.length,
                        options.deliveryMethods.length,
                        options.mediaOptions.length,
                        options.contentTypes.length,
                        options.planOptions.length
                    ) }, (_, i) => [
                        options.cognitiveTasks[i] || '',
                        options.learnerActivities[i] || '',
                        options.deliveryMethods[i] || '',
                        options.mediaOptions[i] || '',
                        options.contentTypes[i] || '',
                        options.planOptions[i] || ''
                    ])
                ];
                const wsOptions = XLSX.utils.aoa_to_sheet(optionsData);

                Object.entries(validationColumns).forEach(([col, listName]) => {
                    ws['!dataValidations'].push({
                        sqref: `${col}2:${col}1048576`,
                        type: 'list',
                        formula1: `=Options!$${String.fromCharCode(65 + Object.values(validationColumns).indexOf(listName))}$2:$${String.fromCharCode(65 + Object.values(validationColumns).indexOf(listName))}$${optionsData.length}`,
                        allowBlank: false,
                        showDropDown: true
                    });
                });

                XLSX.utils.book_append_sheet(wb, ws, "Training Program");
                XLSX.utils.book_append_sheet(wb, wsOptions, "Options");

                const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                if (handle) {
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                } else {
                    XLSX.writeFile(wb, fileName);
                }

                hideScheduleModal();
                showDialog({type:'success', title:'Saved', message:'Your training file has been saved successfully.'});
                updateSectionHeaders();
                
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error saving file:', err);
                    showDialog({type:'danger', title:'Save Error', message:'Something went wrong: ' + err.message});
                }
            } finally {
                isFilePickerActive = false; // Always reset the flag when done
            }
        }

        async function loadFromFile() {
            const confirmed = await showDialog({type:'warning', title:'Load Training Program', message:'Loading a new file will replace everything. Any unsaved progress will be lost.', okText:'Load', cancelText:'Cancel'});
            if (!confirmed) return;

            const wasScheduleVisible = !areTimeColumnsHidden;
            const wasPlannerVisible = !arePlannerColumnsHidden;

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx';

            input.onchange = async e => {
                try {
                    const file = e.target.files[0];
                    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension (e.g., "TrainingProgram.xlsx" -> "TrainingProgram")
                    const reader = new FileReader();

                    reader.onload = async function(event) {
                        try {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                        if (jsonData.length < 2) throw new Error('The file appears to be empty or missing data.');

                        const headers = jsonData[0];
                        const columnIndices = {};
                        headers.forEach((header, i) => {
                            if (typeof header === 'string') {
                                columnIndices[header.trim()] = i;
                            }
                        });

                        // Snapshot current state BEFORE anything changes
                        if (activities.length > 0) pushUndo('Loaded new file');

                        // Extract Product and Program names — keep empty if not in file
                        if (jsonData.length > 1) {
                            const productIndex = columnIndices['Product'];
                            const programIndex = columnIndices['Program'];
                            
                            let productValue = productIndex !== undefined ? String(jsonData[1][productIndex] || '').trim() : '';
                            let programValue = programIndex !== undefined ? String(jsonData[1][programIndex] || '').trim() : '';

                            currentProductName = productValue;
                            currentProgramName = programValue;
                        } else {
                            currentProductName = '';
                            currentProgramName = '';
                        }

                        const dayOrderIndex = headers.indexOf('Day Order');
                        const hasDayOrder = dayOrderIndex !== -1;

                        const requiredHeaders = ['Day', 'Unit (Main Topic)', 'Module (Subtopic)', 'Learning Objective', 
                            'Cognitive Task', 'Learner Activity', 'Delivery Method', 'Media', 'Type of Content', 'Duration'];
                        const optionalHeaders = { 'Link': '', 'Plan': 'Keep', 'Notes': '' };

                        requiredHeaders.forEach(header => {
                            if (columnIndices[header] === undefined) throw new Error(`Required column "${header}" not found.`);
                        });

                        const newActivities = jsonData.slice(1).map((row, index) => {
                            if (!row.length) return null;
                            const activity = {
                                day: parseInt(row[columnIndices['Day']]),
                                chapter: row[columnIndices['Unit (Main Topic)']],
                                moduleTitle: row[columnIndices['Module (Subtopic)']],
                                objective: row[columnIndices['Learning Objective']],
                                cognitiveTask: row[columnIndices['Cognitive Task']],
                                learnerActivity: row[columnIndices['Learner Activity']],
                                deliveryMethod: row[columnIndices['Delivery Method']],
                                media: row[columnIndices['Media']],
                                contentType: row[columnIndices['Type of Content']],
                                duration: parseInt(row[columnIndices['Duration']] || 0),
                                isBreak: String(row[columnIndices['Unit (Main Topic)']]).toLowerCase() === 'break'
                            };
                            Object.entries(optionalHeaders).forEach(([header, defaultValue]) => {
                                activity[header.toLowerCase()] = columnIndices[header] !== undefined ? (row[columnIndices[header]] || defaultValue) : defaultValue;
                            });
                            activity.dayOrder = hasDayOrder && row[dayOrderIndex] ? parseInt(row[dayOrderIndex]) : index + 1;
                            return activity;
                        }).filter(a => a);

                        newActivities.sort((a, b) => {
                            if (a.day !== b.day) return a.day - b.day;
                            return hasDayOrder ? (a.dayOrder - b.dayOrder) : (a.dayOrder - b.dayOrder);
                        });

                        activities = newActivities.map(({ dayOrder, ...rest }) => rest);

                        saveToLocalStorage();
                        updateProgramDetails();
                        generateReport();
                        toggleVisibility();
                        restorePlanColumnVisibility();

                        updateSectionHeaders();

                        if (wasScheduleVisible) toggleScheduleColumns();
                        if (wasPlannerVisible) togglePlannerColumns();

                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        showDialog({type:'success', title:'Loaded', message:'Training data has been imported successfully.'});
                        } catch (loadError) {
                            console.error('Error loading file:', loadError);
                            showDialog({type:'danger', title:'Import Error', message:'The file could not be loaded. Make sure it is a valid .xlsx file with the required column headers (Day, Unit, Module, Learning Objective, etc.).<br><br><strong>Details:</strong> ' + loadError.message});
                        }
                    };

                    reader.readAsArrayBuffer(file);
                } catch (error) {
                    console.error('Error loading file:', error);
                    showDialog({type:'danger', title:'Import Error', message:'The file could not be loaded. Make sure it is a valid .xlsx file with the required column headers (Day, Unit, Module, Learning Objective, etc.).<br><br><strong>Details:</strong> ' + error.message});
                }
            };

            input.click();
        }

        function arraysEqual(a, b) {
            return a.length === b.length && a.every((val, index) => val.trim() === b[index].trim());
        }

        function toggleEditMode(isEditing) {
            const buttons = document.querySelectorAll('.edit-btn, .delete-btn, .drag-handle');
            const addCourseBtn = document.getElementById('addCourseBtn');
            const addActivityBtn = document.getElementById('addActivityBtn');
            const deleteAllBreaksBtn = document.getElementById('deleteAllBreaksBtn'); // Add this line

            if (isEditing) {
                buttons.forEach(button => {
                    button.classList.add('disabled');
                    button.style.pointerEvents = 'none';
                    button.style.opacity = '0.5';
                });
                addCourseBtn.classList.add('disabled');
                deleteAllBreaksBtn.classList.add('disabled'); // Add this line
                deleteAllBreaksBtn.style.pointerEvents = 'none'; // Add this line
                deleteAllBreaksBtn.style.opacity = '0.5'; // Add this line
                addActivityBtn.classList.add('hidden');
            } else {
                buttons.forEach(button => {
                    button.classList.remove('disabled');
                    button.style.pointerEvents = 'auto';
                    button.style.opacity = '1';
                });
                addCourseBtn.classList.remove('disabled');
                deleteAllBreaksBtn.classList.remove('disabled'); // Add this line
                deleteAllBreaksBtn.style.pointerEvents = 'auto'; // Add this line
                deleteAllBreaksBtn.style.opacity = '1'; // Add this line
                addActivityBtn.classList.remove('hidden');
            }
        }

        function showForm() {
            const form = document.getElementById('courseInputForm');

            // Hide the no data message when showing the form
            const noDataMessage = document.getElementById('noDataMessage');
            noDataMessage.classList.remove('shown');
            noDataMessage.classList.add('hidden');

            form.classList.remove('hidden');
            form.classList.add('form-transition');
            // Force reflow
            form.offsetHeight;
            form.classList.remove('form-collapse');
            
            form.reset();
            document.getElementById('learningActivities').innerHTML = createActivityHTML(1);
            updateFormHeaderAndStyle(false);
            updateDeleteButtonsVisibility();
            updateUndoButton();

            // Disable all other edit and delete buttons
            document.querySelectorAll('.edit-btn, .delete-btn, .copy-btn, .drag-handle, .add-break-btn, #startTimeBtn, #addCourseBtn, #selectAllBtn, #deleteAllBreaksBtn, #hideAllBreaksBtn').forEach(element => {
                element.classList.add('disabled');
                element.style.pointerEvents = 'none';
                element.style.opacity = '0.5';
            });

            // Disable drag handles
            document.querySelectorAll('.drag-handle').forEach(handle => {
                handle.classList.add('disabled');
            });

            // Initialize Sortable
            const learningActivities = document.getElementById('learningActivities');
            new Sortable(learningActivities, {
                animation: 150,
                handle: '.activity-drag-handle',
                onEnd: function(evt) {
                    renumberActivities();
                    updateDeleteButtonsVisibility();
                }
            });
        }

        function enterEditMode() {
            updateUndoButton();
            // Add this line to add the 'editing' class
            document.getElementById('learningActivities').classList.add('editing');

            // Uncheck and disable all checkboxes
            document.querySelectorAll('.row-checkbox, .day-select-all').forEach(checkbox => {
                checkbox.checked = false;
                checkbox.disabled = true;
                checkbox.style.cursor = 'not-allowed';
                checkbox.style.opacity = '0.5';
            });
            
            // Update menu buttons to reflect no selections
            updateMenuButtons();
            
            // Disable all other edit and delete buttons
            document.querySelectorAll('.edit-btn, .delete-btn, .copy-btn, .drag-handle, .add-break-btn, #startTimeBtn, #addCourseBtn, #deleteAllBreaksBtn, #hideAllBreaksBtn, #selectAllBtn').forEach(element => {
                element.classList.add('disabled');
                element.style.pointerEvents = 'none';
                element.style.opacity = '0.5';
            });
            
            // Show the form header as "Edit Course"
            updateFormHeaderAndStyle(true);
        }

        function exitEditMode() {
            document.getElementById('learningActivities').classList.remove('editing');
            updateUndoButton();

            if (editIndex !== null) {
                restoreActionButtons(editIndex);
            }

            // Re-enable all checkboxes
            document.querySelectorAll('.row-checkbox, .day-select-all').forEach(checkbox => {
                checkbox.disabled = false;
                checkbox.style.cursor = '';
                checkbox.style.opacity = '1';
            });

            // Specifically target and re-enable all buttons, including the break buttons
            const buttonsToRestore = [
                '.edit-btn', '.delete-btn', '.copy-btn', '.drag-handle', 
                '.add-break-btn', '#startTimeBtn', '#addCourseBtn', 
                '#deleteAllBreaksBtn', '#hideAllBreaksBtn'
            ].join(', ');
            
            document.querySelectorAll(buttonsToRestore).forEach(element => {
                element.classList.remove('disabled');
                element.style.pointerEvents = 'auto';
                element.style.opacity = '1';
                element.style.cursor = '';
                element.style.color = '';
            });

            // Reset form and styling
            document.getElementById('courseInputForm').classList.add('hidden');
            document.getElementById('courseInputForm').reset();
            updateFormHeaderAndStyle(false);
            
            // Remove row highlighting
            document.querySelectorAll('.day-table tbody tr').forEach(row => {
                row.classList.remove('highlight');
            });

            // Ensure break buttons are visible if there are breaks
            const hasBreaks = activities.some(activity => activity.isBreak);
            const deleteAllBreaksBtn = document.getElementById('deleteAllBreaksBtn');
            const hideAllBreaksBtn = document.getElementById('hideAllBreaksBtn');
            
            if (hasBreaks) {
                if (deleteAllBreaksBtn) deleteAllBreaksBtn.style.display = 'inline-block';
                if (hideAllBreaksBtn) hideAllBreaksBtn.style.display = 'inline-block';
            } else {
                if (deleteAllBreaksBtn) deleteAllBreaksBtn.style.display = 'none';
                if (hideAllBreaksBtn) hideAllBreaksBtn.style.display = 'none';
            }

            // Reset edit index
            editIndex = null;

            // Re-initialize event listeners
            updateProgramDetails();
        }

        function toggleVisibility() {
            const programDetails = document.getElementById('programDetails');
            const programReport = document.getElementById('programReport');
            const resetBtn = document.getElementById('resetBtn');
            const saveBtn = document.getElementById('saveBtn');
            const deleteAllBreaksBtn = document.getElementById('deleteAllBreaksBtn');
            const hideAllBreaksBtn = document.getElementById('hideAllBreaksBtn');
            const toggleScheduleBtn = document.getElementById('toggleScheduleBtn');
            const startTimeBtn = document.getElementById('startTimeBtn');
            const dayTablesContainer = document.getElementById('dayTablesContainer');
            const noDataMessage = document.getElementById('noDataMessage');
            const togglePlanner = document.getElementById('togglePlannerBtn');
            const hasActivities = Array.isArray(activities) && activities.length > 0;
            const hasBreaks = hasActivities && activities.some(activity => activity.isBreak);

            if (!hasActivities) {
                programDetails.style.display = 'none';
                programReport.style.display = 'none';
                resetBtn.style.display = 'none';
                saveBtn.style.display = 'none';
                deleteAllBreaksBtn.style.display = 'none';
                hideAllBreaksBtn.style.display = 'none';
                toggleScheduleBtn.style.display = 'none'; // Add this
                startTimeBtn.style.display = 'none'; // Add this
                dayTablesContainer.innerHTML = '';
                noDataMessage.classList.remove('hidden'); // Show message
                noDataMessage.classList.add('shown');
                togglePlanner.style.display = 'none';

                // console.log(hasActivities);
                // console.log(noDataMessage.classList);
            } else {
                programDetails.style.display = 'block';
                programReport.style.display = 'block';
                resetBtn.style.display = 'inline-block';
                saveBtn.style.display = 'inline-block';
                deleteAllBreaksBtn.style.display = hasBreaks ? 'inline-block' : 'none';
                hideAllBreaksBtn.style.display = hasBreaks ? 'inline-block' : 'none';
                togglePlanner.style.display = 'block';

                toggleScheduleBtn.style.display = 'inline-block'; // Add this
                startTimeBtn.style.display = 'inline-block'; // Add this
                noDataMessage.classList.add('hidden'); // Hide message
                noDataMessage.classList.remove('shown');
                // console.log(hasActivities)
            }
            updateSectionHeaders();
            updateUndoButton();
            updateMenuButtons();
        }

        function updateFormHeaderAndStyle(isEditing) {
            const formHeader = document.getElementById('courseFormHeader');
            const courseInputForm = document.getElementById('courseInputForm');

            if (courseInputForm.classList.contains('hidden')) {
                formHeader.classList.add('hidden');
            } else {
                formHeader.classList.remove('hidden');
                if (isEditing) {
                    formHeader.textContent = "";
                    courseInputForm.style.backgroundColor = "var(--tr-highlight-teal)";
                    document.getElementById('addActivityBtn').classList.add('hidden'); // Hide "+ Learning Activity" button
                } else {
                    formHeader.textContent = "Create Course";
                    courseInputForm.style.backgroundColor = "var(--tr-gray1)";
                    document.getElementById('addActivityBtn').classList.remove('hidden'); // Show "+ Learning Activity" button
                }
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

        async function resetActivities() {
            const confirmed = await showDialog({type:'danger', title:'Reset Everything', message:'This will permanently delete all courses, breaks, and program names.', okText:'Delete All', cancelText:'Keep'});
            if (confirmed) {
                pushUndo('Reset all data');
                activities = [];
                currentProductName = '';
                currentProgramName = '';
                
                // Reset button states
                const plannerBtn = document.getElementById('togglePlannerBtn');
                const scheduleBtn = document.getElementById('toggleScheduleBtn');
                
                plannerBtn.classList.remove('active');
                scheduleBtn.classList.remove('active');
                plannerBtn.textContent = 'View Planner';
                scheduleBtn.textContent = 'Show Schedule';
                
                arePlannerColumnsHidden = true;
                areTimeColumnsHidden = true;
                
                // Rest of your reset code...
                saveToLocalStorage();
                updateProgramDetails();
                generateReport();
                cancelForm();
                toggleVisibility();

                updateSectionHeaders();
            }
        }

        function cancelForm() {
            document.getElementById('learningActivities').classList.remove('editing');

            // Store the current editIndex
            const currentEditIndex = editIndex;

            // Reset editIndex first
            editIndex = null;

            if (currentEditIndex !== null) {
                restoreActionButtons(currentEditIndex);
                const formContainer = document.getElementById('courseForm');
                const form = document.getElementById('courseInputForm');
                const editFormRow = document.getElementById('editFormRow');
                
                if (editFormRow) {
                    form.classList.add('form-collapse');
                    setTimeout(() => {
                        formContainer.appendChild(form);
                        editFormRow.remove();
                        form.classList.remove('form-collapse');
                    }, 300);
                }
            }

            // Clear form and reset states
            const form = document.getElementById('courseInputForm');
            form.classList.add('hidden');
            
            setTimeout(() => {
                form.classList.add('hidden');
                form.classList.remove('form-collapse', 'form-transition');
                form.reset();
            }, 300);

            form.reset();
            updateFormHeaderAndStyle(false);

            // Remove all disabled states
            document.querySelectorAll('.disabled').forEach(element => {
                element.classList.remove('disabled');
            });

            // Re-enable all action buttons explicitly
            document.querySelectorAll('.edit-btn, .delete-btn, .copy-btn, .drag-handle, #startTimeBtn, #deleteAllBreaksBtn, #hideAllBreaksBtn, #selectAllBtn').forEach(element => {
                element.classList.remove('disabled');
                element.style.pointerEvents = 'auto';
                element.style.opacity = '1';
            });

            // Re-enable add course button
            const addCourseBtn = document.getElementById('addCourseBtn');
            if (addCourseBtn) {
                addCourseBtn.classList.remove('disabled');
            }

            // Re-enable row-selection checkboxes
            document.querySelectorAll('input[type="checkbox"].row-checkbox, input[type="checkbox"].day-select-all').forEach(cb => {
                cb.disabled = false;
            });

            // Remove highlighting
            document.querySelectorAll('.day-table tr').forEach(row => {
                row.classList.remove('highlight');
            });

            // Re-initialize the program details to refresh all event listeners
            updateProgramDetails();

            // Ensure visibility updates after canceling the form
            toggleVisibility();

            // // Maintain header color if planner is active
            // if (!arePlannerColumnsHidden) {
            //     const tables = document.querySelectorAll('.day-table');
            //     tables.forEach(table => {
            //         const headers = table.querySelectorAll('th');
            //         headers.forEach(header => {
            //             header.classList.add('tr-orange-header');
            //         });
            //     });
            // }

            // Restore the Plan column visibility
            restorePlanColumnVisibility();
        }


        function restoreActionButtons(rowIndex) {
            const rows = document.querySelectorAll('.day-table tbody tr');
            rows.forEach(row => {
                const actionCell = row.querySelector('.actions-cell');
                if (actionCell && actionCell.dataset.index === String(rowIndex) && actionCell.dataset.originalContent) {
                    actionCell.innerHTML = actionCell.dataset.originalContent;
                    delete actionCell.dataset.originalContent;
                    
                    // Re-enable the restored buttons
                    const buttons = actionCell.querySelectorAll('.edit-btn, .delete-btn, .copy-btn');
                    buttons.forEach(button => {
                        button.classList.remove('disabled');
                        button.style.pointerEvents = 'auto';
                        button.style.opacity = '1';
                    });
                }
            });
        }

        function addActivity() {
            if (editIndex !== null) {
                showDialog({type:'info', title:'One at a Time', message:'You can only edit one learning activity per submission.'});
                return;
            }

            const activities = document.querySelectorAll('.learning-activity');
            const newActivity = createActivityHTML(activities.length + 1);
            document.getElementById('learningActivities').insertAdjacentHTML('beforeend', newActivity);
            initializeDropdowns();
            updateDeleteButtonsVisibility();
            
            // Reinitialize Sortable
            new Sortable(document.getElementById('learningActivities'), {
                handle: '.activity-drag-handle',
                animation: 150,
                onEnd: (evt) => {
                    renumberActivities();
                    updateDeleteButtonsVisibility();
                }
            });
        }

        function handleSubmit(e) {
            e.preventDefault();
            const form = document.getElementById('courseInputForm');
            const newDay = parseInt(form.day.value);

            let isValid = true; // Track if the form is valid

            const newActivities = Array.from(document.querySelectorAll('.learning-activity')).map(activity => {
                const linkInput = activity.querySelector('.link');
                const linkValue = linkInput ? linkInput.value.trim() : '';
                const linkError = activity.querySelector('.link-error');
                const planSelect = activity.querySelector('.plan');
                const notesInput = activity.querySelector('.notes');

                // Validate link format
                if (linkValue && !/^https?:\/\/.+/.test(linkValue)) {
                    linkError.style.display = 'block'; // Show error message
                    isValid = false; // Mark form as invalid
                } else {
                    linkError.style.display = 'none'; // Hide error message
                }

                return {
                    day: newDay,
                    chapter: form.chapter.value,
                    moduleTitle: form.moduleTitle.value,
                    objective: activity.querySelector('.objective').value,
                    cognitiveTask: activity.querySelector('.cognitiveTask').value,
                    learnerActivity: activity.querySelector('.learnerActivity').value,
                    deliveryMethod: activity.querySelector('.deliveryMethod').value,
                    media: activity.querySelector('.media').value,
                    contentType: activity.querySelector('.contentType').value,
                    duration: parseInt(activity.querySelector('.duration').value),
                    link: linkValue,
                    plan: planSelect ? planSelect.value : 'Keep',
                    notes: notesInput ? notesInput.value.trim() : ''
                };
            });

            if (isValid && validateForm(newActivities)) {
                pushUndo(editIndex !== null ? 'Edited activity' : 'Added course');
                if (editIndex !== null) {
                    // Update existing activity
                    const updatedActivity = newActivities[0]; // Since editing only allows one activity
                    const originalDay = activities[editIndex].day;
                    const targetDay = updatedActivity.day;

                    if (originalDay === targetDay) {
                        // If day hasn’t changed, update the activity in its original position
                        activities[editIndex] = updatedActivity;
                    } else {
                        // If day has changed, remove from original position and insert at bottom of target day
                        activities.splice(editIndex, 1); // Remove original
                        const targetDayActivities = activities.filter(a => a.day === targetDay);
                        const insertIndex = targetDayActivities.length > 0 
                            ? activities.lastIndexOf(targetDayActivities[targetDayActivities.length - 1]) + 1 
                            : activities.length;
                        activities.splice(insertIndex, 0, updatedActivity); // Insert at bottom of new day
                    }

                    // Restore action buttons and clean up form
                    restoreActionButtons(editIndex);

                    // Move form back to original container
                    const formContainer = document.getElementById('courseForm');
                    if (document.getElementById('editFormRow')) {
                        formContainer.appendChild(form);
                        document.getElementById('editFormRow').remove();
                    }

                    editIndex = null;
                } else {
                    // Add new activities at the bottom of the specified day
                    const targetDay = newDay;
                    const targetDayActivities = activities.filter(a => a.day === targetDay);
                    const insertIndex = targetDayActivities.length > 0 
                        ? activities.lastIndexOf(targetDayActivities[targetDayActivities.length - 1]) + 1 
                        : activities.length;
                    activities.splice(insertIndex, 0, ...newActivities);
                }

                // Save and update
                saveToLocalStorage();
                updateProgramDetails();
                generateReport();
                initializeDayCheckboxes();

                // Reset form state
                form.classList.add('hidden');
                form.reset();

                // Reset the learning activities section
                const learningActivitiesContainer = document.getElementById('learningActivities');
                learningActivitiesContainer.classList.remove('editing'); // Remove editing class
                learningActivitiesContainer.innerHTML = createActivityHTML(1); // Create fresh activity with drag handle

                updateFormHeaderAndStyle(false);

                // Remove row highlighting
                document.querySelectorAll('.day-table tbody tr').forEach(row => {
                    row.classList.remove('highlight');
                });

                // Re-enable all buttons and controls
                document.querySelectorAll('.edit-btn, .delete-btn, .copy-btn, .drag-handle, #startTimeBtn, #selectAllBtn').forEach(element => {
                    element.classList.remove('disabled');
                    element.style.pointerEvents = 'auto';
                    element.style.opacity = '1';
                });

                // Re-enable add course button
                const addCourseBtn = document.getElementById('addCourseBtn');
                if (addCourseBtn) {
                    addCourseBtn.classList.remove('disabled');
                }

                // Re-enable "Hide All Breaks" and "Delete All Breaks" buttons
                const deleteAllBreaksBtn = document.getElementById('deleteAllBreaksBtn');
                const hideAllBreaksBtn = document.getElementById('hideAllBreaksBtn');
                if (deleteAllBreaksBtn) {
                    deleteAllBreaksBtn.classList.remove('disabled');
                    deleteAllBreaksBtn.style.pointerEvents = 'auto';
                    deleteAllBreaksBtn.style.opacity = '1';
                }
                if (hideAllBreaksBtn) {
                    hideAllBreaksBtn.classList.remove('disabled');
                    hideAllBreaksBtn.style.pointerEvents = 'auto';
                    hideAllBreaksBtn.style.opacity = '1';
                }

                // Initialize dropdowns for the reset form
                initializeDropdowns();

                // Restore the Plan column visibility
                restorePlanColumnVisibility();

                // Update Days dropdown
                const daysDropdown = document.getElementById('daysDropdown');
                delete daysDropdown.dataset.populated;
                if (!daysDropdown.classList.contains('hidden')) {
                    populateDaysDropdown();
                }

                // Re-enable undo button now that form is closed
                updateUndoButton();
            }
        }

        // Helper function to check if a day table exists
        function dayTableExists(day) {
            return document.querySelector(`.day-table-container .day-header:contains('Day ${day}')`);
        }

        // Helper function to create a new day table
        function createDayTable(day) {
            const dayContainer = document.createElement('div');
            dayContainer.className = 'day-table-container';
            // ... (rest of the table creation code)
            return dayContainer;
        }

        // Helper function to sort activities by day
        function sortActivitiesByDay() {
            activities.sort((a, b) => {
                // First sort by day
                const dayDiff = a.day - b.day;
                if (dayDiff !== 0) return dayDiff;
                
                // If days are equal, maintain original order
                return activities.indexOf(a) - activities.indexOf(b);
            });
        }

        function validateForm(newActivities) {
            for (let activity of newActivities) {
                if (!activity.day || !activity.chapter || !activity.moduleTitle || 
                    !activity.objective || !activity.cognitiveTask || !activity.learnerActivity ||
                    !activity.deliveryMethod || !activity.media || !activity.contentType || 
                    !activity.duration) {
                    showDialog({type:'warning', title:'Incomplete Form', message:'Please fill in all required fields before submitting.'});
                    return false;
                }
            }
            return true;
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

        // Function to populate days dropdown
        function populateDaysDropdown() {
            const daysList = document.getElementById('daysList');
            const uniqueDays = [...new Set(activities.map(a => a.day))].sort((a, b) => a - b);
            
            daysList.innerHTML = uniqueDays.map(day => `
                <div class="day-item">
                    <input type="checkbox" id="day-${day}-checkbox" value="${day}" ${hiddenDays[day] === true ? '' : 'checked'}>
                    <button type="button" class="day-scroll-btn" data-day="${day}">Day ${day}</button>
                </div>
            `).join('') + `
                <div class="day-item">
                    <input type="checkbox" id="all-days-checkbox" checked>
                    <label for="all-days-checkbox">All</label>
                </div>
            `;
            
            uniqueDays.forEach(day => {
                if (!(day in hiddenDays)) {
                    hiddenDays[day] = false;
                }
            });
            
            document.querySelectorAll('#daysList input[type="checkbox"]:not(#all-days-checkbox)').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const day = parseInt(this.value);
                    const dayContainer = document.querySelector(`.day-table-container[data-day="${day}"]`);
                    if (dayContainer) {
                        dayContainer.style.display = this.checked ? '' : 'none';
                        hiddenDays[day] = !this.checked;
                        
                        const allRowCheckboxes = document.querySelectorAll('.row-checkbox');
                        const allHeaderCheckboxes = document.querySelectorAll('.day-select-all');
                        allRowCheckboxes.forEach(cb => cb.checked = false);
                        allHeaderCheckboxes.forEach(cb => cb.checked = false);
                        updateMenuButtons();
                    }
                    
                    const allCheckbox = document.getElementById('all-days-checkbox');
                    const allChecked = Array.from(document.querySelectorAll('#daysList input[type="checkbox"]:not(#all-days-checkbox)'))
                        .every(cb => cb.checked);
                    allCheckbox.checked = allChecked;
                    
                    // Hide Design header if all days are hidden
                    const allDaysHidden = uniqueDays.length > 0 && uniqueDays.every(day => hiddenDays[day] === true);
                    const programDetailsHeader = document.getElementById('programDetailsHeader');
                    if (programDetailsHeader) {
                        programDetailsHeader.style.display = allDaysHidden ? 'none' : '';
                    }
                    
                    updateDaysButtonText();
                });
            });
            
            const allCheckbox = document.getElementById('all-days-checkbox');
            allCheckbox.addEventListener('change', function() {
                const isChecked = this.checked;
                document.querySelectorAll('#daysList input[type="checkbox"]:not(#all-days-checkbox)').forEach(cb => {
                    const day = parseInt(cb.value);
                    const dayContainer = document.querySelector(`.day-table-container[data-day="${day}"]`);
                    cb.checked = isChecked;
                    if (dayContainer) {
                        dayContainer.style.display = isChecked ? '' : 'none';
                        hiddenDays[day] = !isChecked;
                    }
                });
                
                if (!isChecked) {
                    const allRowCheckboxes = document.querySelectorAll('.row-checkbox');
                    const allHeaderCheckboxes = document.querySelectorAll('.day-select-all');
                    allRowCheckboxes.forEach(cb => cb.checked = false);
                    allHeaderCheckboxes.forEach(cb => cb.checked = false);
                    updateMenuButtons();
                }
                
                // Hide Design header if all days are hidden
                const allDaysHidden = uniqueDays.length > 0 && uniqueDays.every(day => hiddenDays[day] === true);
                const programDetailsHeader = document.getElementById('programDetailsHeader');
                if (programDetailsHeader) {
                    programDetailsHeader.style.display = allDaysHidden ? 'none' : '';
                }
                
                updateDaysButtonText();
            });
            
            const allChecked = Array.from(document.querySelectorAll('#daysList input[type="checkbox"]:not(#all-days-checkbox)'))
                .every(cb => cb.checked);
            allCheckbox.checked = allChecked;
            
            document.querySelectorAll('.day-scroll-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const day = parseInt(this.dataset.day);
                    const dayContainer = document.querySelector(`.day-table-container[data-day="${day}"]`);
                    if (dayContainer && dayContainer.style.display !== 'none') {
                        const menuHeight = document.getElementById('menuContainer').offsetHeight;
                        const offset = menuHeight + 20;
                        const topPosition = dayContainer.getBoundingClientRect().top + window.pageYOffset - offset;
                        
                        window.scrollTo({
                            top: topPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            });
            
            // Initial check for Design header visibility
            const allDaysHidden = uniqueDays.length > 0 && uniqueDays.every(day => hiddenDays[day] === true);
            const programDetailsHeader = document.getElementById('programDetailsHeader');
            if (programDetailsHeader) {
                programDetailsHeader.style.display = allDaysHidden ? 'none' : '';
            }
            
            updateDaysButtonText();
        }

        // Function to update Days button text with warning
        function updateDaysButtonText() {
            const daysBtn = document.getElementById('daysBtn');
            const anyHidden = Array.from(document.querySelectorAll('#daysList input[type="checkbox"]'))
                .some(checkbox => !checkbox.checked);
            daysBtn.textContent = anyHidden ? 'Days ⚠' : 'Days';
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


        function updateActivitiesOrder() {
            const newActivities = [];
            document.querySelectorAll('.day-table tbody tr').forEach((row) => {
                const index = parseInt(row.querySelector('.delete-btn').dataset.index);
                newActivities.push(activities[index]);
            });
            activities = newActivities;
        }

        function saveToLocalStorage() {
            localStorage.setItem('activities', JSON.stringify(activities));
            localStorage.setItem('currentProductName', currentProductName);
            localStorage.setItem('currentProgramName', currentProgramName);
            toggleVisibility(); // Ensure visibility updates when activities are saved
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

            // Update numerical tables (unchanged)
            updateNumericalTable('cognitiveTable', reportData.cognitive);
            updateNumericalTable('activityTable', reportData.activity);
            updateNumericalTable('deliveryTable', reportData.delivery);
            updateNumericalTable('mediaTable', reportData.media);
            updateNumericalTable('contentTable', reportData.content);

            // Update pie charts (unchanged)
            updateChart('cognitivePieChart', reportData.cognitive);
            updateChart('activityPieChart', reportData.activity);
            updateChart('deliveryPieChart', reportData.delivery);
            updateChart('mediaPieChart', reportData.media);
            updateChart('contentPieChart', reportData.content);

            // Handle line chart containers visibility
            const lineChartWrappers = document.querySelectorAll('.chart-wrapper:nth-child(3)');
            lineChartWrappers.forEach(wrapper => {
                wrapper.style.display = hasMultipleDays ? 'block' : 'none';
            });

            // Only update line charts if there are multiple days
            if (hasMultipleDays) {
                updateLineChart('cognitiveLineChart', lineReportData.cognitive);
                updateLineChart('activityLineChart', lineReportData.activity);
                updateLineChart('deliveryLineChart', lineReportData.delivery);
                updateLineChart('mediaLineChart', lineReportData.media);
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


        function updateNumericalTable(tableId, data) {
            const table = document.getElementById(tableId);
            // Sort labels by duration descending
            const sorted = data.labels
                .map((label, i) => ({ label, value: data.values[i] }))
                .sort((a, b) => b.value - a.value);
            table.innerHTML = `
                <tr>
                    <th>Category</th>
                    <th>Count</th>
                    <th>Duration</th>
                    <th>Time %</th>
                </tr>
                ${sorted.map(({ label, value }) => `
                    <tr>
                        <td>${label}</td>
                        <td>${data.counts[label]}</td>
                        <td>${value} mins</td>
                        <td>${((value / data.total) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
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

            return {
                labels: days, // X-axis: days
                values: Array.from(categories).map(category => days.map(day => data[day][category] || 0)),
                categories: Array.from(categories), // Legend: categories
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
                            legend: {
                                position: 'top',
                                labels: {
                                    font: { family: "'Plus Jakarta Sans', Clario, sans-serif", size: 12 },
                                    boxWidth: 14,
                                    padding: 10,
                                },
                            },
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
                        const color = CHART_COLORS[index % CHART_COLORS.length];
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
                Information: ['Facts/ Concepts', 'Workflow - Operations/ Admin/ Support'],
                Procedures: ['Procedural - Software/ Tools', 'Procedural - Customer Service'],
                ProblemSolving: ['Problem-Solving - Software/ Tools', 'Problem-Solving - Customer Service']
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

        // Helper functions
        function createActivityHTML(index, activity = {}, isEditing = false) {
            return `
                <div class="learning-activity" data-index="${index}">
                    <span class="activity-drag-handle" title="Reorder">☰</span>
                    <h3>Learning Activity${isEditing ? '' : ` #${index}`}</h3>
                    <button class="delete-activity-btn" style="display: ${index === 1 ? 'none' : 'block'}">×</button>
                    <div class="form-group">
                        <div class="form-group-full">
                            ${createInputField('objective', 'text', 'Learning Objective', activity.objective, 'e.g., Identify key features of the application')}
                        </div>
                    </div>
                    <div class="form-group">
                        ${createSelectField('cognitiveTask', 'Cognitive Task', options.cognitiveTasks, activity.cognitiveTask)}
                        ${createSelectField('learnerActivity', 'Learner Activity', options.learnerActivities, activity.learnerActivity)}
                        ${createSelectField('deliveryMethod', 'Delivery Method', options.deliveryMethods, activity.deliveryMethod)}
                    </div>
                    <div class="form-group">
                        ${createSelectField('media', 'Media', options.mediaOptions, activity.media)}
                        ${createSelectField('contentType', 'Content Type', options.contentTypes, activity.contentType)}
                        ${createInputField('duration', 'number', 'Duration (minutes)', activity.duration)}
                    </div>
                    <div class="form-group">
                        <div style="grid-column: span 2;">
                            ${createInputField('link', 'text', 'Link (Optional)', activity.link)}
                            <small style="color: var(--tr-gray2); font-style: italic;">Ensure the link starts with http:// or https://</small>
                            <span class="link-error" style="color: var(--tr-alert-red); font-size: var(--text-base); display: none;">Invalid URL format</span>
                        </div>
                        ${createSelectField('plan', 'Plan', options.planOptions, activity.plan || 'Keep')}
                    </div>
                    <div class="form-group">
                        <div class="form-group-full">
                            ${createInputField('notes', 'text', 'Notes (Optional)', activity.notes || '')}
                        </div>
                    </div>
                </div>
            `;
        }

        function createInputField(className, type, label, value = '', placeholder = '') {
            return `
                <label>${label}
                    <input type="${type}" class="${className}" value="${value}" ${type === 'number' ? 'min="1"' : ''} ${placeholder ? `placeholder="${placeholder}"` : ''}>
                </label>
            `;
        }

        function createSelectField(className, label, options, selectedValue = '') {
            return `
                <label>${label}
                    <select class="${className}">
                        ${options.map(opt => `
                            <option ${opt === selectedValue ? 'selected' : ''}>${opt}</option>
                        `).join('')}
                    </select>
                </label>
            `;
        }

        function initializeDropdowns() {
            if (!options) {
                console.error('Options object is undefined');
                return;
            }

            const dropdowns = document.querySelectorAll('select');
            dropdowns.forEach(select => {
                if (!select) return; // Skip if select element is null

                const className = select.className;
                let optionList;
                let selectedValue = select.value;  // Preserve the selected value

                // Add null checks for options properties
                if (className.includes('cognitiveTask') && options.cognitiveTasks) {
                    optionList = options.cognitiveTasks;
                } else if (className.includes('learnerActivity') && options.learnerActivities) {
                    optionList = options.learnerActivities;
                } else if (className.includes('deliveryMethod') && options.deliveryMethods) {
                    optionList = options.deliveryMethods;
                } else if (className.includes('media') && options.mediaOptions) {
                    optionList = options.mediaOptions;
                } else if (className.includes('contentType') && options.contentTypes) {
                    optionList = options.contentTypes;
                }

                if (optionList) {
                    select.innerHTML = optionList.map(opt => `
                        <option ${opt === selectedValue ? 'selected' : ''}>${opt}</option>
                    `).join('');
                }
            });
        }

        async function handleDeleteActivity(e) {
            if (e.target.classList.contains('delete-activity-btn')) {
                const activityElement = e.target.closest('.learning-activity');
                const activities = document.querySelectorAll('.learning-activity');

                // Check if there's only one activity left
                if (activities.length === 1) {
                    showDialog({type:'warning', title:'Activity Required', message:'Each course needs at least one learning activity.'});
                    return;
                }

                const closeConfirmed = await showDialog({type:'warning', title:'Remove Activity', message:'Remove this learning activity from the form?', okText:'Remove', cancelText:'Keep'});
                if (closeConfirmed) {
                    activityElement.remove();
                    renumberActivities();
                    updateDeleteButtonsVisibility(); // Add this line
                }
            }
        }

        function updateDeleteButtonsVisibility() {
            const activities = document.querySelectorAll('.learning-activity');
            activities.forEach((activity, index) => {
                const deleteButton = activity.querySelector('.delete-activity-btn');
                if (index === 0) {
                    deleteButton.style.display = 'none'; // Hide delete button for first activity
                } else {
                    deleteButton.style.display = 'block'; // Show delete button for other activities
                }
            });
        }

        function renumberActivities() {
            const activities = document.querySelectorAll('.learning-activity');
            activities.forEach((activity, index) => {
                const header = activity.querySelector('h3');
                header.textContent = `Learning Activity #${index + 1}`;
            });
        }

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

        document.getElementById('saveScheduleBtn').addEventListener('click', function(e) {
            // Disable the button to prevent multiple clicks
            this.disabled = true;
            
            const includeSchedule = document.getElementById('includeSchedule');
            if (includeSchedule.checked) {
                createSchedule().finally(() => {
                    // Re-enable the button after operation completes
                    setTimeout(() => { this.disabled = false; }, 1000);
                });
            } else {
                saveToFile().finally(() => {
                    // Re-enable the button after operation completes
                    setTimeout(() => { this.disabled = false; }, 1000);
                });
            }
        });

        document.getElementById('cancelScheduleBtn').addEventListener('click', hideScheduleModal);

        function toggleModalScrollLock(isLocked) {
            if (isLocked) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }

        function showScheduleModal() {
            const modal = document.getElementById('scheduleModal');

            modal.style.display = 'flex';
            toggleModalScrollLock(true);
            
            // Set default values
            const today = new Date();
            const startDateInput = document.getElementById('startDate');
            const startTimeInput = document.getElementById('startTime');
            const timeZoneSelect = document.getElementById('timeZone');
            const includeScheduleCheckbox = document.getElementById('includeSchedule');
            const weekendCheckbox = document.getElementById('includeWeekends');
            
            startDateInput.value = today.toISOString().split('T')[0];
            startTimeInput.value = defaultStartTime;
            
            // Initialize Include Schedule state
            includeScheduleCheckbox.checked = false;
            
            // Initialize time zone select
            initializeTimeZoneSelect();
            
            // Apply initial state
            handleIncludeSchedule();
            
            // Add event listener for the checkbox
            includeScheduleCheckbox.addEventListener('change', handleIncludeSchedule);
        }

        function hideScheduleModal() {
            const modal = document.getElementById('scheduleModal');
            modal.style.display = 'none';
            toggleModalScrollLock(false);
            
            // Remove event listener to prevent duplicates
            const includeScheduleCheckbox = document.getElementById('includeSchedule');
            includeScheduleCheckbox.removeEventListener('change', handleIncludeSchedule);
        }

        function initializeScheduleModalListeners() {
            document.getElementById('saveScheduleBtn').addEventListener('click', function() {
                const includeSchedule = document.getElementById('includeSchedule');
                if (includeSchedule.checked) {
                    createSchedule();
                } else {
                    saveToFile();
                }
            });
            
            document.getElementById('cancelScheduleBtn').addEventListener('click', hideScheduleModal);
        }

        async function createSchedule() {
            // Prevent multiple calls while a file picker is open
            if (isFilePickerActive) {
                console.log('File picker already active, ignoring additional request');
                return;
            }

            const startDate = document.getElementById('startDate').value;
            const startTime = document.getElementById('startTime').value;
            const timeZone = document.getElementById('timeZone').value;
            const includeWeekends = document.getElementById('includeWeekends').checked;
            const productName = currentProductName || '';
            const programName = currentProgramName || '';

            if (!startDate || !startTime || !timeZone) {
                showDialog({type:'warning', title:'Missing Details', message:'Please fill in all the schedule details before saving.'});
                return;
            }

            const location = getTimeZoneLocation();

            try {
                isFilePickerActive = true;
                
                const timestamp = getFormattedUTCTimestamp();
                const fileName = generateFileName(productName || 'Unnamed_Product', programName || 'Unnamed_Program', timestamp, true);
                
                let handle;
                try {
                    handle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'Excel Workbook',
                            accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
                        }],
                    });
                } catch (pickerError) {
                    // Handle user cancellation or other picker errors
                    if (pickerError.name !== 'AbortError') {
                        console.error('Error with file picker:', pickerError);
                    }
                    isFilePickerActive = false; // Reset flag
                    return; // Return early to prevent further processing
                }

                const wb = XLSX.utils.book_new();
                const ws_data = [];

                // Headers with "Day Order"
                const headers = [
                    'Product', 'Program', 'Day', 'Day Order', 'Unit (Main Topic)', 'Module (Subtopic)',
                    'Learning Objective', 'Cognitive Task', 'Learner Activity', 'Delivery Method',
                    'Media', 'Type of Content', 'Duration', 'Link', 'Plan', 'Notes',
                    `Start Time (${location})`, `End Time (${location})`, 'Time Zone Offset'
                ];
                ws_data.push(headers);

                function dateToExcelSerial(dateStr, timeStr) {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    const date = new Date(dateStr);
                    date.setHours(hours, minutes, 0, 0);
                    const excelEpoch = new Date(1899, 11, 30);
                    const msPerDay = 24 * 60 * 60 * 1000;
                    return (date - excelEpoch) / msPerDay;
                }

                const groupedByDay = {};
                activities.forEach((activity, index) => {
                    if (!groupedByDay[activity.day]) groupedByDay[activity.day] = [];
                    groupedByDay[activity.day].push({ ...activity, originalIndex: index });
                });

                Object.keys(groupedByDay).sort((a, b) => Number(a) - Number(b)).forEach(day => {
                    let currentDate = new Date(startDate);
                    let daysToAdd = Number(day) - 1;

                    if (!includeWeekends) {
                        let actualDays = 0;
                        let tempDate = new Date(startDate);
                        while (actualDays < daysToAdd) {
                            tempDate.setDate(tempDate.getDate() + 1);
                            if (tempDate.getDay() !== 0 && tempDate.getDay() !== 6) actualDays++;
                        }
                        while (tempDate.getDay() === 0 || tempDate.getDay() === 6) {
                            tempDate.setDate(tempDate.getDate() + 1);
                        }
                        currentDate = tempDate;
                    } else {
                        currentDate.setDate(currentDate.getDate() + daysToAdd);
                    }

                    const formattedDate = currentDate.toISOString().split('T')[0];
                    let currentTime = startTime;

                    groupedByDay[day].forEach((activity, orderIndex) => {
                        const timeZoneOffset = getTimeZoneOffset(timeZone);
                        let startSerial, endSerial;

                        if (activity.plan === 'Remove') {
                            startSerial = '--:--';
                            endSerial = '--:--';
                        } else {
                            startSerial = dateToExcelSerial(formattedDate, currentTime);
                            const endTime = calculateTime(currentTime, activity.duration);
                            endSerial = dateToExcelSerial(formattedDate, endTime);
                            currentTime = endTime;
                        }

                        ws_data.push([
                            productName,
                            programName,
                            Number(activity.day),
                            orderIndex + 1, // Day Order
                            activity.chapter,
                            activity.moduleTitle,
                            activity.objective,
                            activity.cognitiveTask,
                            activity.learnerActivity,
                            activity.deliveryMethod,
                            activity.media,
                            activity.contentType,
                            activity.duration,
                            activity.link || '',
                            activity.isBreak ? 'Keep' : (activity.plan || 'Keep'),
                            activity.notes || '',
                            startSerial,
                            endSerial,
                            timeZoneOffset
                        ]);
                    });
                });

                const ws = XLSX.utils.aoa_to_sheet(ws_data);

                // Format columns
                const range = XLSX.utils.decode_range(ws['!ref']);
                for (let R = 1; R <= range.e.r; R++) {
                    const dayCellRef = XLSX.utils.encode_cell({ r: R, c: 2 });
                    const dayOrderCellRef = XLSX.utils.encode_cell({ r: R, c: 3 });
                    const planCellRef = XLSX.utils.encode_cell({ r: R, c: 14 });
                    const notesCellRef = XLSX.utils.encode_cell({ r: R, c: 15 });
                    const startTimeCellRef = XLSX.utils.encode_cell({ r: R, c: 16 });
                    const endTimeCellRef = XLSX.utils.encode_cell({ r: R, c: 17 });
                    const offsetCellRef = XLSX.utils.encode_cell({ r: R, c: 18 });

                    if (ws[dayCellRef]) { ws[dayCellRef].t = 'n'; ws[dayCellRef].z = '0'; }
                    if (ws[dayOrderCellRef]) { ws[dayOrderCellRef].t = 'n'; ws[dayOrderCellRef].z = '0'; }
                    if (ws[planCellRef]) ws[planCellRef].t = 's';
                    if (ws[notesCellRef]) ws[notesCellRef].t = 's';
                    if (ws[startTimeCellRef] && ws[startTimeCellRef].v !== '--:--') {
                        ws[startTimeCellRef].t = 'n';
                        ws[startTimeCellRef].z = 'yyyy-mm-dd h:mm';
                    }
                    if (ws[endTimeCellRef] && ws[endTimeCellRef].v !== '--:--') {
                        ws[endTimeCellRef].t = 'n';
                        ws[endTimeCellRef].z = 'yyyy-mm-dd h:mm';
                    }
                    if (ws[offsetCellRef]) ws[offsetCellRef].t = 's';
                }

                const optionsData = [
                    ['Cognitive Tasks', 'Learner Activity', 'Delivery Methods', 'Media', 'Type of Content', 'Plan'],
                    ...Array.from({ length: Math.max(
                        options.cognitiveTasks.length,
                        options.learnerActivities.length,
                        options.deliveryMethods.length,
                        options.mediaOptions.length,
                        options.contentTypes.length,
                        options.planOptions.length
                    ) }, (_, i) => [
                        options.cognitiveTasks[i] || '',
                        options.learnerActivities[i] || '',
                        options.deliveryMethods[i] || '',
                        options.mediaOptions[i] || '',
                        options.contentTypes[i] || '',
                        options.planOptions[i] || ''
                    ])
                ];
                const wsOptions = XLSX.utils.aoa_to_sheet(optionsData);

                XLSX.utils.book_append_sheet(wb, ws, "Schedule");
                XLSX.utils.book_append_sheet(wb, wsOptions, "Options");

                const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();

                hideScheduleModal();
                showDialog({type:'success', title:'Schedule Created', message:'Your schedule has been saved successfully.'});
                updateSectionHeaders();
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error creating schedule:', err);
                    showDialog({type:'danger', title:'Schedule Error', message:'Something went wrong: ' + err.message});
                }
            } finally {
                isFilePickerActive = false; // Always reset the flag when done
            }
        }

        function getTimeZoneOffset(timeZoneValue) {
            // Extract the offset value from the time zone string (e.g., "UTC+08:00" -> "+8")
            const match = timeZoneValue.match(/([+-])(\d{2})/);
            if (match) {
                const sign = match[1];
                const hours = parseInt(match[2]);
                return `${sign}${hours}`;
            }
            return "0"; // Default to 0 if no offset found
        }

        function getTimeZoneLocation() {
            const timeZoneSelect = document.getElementById('timeZone');
            const selectedOption = timeZoneSelect.options[timeZoneSelect.selectedIndex];
            const match = selectedOption.text.match(/\((.*?)\)/);
            return match ? match[1] : 'Local';
        }

        function initializeTimeZoneSelect() {
            const timeZoneSelect = document.getElementById('timeZone');
            timeZoneSelect.innerHTML = timeZones.map(tz => 
                `<option value="${tz.value}">${tz.label}</option>`
            ).join('');
        }

        function getBreakSchedule() {
            const selectedBreak = document.querySelector('input[name="breakSchedule"]:checked').value;
            return {
                noBreaks: [],
                mealBreak: [240], // 4th hour only
                fullBreaks: [120, 240, 420] // 2nd, 4th, and 7th hour
            }[selectedBreak];
        }

        function getBreakDuration(breakTime) {
            return breakTime === 240 ? 60 : 15; // 60 minutes for meal break, 15 minutes for other breaks
        }

        function getBreakType(breakTime) {
            return "Break";
        }

        function getNextBreakTime(currentTime, startTime) {
            const breakTimes = getBreakSchedule();
            const elapsedMinutes = (currentTime - new Date(`2000-01-01T${startTime}`)) / 60000;
            
            for (let breakTime of breakTimes) {
                if (elapsedMinutes < breakTime) {
                    return addMinutes(new Date(`2000-01-01T${startTime}`), breakTime);
                }
            }
            return null;
        }

        function createBreakActivity(day, breakType, duration, startTime) {
            // Ensure startTime is a Date object
            const startDateTime = startTime instanceof Date ? startTime : new Date(startTime);
            
            // Calculate end time
            const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

            return {
                day: parseInt(day),
                chapter: breakType,
                moduleTitle: breakType,
                objective: breakType,
                cognitiveTask: breakType,
                learnerActivity: breakType,
                deliveryMethod: breakType,
                media: breakType,
                contentType: breakType,
                duration: duration,
                startTime: startDateTime.toISOString(), // Store as ISO string
                endTime: endDateTime.toISOString()      // Store as ISO string
            };
        }

        function addMinutes(date, minutes) {
            return new Date(date.getTime() + minutes * 60000);
        }

        function formatTime(date) {
            return date.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit'
            });
        }

        function hasPrefilleredBreaks() {
            return activities.some(activity => activity.isBreak);
        }

        async function deleteAllBreaks() {
            const hasBreaks = activities.some(activity => activity.isBreak);
            
            if (!hasBreaks) {
                showDialog({type:'info', title:'No Breaks', message:'There are no break rows to delete.'});
                return;
            }

            const brkConfirmed = await showDialog({type:'danger', title:'Delete All Breaks', message:'This will remove every break row from your training plan.', okText:'Delete All', cancelText:'Keep'});
            if (brkConfirmed) {
                pushUndo('Deleted all breaks');
                // Filter out all break activities
                activities = activities.filter(activity => !activity.isBreak);
                
                // Save and update
                saveToLocalStorage();
                updateProgramDetails();
                generateReport();
                
                // If no activities left, update visibility
                toggleVisibility();
                
                // Uncheck all checkboxes
                document.querySelectorAll('.row-checkbox:checked, .day-select-all:checked').forEach(checkbox => {
                    checkbox.checked = false;
                });
                
                // Update menu buttons to reflect no selections
                updateMenuButtons();

                // Update Days dropdown
                const daysDropdown = document.getElementById('daysDropdown');
                delete daysDropdown.dataset.populated;
                if (!daysDropdown.classList.contains('hidden')) {
                    populateDaysDropdown();
                }
            }
        }

        let areBreaksHidden = false; // Track the current visibility state of breaks

        function toggleBreakVisibility() {
            const breakRows = document.querySelectorAll('.day-table tbody tr');
            const hideAllBreaksBtn = document.getElementById('hideAllBreaksBtn');
            areBreaksHidden = !areBreaksHidden; // Toggle the state

            breakRows.forEach((row, index) => {
                const isBreak = row.querySelector('td:nth-child(7)').textContent.trim().toLowerCase() === 'break';
                if (isBreak) {
                    if (areBreaksHidden) {
                        row.classList.remove('break-visible');
                        row.classList.add('break-hidden');
                        if (index > 0) {
                            breakRows[index - 1].classList.add('previous-row-border');
                        }
                    } else {
                        row.classList.remove('break-hidden');
                        row.classList.add('break-visible');
                        if (index > 0) {
                            breakRows[index - 1].classList.remove('previous-row-border');
                        }
                    }
                }
            });

            hideAllBreaksBtn.textContent = areBreaksHidden ? 'Show Breaks' : 'Hide Breaks';
        }

        function applyBreakVisibility() {
            const breakRows = document.querySelectorAll('.day-table tbody tr');
            breakRows.forEach((row, index) => {
                const isBreak = row.querySelector('td:nth-child(7)')?.textContent.trim().toLowerCase() === 'break';
                if (isBreak) {
                    if (areBreaksHidden) {
                        row.classList.remove('break-visible');
                        row.classList.add('break-hidden');
                        if (index > 0) {
                            breakRows[index - 1].classList.add('previous-row-border');
                        }
                    } else {
                        row.classList.remove('break-hidden');
                        row.classList.add('break-visible');
                        if (index > 0) {
                            breakRows[index - 1].classList.remove('previous-row-border');
                        }
                    }
                }
            });
        }

        function initializeBreakRows() {
            const breakRows = document.querySelectorAll('.day-table tbody tr');
            breakRows.forEach(row => {
                const isBreak = row.querySelector('td:nth-child(2)').textContent.trim().toLowerCase() === 'break';
                if (isBreak) {
                    row.classList.add('break-visible');
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
                    let dominantLabel = data.labels[maxIdx] || '';
                    const pct = ((values[maxIdx] / total) * 100).toFixed(0);
                    if (dominantLabel.length > 18) dominantLabel = dominantLabel.substring(0, 16) + '…';
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = "bold 15px 'Plus Jakarta Sans', Clario, sans-serif";
                    ctx.fillStyle = '#080d16';
                    ctx.fillText(pct + '%', cx, cy - 10);
                    ctx.font = "11px 'Plus Jakarta Sans', Clario, sans-serif";
                    ctx.fillStyle = '#6b7280';
                    ctx.fillText(dominantLabel, cx, cy + 9);
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

        // console.log('Initial activities:', activities);
        // console.log('LocalStorage content:', localStorage.getItem('activities'));
