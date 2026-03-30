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
                hideSavingOverlay();
                isFilePickerActive = false; // Always reset the flag when done
            }
        }
