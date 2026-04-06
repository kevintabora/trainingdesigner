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
                'Video / Recording Review',
                'Reading',
                'Podcast / Audio Review',
                'eLearning - Read, Watch, Listen',
                'eLearning - Interactive',
                'Q&A with Instructor / Expert',
                'Recap & Debrief',
                'Reflection',
                'Facilitated Group Activity',
                'Concept Mapping / Mind Mapping',
                'Pre-Training / Advance Organizer',
                'Worked Example Review',
                'eLearning - Simulate & Practice',
                'Software / Tool Practice',
                'Documentation Practice',
                'Job Aid & Reference Lookup Practice',
                'Shadowing & Job Observation',
                'Role Play / Mock Conversation',
                'Scenario-Based Exercise',
                'Live Group Discussion',
                'Asynchronous Group Discussion',
                'Peer Teaching',
                'Live Customer Practice',
                'Mentorship / Coaching',
                'Knowledge Check',
                'Self Assessment',
                'Peer Assessment',
                'Procedural Skills Assessment',
                'Written Graded Assessment',
                'Graded Practice Conversation',
                'Meet & Greet',
                'Ice Breaker',
                'Learning Game'
            ],
            deliveryMethods: [
                'Instructor-Led',
                'Self-Paced',
                'On-the-Job Training',
                'Microlearning'
            ],
            mediaOptions: [
                'Text Document',
                'Spreadsheet',
                'Activity Sheet / Workbook',
                'Online Article / Web Page',
                'Slideshow',
                'Infographic / Visual Aid',
                'Audio Recording / Podcast',
                'Recorded Lecture',
                'Produced Instructional Video',
                'eLearning Module',
                'Quiz / Survey',
                'Live System / Application',
                'Digital Workspace / Notebook',
                'Collaborative Platform',
                'Discussion Channel',
                'Guest Speaker / SME Session',
                'VR / AR'
            ],
            contentTypes: [
                'Facts / Concepts',
                'Workflow - Operations / Admin / Support',
                'Procedural - Software / Tools',
                'Procedural - Communication Skills',
                'Problem-Solving - Software / Tools',
                'Problem-Solving - Communication Skills'
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

        const LEARNER_ACTIVITY_GROUPS = [
            { id: 'receptive',       label: 'Receptive Instruction',     chartColor: '#e9b045', activities: ['eLearning - Read, Watch, Listen','Lecture Participation','Podcast / Audio Review','Reading','Video / Recording Review'] },
            { id: 'generative',      label: 'Meaning Making',            chartColor: '#0874e3', activities: ['Concept Mapping / Mind Mapping','eLearning - Interactive','Facilitated Group Activity','Pre-Training / Advance Organizer','Q&A with Instructor / Expert','Recap & Debrief','Reflection'] },
            { id: 'guided-practice', label: 'Guided Practice',           chartColor: '#4db299', activities: ['Documentation Practice','eLearning - Simulate & Practice','Job Aid & Reference Lookup Practice','Shadowing & Job Observation','Software / Tool Practice','Worked Example Review'] },
            { id: 'applied-social',  label: 'Applied & Social Learning', chartColor: '#7209b7', activities: ['Asynchronous Group Discussion','Live Customer Practice','Live Group Discussion','Mentorship / Coaching','Peer Teaching','Role Play / Mock Conversation','Scenario-Based Exercise'] },
            { id: 'assessment',      label: 'Assessment',                chartColor: '#e34234', activities: ['Graded Practice Conversation','Knowledge Check','Peer Assessment','Procedural Skills Assessment','Self Assessment','Written Graded Assessment'] },
            { id: 'engagement',      label: 'Engagement & Motivation',   chartColor: '#ffbe0b', activities: ['Ice Breaker','Learning Game','Meet & Greet'] },
        ];

        const MEDIA_GROUPS = [
            { id: 'document',          label: 'Documents & Text',       chartColor: '#e9b045', activities: ['Activity Sheet / Workbook','Online Article / Web Page','Spreadsheet','Text Document'] },
            { id: 'visual',            label: 'Visual Presentation',    chartColor: '#0874e3', activities: ['Infographic / Visual Aid','Slideshow'] },
            { id: 'audio-video',       label: 'Audio & Video',          chartColor: '#4db299', activities: ['Audio Recording / Podcast','Produced Instructional Video','Recorded Lecture'] },
            { id: 'interactive',       label: 'Interactive Digital',    chartColor: '#7209b7', activities: ['Digital Workspace / Notebook','eLearning Module','Live System / Application','Quiz / Survey'] },
            { id: 'collaborative',     label: 'Collaborative & Social', chartColor: '#e34234', activities: ['Collaborative Platform','Discussion Channel'] },
            { id: 'live-experiential', label: 'Live & Experiential',    chartColor: '#ff006e', activities: ['Guest Speaker / SME Session','VR / AR'] },
        ];

        function getActivityGroup(activityName) {
            for (const group of LEARNER_ACTIVITY_GROUPS) {
                if (group.activities.includes(activityName)) return group;
            }
            return null;
        }

        function getMediaGroup(mediaName) {
            for (const group of MEDIA_GROUPS) {
                if (group.activities.includes(mediaName)) return group;
            }
            return null;
        }

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
