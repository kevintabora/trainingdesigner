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
        let undoStack = [];

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
