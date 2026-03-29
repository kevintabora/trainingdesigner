        // Add this function to calculate time
        function calculateTime(startTime, durationMinutes) {
            const [hours, minutes] = startTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + durationMinutes;
            const newHours = Math.floor(totalMinutes / 60) % 24; // Use modulo 24 to wrap around
            const newMinutes = totalMinutes % 60;
            return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
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

        function arraysEqual(a, b) {
            return a.length === b.length && a.every((val, index) => val.trim() === b[index].trim());
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

        function toggleModalScrollLock(isLocked) {
            if (isLocked) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }

        function saveToLocalStorage() {
            localStorage.setItem('activities', JSON.stringify(activities));
            localStorage.setItem('currentProductName', currentProductName);
            localStorage.setItem('currentProgramName', currentProgramName);
            toggleVisibility(); // Ensure visibility updates when activities are saved
        }

        function renumberActivities() {
            const activities = document.querySelectorAll('.learning-activity');
            activities.forEach((activity, index) => {
                const header = activity.querySelector('h3');
                header.textContent = `Learning Activity #${index + 1}`;
            });
        }
