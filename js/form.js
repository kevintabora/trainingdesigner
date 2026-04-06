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

            const filterBtn = document.getElementById('filterBtn');

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
                if (filterBtn) { filterBtn.classList.remove('filter-visible'); }
                if (typeof clearAllFilters === 'function') clearAllFilters();

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
                if (filterBtn) { filterBtn.classList.add('filter-visible'); }
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
                        // If day hasn't changed, update the activity in its original position
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

        // Helper functions
        function createActivityHTML(index, activity = {}, isEditing = false) {
            return `
                <div class="learning-activity" data-index="${index}">
                    <span class="activity-drag-handle" title="Reorder">☰</span>
                    <h3>Learning Activity${isEditing ? '' : ` #${index}`}</h3>
                    <button class="delete-activity-btn" style="display: ${index === 1 ? 'none' : 'flex'}" title="Remove activity"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg></button>
                    <div class="form-group">
                        <div class="form-group-full">
                            ${createInputField('objective', 'text', 'Learning Objective', activity.objective, 'e.g., Identify key features of the application')}
                        </div>
                    </div>
                    <div class="form-group">
                        ${createSelectField('cognitiveTask', 'Cognitive Task', options.cognitiveTasks, activity.cognitiveTask)}
                        ${createGroupedSelectHTML('learnerActivity', 'Learner Activity', LEARNER_ACTIVITY_GROUPS, activity.learnerActivity)}
                        ${createSelectField('deliveryMethod', 'Delivery Method', options.deliveryMethods, activity.deliveryMethod)}
                    </div>
                    <div class="form-group">
                        ${createGroupedSelectHTML('media', 'Media', MEDIA_GROUPS, activity.media)}
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

        function createGroupedSelectHTML(className, label, groups, selectedValue = '') {
            const optgroupsHTML = groups.map(group => `
                <optgroup label="${group.label}">
                    ${group.activities.map(activity => `
                        <option value="${activity}" ${activity === selectedValue ? 'selected' : ''}>${activity}</option>
                    `).join('')}
                </optgroup>
            `).join('');
            return `
                <label>${label}
                    <select class="${className}">
                        ${optgroupsHTML}
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

                if (className.includes('learnerActivity')) {
                    select.innerHTML = '';
                    LEARNER_ACTIVITY_GROUPS.forEach(group => {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = group.label;
                        group.activities.forEach(activity => {
                            const opt = document.createElement('option');
                            opt.value = activity;
                            opt.textContent = activity;
                            if (activity === selectedValue) opt.selected = true;
                            optgroup.appendChild(opt);
                        });
                        select.appendChild(optgroup);
                    });
                } else if (className.includes('media')) {
                    select.innerHTML = '';
                    MEDIA_GROUPS.forEach(group => {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = group.label;
                        group.activities.forEach(activity => {
                            const opt = document.createElement('option');
                            opt.value = activity;
                            opt.textContent = activity;
                            if (activity === selectedValue) opt.selected = true;
                            optgroup.appendChild(opt);
                        });
                        select.appendChild(optgroup);
                    });
                } else if (optionList) {
                    select.innerHTML = optionList.map(opt => `
                        <option ${opt === selectedValue ? 'selected' : ''}>${opt}</option>
                    `).join('');
                }
            });
        }
