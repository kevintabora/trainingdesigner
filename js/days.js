        function populateDaysDropdown() {
            const daysList = document.getElementById('daysList');
            if (!daysList) return;
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

                    const allDaysHidden = uniqueDays.length > 0 && uniqueDays.every(d => hiddenDays[d] === true);
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
                    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
                    document.querySelectorAll('.day-select-all').forEach(cb => cb.checked = false);
                    updateMenuButtons();
                }

                const allDaysHidden = uniqueDays.length > 0 && uniqueDays.every(d => hiddenDays[d] === true);
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
                        const topPosition = dayContainer.getBoundingClientRect().top + window.pageYOffset - menuHeight - 20;
                        window.scrollTo({ top: topPosition, behavior: 'smooth' });
                    }
                });
            });

            const allDaysHidden = uniqueDays.length > 0 && uniqueDays.every(d => hiddenDays[d] === true);
            const programDetailsHeader = document.getElementById('programDetailsHeader');
            if (programDetailsHeader) {
                programDetailsHeader.style.display = allDaysHidden ? 'none' : '';
            }

            updateDaysButtonText();
        }

        function updateDaysButtonText() {
            const daysBtn = document.getElementById('daysBtn');
            if (!daysBtn) return;
            const anyHidden = Array.from(document.querySelectorAll('#daysList input[type="checkbox"]'))
                .some(checkbox => !checkbox.checked);
            daysBtn.classList.toggle('has-hidden-days', anyHidden);
        }
