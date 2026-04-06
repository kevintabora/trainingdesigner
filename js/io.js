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

                showSavingOverlay();

                const wb = XLSX.utils.book_new();
                const ws_data = [];

                // Headers with "Day Order"
                const headers = [
                    'Product', 'Program', 'Day', 'Day Order', 'Unit (Main Topic)', 'Module (Subtopic)',
                    'Learning Objective', 'Cognitive Task', 'Learner Activity', 'Delivery Method',
                    'Media', 'Content Type', 'Duration', 'Link', 'Plan', 'Notes'
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
                const learnerActivitiesList = LEARNER_ACTIVITY_GROUPS.flatMap(g => g.activities);
                const mediaOptionsList = MEDIA_GROUPS.flatMap(g => g.activities);
                const optionsData = [
                    ['Cognitive Task', 'Learner Activity', 'Delivery Method', 'Media', 'Content Type', 'Plan'],
                    ...Array.from({ length: Math.max(
                        options.cognitiveTasks.length,
                        learnerActivitiesList.length,
                        options.deliveryMethods.length,
                        mediaOptionsList.length,
                        options.contentTypes.length,
                        options.planOptions.length
                    ) }, (_, i) => [
                        options.cognitiveTasks[i] || '',
                        learnerActivitiesList[i] || '',
                        options.deliveryMethods[i] || '',
                        mediaOptionsList[i] || '',
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
                hideSavingOverlay();
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
