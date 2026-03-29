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

        function hasPrefilleredBreaks() {
            return activities.some(activity => activity.isBreak);
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
