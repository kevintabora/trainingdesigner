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

                showSavingOverlay();

                const wb = new ExcelJS.Workbook();
                const ws = wb.addWorksheet('Schedule');

                // Headers
                ws.addRow([
                    'Product', 'Program', 'Day', 'Day Order', 'Unit (Main Topic)', 'Module (Subtopic)',
                    'Learning Objective', 'Cognitive Task', 'Learner Activity', 'Delivery Method',
                    'Media', 'Type of Content', 'Duration', 'Link', 'Plan', 'Notes',
                    `Start Time (${location})`, `End Time (${location})`, 'Time Zone Offset'
                ]);

                function dateToExcelDate(dateStr, timeStr) {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    const date = new Date(dateStr);
                    date.setHours(hours, minutes, 0, 0);
                    return date;
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
                        let startVal, endVal;

                        if (activity.plan === 'Remove') {
                            startVal = '--:--';
                            endVal = '--:--';
                        } else {
                            startVal = dateToExcelDate(formattedDate, currentTime);
                            const endTime = calculateTime(currentTime, activity.duration);
                            endVal = dateToExcelDate(formattedDate, endTime);
                            currentTime = endTime;
                        }

                        const row = ws.addRow([
                            productName,
                            programName,
                            Number(activity.day),
                            orderIndex + 1,
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
                            startVal,
                            endVal,
                            timeZoneOffset
                        ]);

                        // Apply date format to start/end time cells (columns 17 & 18, 1-indexed)
                        if (startVal instanceof Date) {
                            row.getCell(17).numFmt = 'yyyy-mm-dd h:mm';
                        }
                        if (endVal instanceof Date) {
                            row.getCell(18).numFmt = 'yyyy-mm-dd h:mm';
                        }
                    });
                });

                // Options sheet
                const wsOptions = wb.addWorksheet('Options');
                wsOptions.addRow(['Cognitive Tasks', 'Learner Activity', 'Delivery Methods', 'Media', 'Type of Content', 'Plan']);
                const maxLen = Math.max(
                    options.cognitiveTasks.length,
                    options.learnerActivities.length,
                    options.deliveryMethods.length,
                    options.mediaOptions.length,
                    options.contentTypes.length,
                    options.planOptions.length
                );
                for (let i = 0; i < maxLen; i++) {
                    wsOptions.addRow([
                        options.cognitiveTasks[i] || '',
                        options.learnerActivities[i] || '',
                        options.deliveryMethods[i] || '',
                        options.mediaOptions[i] || '',
                        options.contentTypes[i] || '',
                        options.planOptions[i] || ''
                    ]);
                }

                const excelBuffer = await wb.xlsx.writeBuffer();
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
                hideSavingOverlay();
                isFilePickerActive = false; // Always reset the flag when done
            }
        }
