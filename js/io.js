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

                isFilePickerActive = true;
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
                    if (pickerError.name !== 'AbortError') {
                        console.error('Error with file picker:', pickerError);
                    }
                    isFilePickerActive = false;
                    return;
                }

                showSavingOverlay();

                const wb = new ExcelJS.Workbook();
                const ws = wb.addWorksheet('Training Program');

                // Headers
                const headers = [
                    'Product', 'Program', 'Day', 'Day Order', 'Unit (Main Topic)', 'Module (Subtopic)',
                    'Learning Objective', 'Cognitive Task', 'Learner Activity', 'Delivery Method',
                    'Media', 'Content Type', 'Duration', 'Link', 'Plan', 'Notes'
                ];
                ws.addRow(headers);

                // Group and order activities
                const groupedByDay = {};
                activities.forEach((activity, index) => {
                    if (!groupedByDay[activity.day]) groupedByDay[activity.day] = [];
                    groupedByDay[activity.day].push({ ...activity, originalIndex: index });
                });

                Object.keys(groupedByDay).sort((a, b) => Number(a) - Number(b)).forEach(day => {
                    groupedByDay[day].forEach((activity, orderIndex) => {
                        ws.addRow([
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
                            activity.plan || 'Keep',
                            activity.notes || ''
                        ]);
                    });
                });

                // Options sheet
                const learnerActivitiesList = LEARNER_ACTIVITY_GROUPS.flatMap(g => g.activities);
                const mediaOptionsList = MEDIA_GROUPS.flatMap(g => g.activities);
                const maxLen = Math.max(
                    options.cognitiveTasks.length,
                    learnerActivitiesList.length,
                    options.deliveryMethods.length,
                    mediaOptionsList.length,
                    options.contentTypes.length,
                    options.planOptions.length
                );

                const wsOptions = wb.addWorksheet('Options');
                wsOptions.addRow(['Cognitive Task', 'Learner Activity', 'Delivery Method', 'Media', 'Content Type', 'Plan']);
                for (let i = 0; i < maxLen; i++) {
                    wsOptions.addRow([
                        options.cognitiveTasks[i] || '',
                        learnerActivitiesList[i] || '',
                        options.deliveryMethods[i] || '',
                        mediaOptionsList[i] || '',
                        options.contentTypes[i] || '',
                        options.planOptions[i] || ''
                    ]);
                }

                // Data validation dropdowns referencing Options sheet
                const optionsRowCount = maxLen + 1; // +1 for header
                const validationMap = [
                    { col: 8,  formulae: [`Options!$A$2:$A$${optionsRowCount}`] }, // Cognitive Task (col H)
                    { col: 9,  formulae: [`Options!$B$2:$B$${optionsRowCount}`] }, // Learner Activity (col I)
                    { col: 10, formulae: [`Options!$C$2:$C$${optionsRowCount}`] }, // Delivery Method (col J)
                    { col: 11, formulae: [`Options!$D$2:$D$${optionsRowCount}`] }, // Media (col K)
                    { col: 12, formulae: [`Options!$E$2:$E$${optionsRowCount}`] }, // Content Type (col L)
                ];

                validationMap.forEach(({ col, formulae }) => {
                    const colLetter = ws.getColumn(col).letter;
                    ws.dataValidations.add(`${colLetter}2:${colLetter}1048576`, {
                        type: 'list',
                        allowBlank: false,
                        formulae: formulae,
                        showErrorMessage: true,
                        errorStyle: 'error',
                        errorTitle: 'Invalid value',
                        error: 'Please select a value from the list'
                    });
                });

                const buffer = await wb.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                if (handle) {
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                } else {
                    // Fallback: trigger browser download
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
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
                isFilePickerActive = false;
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
                    const reader = new FileReader();

                    reader.onload = async function(event) {
                        try {
                            const arrayBuffer = event.target.result;

                            const workbook = new ExcelJS.Workbook();
                            await workbook.xlsx.load(arrayBuffer);
                            const worksheet = workbook.worksheets[0];

                            // Convert worksheet to array-of-arrays (row.values is 1-indexed)
                            const jsonData = [];
                            worksheet.eachRow({ includeEmpty: false }, (row) => {
                                // row.values[0] is undefined (1-based), slice from 1
                                jsonData.push(row.values.slice(1).map(v => {
                                    if (v === null || v === undefined) return '';
                                    // ExcelJS may return rich-text objects or formula results
                                    if (typeof v === 'object' && v.result !== undefined) return v.result;
                                    if (typeof v === 'object' && v.text !== undefined) return v.text;
                                    if (typeof v === 'object' && v.richText !== undefined) {
                                        return v.richText.map(r => r.text).join('');
                                    }
                                    return v;
                                }));
                            });

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

                            // Extract Product and Program names
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
                                'Cognitive Task', 'Learner Activity', 'Delivery Method', 'Media', 'Content Type', 'Duration'];
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
                                    contentType: row[columnIndices['Content Type']],
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
                                return a.dayOrder - b.dayOrder;
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
